"""
VisionStream — the central data pipeline for PerceiverDataFrame data.

One stream is active at a time.  Its source is either:
  - "live"  — an Android device pushing frames via WebSocket
  - "file"  — a saved .pb recording being replayed
  - "none"  — idle

Consumers subscribe via .subscribe(callback) and receive every new frame.
Downstream services (segmentation, SLAM) call .latest() / .recent() / .sample().

File format: length-delimited protobuf binary
  [uint32 big-endian = N] [N bytes of PerceiverDataFrame] repeated
"""

import asyncio
import logging
import struct
import time
from collections import deque
from pathlib import Path
from typing import Callable, Generator, Literal

import sys
_root = Path(__file__).parent.parent
sys.path.append(str(_root))
sys.path.append(str(_root / "proto"))  # pb2 files import each other by bare name
from proto import perceiver_pb2

logger = logging.getLogger(__name__)

PerceiverDataFrame = perceiver_pb2.PerceiverDataFrame
CameraIntrinsics = perceiver_pb2.CameraIntrinsics

_FRAME_SIZE_LIMIT = 10 * 1024 * 1024  # 10 MB sanity cap per frame


class VisionStream:
    """
    Rolling buffer of PerceiverDataFrame protos with pub/sub semantics.

    Usage
    -----
    stream = VisionStream()

    # Producer (live WebSocket):
    stream.set_source("live", device_id="abc123")
    stream.push(frame)

    # Producer (file replay):
    await stream.start_replay(Path("recordings/foo.pb"), speed=1.0)

    # Consumer (dashboard WebSocket):
    unsub = stream.subscribe(my_async_callback)
    ...
    unsub()

    # Consumer (segmentation / SLAM):
    frame = stream.latest()
    frames = stream.recent(30)
    sampled = stream.sample(every_n=5)
    """

    def __init__(self, max_frames: int = 300):
        self._frames: deque[PerceiverDataFrame] = deque(maxlen=max_frames)
        self._subscribers: list[Callable] = []
        self._source: Literal["none", "live", "file"] = "none"
        self._device_id: str | None = None
        self._frame_count: int = 0
        self._started_at: float = 0.0
        self._replay_task: asyncio.Task | None = None
        # Cache intrinsics (only sent on first frame from device)
        self._cached_intrinsics: CameraIntrinsics | None = None

    # ── Properties ───────────────────────────────────────────────────────────

    @property
    def source(self) -> Literal["none", "live", "file"]:
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
        """Most recently received CameraIntrinsics (sent once per session)."""
        return self._cached_intrinsics

    # ── Produce ──────────────────────────────────────────────────────────────

    def set_source(
        self,
        source: Literal["live", "file", "none"],
        device_id: str | None = None,
    ) -> None:
        self._source = source
        if device_id:
            self._device_id = device_id

    def push(self, frame: PerceiverDataFrame) -> None:
        """Accept a new frame, update state, and fire all subscriber callbacks."""
        if self._frame_count == 0:
            self._started_at = time.monotonic()

        # Latch device_id and intrinsics the first time they appear
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

    # ── Consume ──────────────────────────────────────────────────────────────

    def latest(self) -> PerceiverDataFrame | None:
        """The most recent frame, or None if the stream is empty."""
        return self._frames[-1] if self._frames else None

    def recent(self, n: int = 60) -> list[PerceiverDataFrame]:
        """Last *n* frames in chronological order."""
        frames = list(self._frames)
        return frames[-n:]

    def sample(self, every_n: int = 1) -> list[PerceiverDataFrame]:
        """Every Nth buffered frame — useful for lower-rate downstream services."""
        return list(self._frames)[::every_n]

    # ── Subscribe ────────────────────────────────────────────────────────────

    def subscribe(self, callback: Callable) -> Callable:
        """
        Register an async callback(frame: PerceiverDataFrame).
        Returns an unsubscribe function — call it to stop receiving frames.

        Example
        -------
        unsub = stream.subscribe(my_handler)
        ...
        unsub()
        """
        self._subscribers.append(callback)

        def unsubscribe():
            try:
                self._subscribers.remove(callback)
            except ValueError:
                pass

        return unsubscribe

    # ── File I/O ─────────────────────────────────────────────────────────────

    @staticmethod
    def read_file(path: Path) -> Generator[PerceiverDataFrame, None, None]:
        """
        Generator: yield PerceiverDataFrame objects from a length-delimited .pb file.
        Skips frames that fail to parse rather than crashing.
        """
        with open(path, "rb") as f:
            while True:
                header = f.read(4)
                if len(header) < 4:
                    break
                (length,) = struct.unpack(">I", header)
                if length == 0 or length > _FRAME_SIZE_LIMIT:
                    logger.warning(f"Skipping invalid frame (length={length}) in {path.name}")
                    break
                raw = f.read(length)
                if len(raw) < length:
                    break
                frame = PerceiverDataFrame()
                try:
                    frame.ParseFromString(raw)
                    yield frame
                except Exception as exc:
                    logger.warning(f"Failed to parse frame in {path.name}: {exc}")

    def save(self, path: Path) -> int:
        """
        Write every buffered frame to a length-delimited .pb file.
        Returns the number of frames written.
        """
        path.parent.mkdir(parents=True, exist_ok=True)
        written = 0
        with open(path, "wb") as f:
            for frame in list(self._frames):
                raw = frame.SerializeToString()
                f.write(struct.pack(">I", len(raw)))
                f.write(raw)
                written += 1
        logger.info(f"Saved {written} frames → {path}")
        return written

    # ── Replay ───────────────────────────────────────────────────────────────

    async def start_replay(
        self,
        path: Path,
        speed: float = 1.0,
        loop: bool = False,
    ) -> None:
        """
        Start replaying a saved .pb file as a background task.
        Clears the current stream state first.
        Any previous replay is cancelled.
        """
        await self.stop_replay()
        self.clear()
        self.set_source("file")
        self._replay_task = asyncio.create_task(
            self._run_replay(path, speed, loop),
            name=f"replay:{path.name}",
        )

    async def stop_replay(self) -> None:
        """Cancel any running replay and wait for it to finish."""
        if self._replay_task and not self._replay_task.done():
            self._replay_task.cancel()
            try:
                await self._replay_task
            except asyncio.CancelledError:
                pass
        self._replay_task = None

    async def _run_replay(self, path: Path, speed: float, loop: bool) -> None:
        logger.info(f"Replay start: {path.name}  speed={speed}x  loop={loop}")
        try:
            while True:
                prev_ts: int | None = None
                for frame in VisionStream.read_file(path):
                    ts = frame.frame_identifier.timestamp_ns
                    if prev_ts is not None and ts > prev_ts:
                        delay = (ts - prev_ts) / 1e9 / speed
                        await asyncio.sleep(min(delay, 0.5))  # cap at 500 ms
                    prev_ts = ts
                    self.push(frame)
                if not loop:
                    break
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.error(f"Replay error ({path.name}): {exc}", exc_info=True)
        finally:
            logger.info(f"Replay done: {path.name}")
            if self._source == "file":
                self._source = "none"

    # ── Stats ─────────────────────────────────────────────────────────────────

    def stats(self) -> dict:
        intr = self._cached_intrinsics
        return {
            "source": self._source,
            "device_id": self._device_id,
            "frame_count": self._frame_count,
            "buffered_frames": len(self._frames),
            "fps": round(self.fps, 1),
            "is_replaying": self.is_replaying,
            "intrinsics": {
                "fx": intr.fx, "fy": intr.fy,
                "cx": intr.cx, "cy": intr.cy,
                "image_width": intr.image_width, "image_height": intr.image_height,
                "depth_width": intr.depth_width, "depth_height": intr.depth_height,
            } if intr else None,
        }


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _safe_call(cb: Callable, frame: PerceiverDataFrame) -> None:
    """Call an async subscriber callback, logging but not crashing on errors."""
    try:
        await cb(frame)
    except Exception as exc:
        logger.error(f"Subscriber error: {exc}", exc_info=True)
