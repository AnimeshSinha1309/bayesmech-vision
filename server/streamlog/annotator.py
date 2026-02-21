"""
Annotator — background worker that owns the segmentation server connection,
sends unannotated frames for segmentation, and persists results to .seg.pb files.

Annotation file: recordings/foo.pb -> recordings/foo.seg.pb
Format: length-delimited SegmentationResponse protos (same wire format).
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import Callable, Optional

import aiohttp

_server_root = Path(__file__).parent.parent
_project_root = _server_root.parent
sys.path.append(str(_project_root))
sys.path.append(str(_project_root / "proto"))
sys.path.append(str(_server_root))
from proto import perceiver_pb2, segmentation_pb2

from streamlog.protoio import ProtoIO

logger = logging.getLogger(__name__)

PerceiverDataFrame = perceiver_pb2.PerceiverDataFrame
SegmentationResponse = segmentation_pb2.SegmentationResponse

_seg_io = ProtoIO(SegmentationResponse)

# Key type for annotation lookup: (timestamp_ns, frame_number)
AnnotationKey = tuple[int, int]


def _key(fid: perceiver_pb2.PerceiverFrameIdentifier) -> AnnotationKey:
    return (fid.timestamp_ns, fid.frame_number)


def _seg_path(recording_path: Path) -> Path:
    """recordings/foo.pb -> recordings/foo.seg.pb"""
    return recording_path.with_suffix(".seg.pb")


class Annotator:
    """
    Manages segmentation annotations for recordings.

    - Owns the WebSocket connection to the segmentation server.
    - Loads existing .seg.pb annotations on recording open.
    - Enqueues unannotated frames → sends to seg server → saves results.
    - Waits for all results before finishing (segmentation can take minutes).
    - Notifies dashboards via callback when new annotations arrive.
    """

    # How long to wait for results after sending all frames (seconds).
    RESULT_TIMEOUT = 300

    def __init__(self, host: str = "http://127.0.0.1:8081") -> None:
        # ── Segmentation connection state ──
        self.host = host
        self._ws_url = host.replace("http://", "ws://").replace("https://", "wss://")
        self._session: Optional[aiohttp.ClientSession] = None
        self._ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self._listen_task: Optional[asyncio.Task] = None
        self._retry_task: Optional[asyncio.Task] = None
        self.is_connected = False

        # ── Annotation state ──
        self._annotations: dict[AnnotationKey, SegmentationResponse] = {}
        self._queue: asyncio.Queue[PerceiverDataFrame] = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self._recording_path: Optional[Path] = None
        self._annotation_callback: Optional[Callable] = None
        self._sent_count: int = 0
        self._received_count: int = 0
        self._result_event = asyncio.Event()

    # ── Connection lifecycle ───────────────────────────────────────────────

    async def connect(self) -> None:
        """Connect to segmentation server. Retries in background on failure."""
        try:
            self._session = aiohttp.ClientSession()
            timeout = aiohttp.ClientTimeout(total=3)
            async with self._session.get(f"{self.host}/segment/status", timeout=timeout) as resp:
                if resp.status == 200:
                    logger.info("Connected to segmentation server")
                    self.is_connected = True
                    await self._open_ws()
                    return
        except (aiohttp.ClientConnectorError, asyncio.TimeoutError):
            logger.warning("Segmentation server not available — retrying in background")
        except Exception as e:
            logger.error(f"Error connecting to segmentation server: {e}")

        self.is_connected = False
        self._retry_task = asyncio.create_task(self._retry_loop())

    async def close(self) -> None:
        """Stop the annotation worker and close the segmentation connection."""
        # Stop annotation worker first
        await self.stop()

        # Cancel connection tasks
        if self._retry_task:
            self._retry_task.cancel()
            try:
                await self._retry_task
            except asyncio.CancelledError:
                pass
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        if self._ws and not self._ws.closed:
            await self._ws.close()
        if self._session:
            await self._session.close()
        self.is_connected = False
        logger.info("Annotator closed")

    async def get_status(self) -> dict:
        if not self.is_connected or not self._session:
            return {"connected": False}
        try:
            timeout = aiohttp.ClientTimeout(total=5)
            async with self._session.get(f"{self.host}/segment/status", timeout=timeout) as resp:
                if resp.status == 200:
                    status = await resp.json()
                    status["connected"] = True
                    return status
        except Exception:
            pass
        return {"connected": False}

    # ── Annotation public API ──────────────────────────────────────────────

    def set_annotation_callback(self, cb: Callable) -> None:
        """Set callback(SegmentationResponse) called when a new annotation is ready."""
        self._annotation_callback = cb

    def load_annotations(self, recording_path: Path) -> int:
        """Load existing .seg.pb file into memory dict. Returns count loaded."""
        self._annotations.clear()
        self._recording_path = recording_path
        seg_file = _seg_path(recording_path)
        if not seg_file.exists():
            return 0

        responses = _seg_io.read_file(seg_file)
        for resp in responses:
            k = _key(resp.frame_identifier)
            self._annotations[k] = resp
        logger.info(f"Loaded {len(responses)} annotations from {seg_file.name}")
        return len(responses)

    def annotate_recording(self, frames: list[PerceiverDataFrame]) -> int:
        """Enqueue all unannotated frames for processing. Returns count enqueued."""
        self._sent_count = 0
        self._received_count = 0
        self._result_event.clear()
        enqueued = 0
        for frame in frames:
            k = _key(frame.frame_identifier)
            if k not in self._annotations:
                self._queue.put_nowait(frame)
                enqueued += 1

        if enqueued > 0:
            self._ensure_worker()
            logger.info(f"Enqueued {enqueued} frames for annotation ({len(self._annotations)} already done)")
        else:
            self._result_event.set()

        return enqueued

    def get_annotation(self, ts: int, fn: int) -> Optional[SegmentationResponse]:
        return self._annotations.get((ts, fn))

    def has_annotation(self, ts: int, fn: int) -> bool:
        return (ts, fn) in self._annotations

    def all_annotations(self) -> list[SegmentationResponse]:
        return list(self._annotations.values())

    @property
    def pending_count(self) -> int:
        return self._queue.qsize()

    @property
    def completed_count(self) -> int:
        return len(self._annotations)

    async def stop(self) -> None:
        """Cancel the annotation worker and drain the queue."""
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        self._worker_task = None
        # Drain
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    # ── Connection internals ───────────────────────────────────────────────

    async def _open_ws(self) -> None:
        """Create a session, then open the WebSocket with the session_id."""
        try:
            async with self._session.post(f"{self.host}/segment/session/start") as resp:
                data = await resp.json()
                session_id = data["session_id"]

            self._ws = await self._session.ws_connect(
                f"{self._ws_url}/segment/stream?session_id={session_id}",
                heartbeat=30,
            )
            self._listen_task = asyncio.create_task(self._listen())
            logger.info(f"Segmentation WebSocket connected (session {session_id})")
        except Exception as e:
            logger.error(f"Failed to open seg WS: {e}")
            self.is_connected = False

    async def _listen(self) -> None:
        """Read SegmentationResponse protos from the WebSocket."""
        try:
            async for msg in self._ws:
                if msg.type == aiohttp.WSMsgType.BINARY:
                    resp = segmentation_pb2.SegmentationResponse()
                    try:
                        resp.ParseFromString(msg.data)
                    except Exception as e:
                        logger.warning(f"Failed to parse SegmentationResponse: {e}")
                        continue
                    try:
                        await self._on_seg_result(resp)
                    except Exception as e:
                        logger.error(f"Seg result handler error: {e}", exc_info=True)
                elif msg.type in (aiohttp.WSMsgType.ERROR, aiohttp.WSMsgType.CLOSE):
                    break
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Seg WS listener error: {e}", exc_info=True)
        finally:
            self.is_connected = False

    async def _retry_loop(self) -> None:
        """Retry connecting every 5 seconds."""
        while not self.is_connected:
            await asyncio.sleep(5)
            try:
                if not self._session or self._session.closed:
                    self._session = aiohttp.ClientSession()
                timeout = aiohttp.ClientTimeout(total=3)
                async with self._session.get(f"{self.host}/segment/status", timeout=timeout) as resp:
                    if resp.status == 200:
                        self.is_connected = True
                        await self._open_ws()
                        logger.info("Reconnected to segmentation server")
                        return
            except (aiohttp.ClientConnectorError, asyncio.TimeoutError, Exception):
                pass

    async def _send_frame(self, frame_id: perceiver_pb2.PerceiverFrameIdentifier,
                          image_frame: perceiver_pb2.ImageFrame) -> None:
        """Send a single frame for segmentation. Silently skips if not connected."""
        if not self.is_connected or not self._ws or self._ws.closed:
            return
        req = segmentation_pb2.SegmentationRequest()
        req.frame_identifier.CopyFrom(frame_id)
        req.image_frame.CopyFrom(image_frame)
        try:
            await self._ws.send_bytes(req.SerializeToString())
        except Exception as e:
            logger.debug(f"Error sending frame to seg server: {e}")

    # ── Annotation internals ───────────────────────────────────────────────

    def _ensure_worker(self) -> None:
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._process_loop())

    async def _process_loop(self) -> None:
        """Background worker: send frames to seg server, then wait for results."""
        logger.info("Annotation worker started")
        try:
            # Phase 1: send all queued frames
            while not self._queue.empty():
                frame = await self._queue.get()
                k = _key(frame.frame_identifier)
                if k in self._annotations:
                    continue  # already annotated (race)

                if not self.is_connected:
                    self._queue.put_nowait(frame)
                    await asyncio.sleep(2)
                    continue

                await self._send_frame(
                    frame.frame_identifier,
                    frame.rgb_frame,
                )
                self._sent_count += 1

            # Phase 2: wait for segmentation results to come back
            if self._sent_count > 0 and self._received_count == 0:
                logger.info(f"Sent {self._sent_count} frames, waiting for segmentation results...")
                try:
                    await asyncio.wait_for(self._result_event.wait(), timeout=self.RESULT_TIMEOUT)
                    logger.info(f"Segmentation complete ({self._received_count} results received)")
                except asyncio.TimeoutError:
                    logger.warning(f"Timed out waiting for segmentation results")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Annotation worker error: {e}", exc_info=True)
        finally:
            logger.info("Annotation worker stopped")

    async def _on_seg_result(self, resp: SegmentationResponse) -> None:
        """Handle a segmentation result from the WebSocket listener."""
        k = _key(resp.frame_identifier)
        self._annotations[k] = resp
        self._received_count += 1
        self._result_event.set()

        # Persist to .seg.pb
        self._save_annotation(resp)
        logger.info(f"Annotation received ({self._received_count} total)")

        # Notify dashboards
        if self._annotation_callback:
            try:
                await self._annotation_callback(resp)
            except Exception as e:
                logger.error(f"Annotation callback error: {e}", exc_info=True)

    def _save_annotation(self, resp: SegmentationResponse) -> None:
        """Append a single annotation to the .seg.pb file."""
        if not self._recording_path:
            return
        seg_file = _seg_path(self._recording_path)
        _seg_io.write_file(seg_file, [resp])
