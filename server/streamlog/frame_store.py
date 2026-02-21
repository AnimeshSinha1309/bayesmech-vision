"""
FrameStore — in-memory buffer of PerceiverDataFrame protos with pub/sub,
recording I/O, and timed replay.
"""

import asyncio
import logging
import time
from pathlib import Path
from typing import Callable, Literal

import sys

_server_root = Path(__file__).parent.parent
_project_root = _server_root.parent
sys.path.append(str(_project_root))
sys.path.append(str(_project_root / "proto"))
sys.path.append(str(_server_root))
from proto import perceiver_pb2

from streamlog.protoio import ProtoIO

logger = logging.getLogger(__name__)

PerceiverDataFrame = perceiver_pb2.PerceiverDataFrame
CameraIntrinsics = perceiver_pb2.CameraIntrinsics

_frame_io = ProtoIO(PerceiverDataFrame)


class FrameStore:
    """
    Stores all frames of the current session/recording in memory.

    Supports:
      - push() for live input (fires subscribers)
      - load_recording() to load all frames at once
      - get_frame() / get_range() / latest() random access
      - subscribe(callback) for new-frame notifications
      - start_replay() / stop_replay() for timed playback
    """

    def __init__(self) -> None:
        self._frames: list[PerceiverDataFrame] = []
        self._subscribers: list[Callable] = []
        self._source: Literal["none", "live", "file"] = "none"
        self._device_id: str | None = None
        self._frame_count: int = 0
        self._started_at: float = 0.0
        self._replay_task: asyncio.Task | None = None
        self._cached_intrinsics: CameraIntrinsics | None = None
        self._current_file: Path | None = None

    # ── Properties ────────────────────────────────────────────────────────

    @property
    def source(self) -> str:
        return self._source

    @property
    def device_id(self) -> str | None:
        return self._device_id

    @property
    def frame_count(self) -> int:
        return self._frame_count

    @property
    def is_replaying(self) -> bool:
        return self._replay_task is not None and not self._replay_task.done()

    @property
    def fps(self) -> float:
        elapsed = time.monotonic() - self._started_at
        return self._frame_count / elapsed if elapsed > 1e-3 else 0.0

    @property
    def cached_intrinsics(self) -> CameraIntrinsics | None:
        return self._cached_intrinsics

    @property
    def current_file(self) -> Path | None:
        return self._current_file

    # ── Produce ───────────────────────────────────────────────────────────

    def set_source(self, source: Literal["live", "file", "none"], device_id: str | None = None) -> None:
        self._source = source
        if device_id:
            self._device_id = device_id

    def push(self, frame: PerceiverDataFrame) -> None:
        """Accept a new frame, update state, and fire all subscriber callbacks."""
        if self._frame_count == 0:
            self._started_at = time.monotonic()

        if not self._device_id and frame.frame_identifier.device_id:
            self._device_id = frame.frame_identifier.device_id

        if frame.HasField("camera_intrinsics"):
            self._cached_intrinsics = frame.camera_intrinsics

        self._frames.append(frame)
        self._frame_count += 1

        for cb in list(self._subscribers):
            asyncio.create_task(_safe_call(cb, frame))

    def clear(self) -> None:
        """Reset to an idle state (keeps subscribers)."""
        self._frames.clear()
        self._frame_count = 0
        self._started_at = 0.0
        self._device_id = None
        self._source = "none"
        self._cached_intrinsics = None
        self._current_file = None

    # ── Consume ───────────────────────────────────────────────────────────

    def latest(self) -> PerceiverDataFrame | None:
        return self._frames[-1] if self._frames else None

    def get_frame(self, index: int) -> PerceiverDataFrame | None:
        if 0 <= index < len(self._frames):
            return self._frames[index]
        return None

    def get_range(self, start: int, end: int) -> list[PerceiverDataFrame]:
        return self._frames[max(0, start): min(end, len(self._frames))]

    def all_frames(self) -> list[PerceiverDataFrame]:
        return list(self._frames)

    # ── Subscribe ─────────────────────────────────────────────────────────

    def subscribe(self, callback: Callable) -> Callable:
        """Register an async callback(frame). Returns an unsubscribe function."""
        self._subscribers.append(callback)

        def unsubscribe():
            try:
                self._subscribers.remove(callback)
            except ValueError:
                pass

        return unsubscribe

    # ── Recording I/O ─────────────────────────────────────────────────────

    def load_recording(self, path: Path) -> int:
        """Load ALL frames from a .pb file into memory. Returns frame count."""
        self.clear()
        self._current_file = path
        self._source = "file"
        self._started_at = time.monotonic()

        for frame in _frame_io.read_file(path):
            if not self._device_id and frame.frame_identifier.device_id:
                self._device_id = frame.frame_identifier.device_id
            if frame.HasField("camera_intrinsics"):
                self._cached_intrinsics = frame.camera_intrinsics
            self._frames.append(frame)
            self._frame_count += 1

        logger.info(f"Loaded {self._frame_count} frames from {path.name}")
        return self._frame_count

    def save(self, path: Path) -> int:
        """Write every buffered frame to a length-delimited .pb file."""
        return _frame_io.write_file(path, list(self._frames))

    # ── Replay ────────────────────────────────────────────────────────────

    async def start_replay(self, speed: float = 1.0, loop: bool = False) -> None:
        """Replay already-loaded frames through subscribers at timed intervals.
        Callers must call load_recording() first."""
        await self.stop_replay()
        if not self._frames:
            return
        name = self._current_file.name if self._current_file else "replay"
        self._replay_task = asyncio.create_task(
            self._run_replay(speed, loop),
            name=f"replay:{name}",
        )

    async def stop_replay(self) -> None:
        if self._replay_task and not self._replay_task.done():
            self._replay_task.cancel()
            try:
                await self._replay_task
            except asyncio.CancelledError:
                pass
        self._replay_task = None

    async def _run_replay(self, speed: float, loop: bool) -> None:
        """Replay loaded frames to subscribers with original timing."""
        logger.info(f"Replay start  speed={speed}x  loop={loop}")
        try:
            while True:
                prev_ts: int | None = None
                for frame in self._frames:
                    ts = frame.frame_identifier.timestamp_ns
                    if prev_ts is not None and ts > prev_ts:
                        delay = (ts - prev_ts) / 1e9 / speed
                        await asyncio.sleep(min(delay, 0.5))
                    prev_ts = ts
                    for cb in list(self._subscribers):
                        asyncio.create_task(_safe_call(cb, frame))
                if not loop:
                    break
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.error(f"Replay error: {exc}", exc_info=True)
        finally:
            logger.info("Replay done")
            if self._source == "file":
                self._source = "none"

    # ── Stats ─────────────────────────────────────────────────────────────

    @property
    def recording_fps(self) -> float:
        """Compute native FPS from frame timestamps (useful for loaded recordings)."""
        if len(self._frames) < 2:
            return 30.0
        first_ts = self._frames[0].frame_identifier.timestamp_ns
        last_ts = self._frames[-1].frame_identifier.timestamp_ns
        duration_s = (last_ts - first_ts) / 1e9
        if duration_s < 1e-3:
            return 30.0
        return (len(self._frames) - 1) / duration_s

    def stats(self) -> dict:
        intr = self._cached_intrinsics
        return {
            "source": self._source,
            "device_id": self._device_id,
            "frame_count": self._frame_count,
            "buffered_frames": len(self._frames),
            "fps": round(self.fps, 1),
            "recording_fps": round(self.recording_fps, 1),
            "is_replaying": self.is_replaying,
            "intrinsics": {
                "fx": intr.fx, "fy": intr.fy,
                "cx": intr.cx, "cy": intr.cy,
                "image_width": intr.image_width, "image_height": intr.image_height,
                "depth_width": intr.depth_width, "depth_height": intr.depth_height,
            } if intr else None,
        }


async def _safe_call(cb: Callable, frame: PerceiverDataFrame) -> None:
    try:
        await cb(frame)
    except Exception as exc:
        logger.error(f"Subscriber error: {exc}", exc_info=True)
