"""
DashboardBridge — binary WebSocket handler for dashboard connections.

Protocol
--------
Server → Dashboard (binary):
  0x01 + length-delimited PerceiverDataFrame(s)
  0x02 + length-delimited SegmentationResponse

Dashboard → Server (text/JSON):
  {"action": "seek", "start": N, "end": M}
  {"action": "get_stats"}
  {"action": "get_annotations"}

Server → Dashboard (text/JSON):
  {"type": "stats", ...}
  {"type": "annotations", ...}
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import WebSocket, WebSocketDisconnect

_server_root = Path(__file__).parent.parent
_project_root = _server_root.parent
sys.path.append(str(_project_root))
sys.path.append(str(_project_root / "proto"))
sys.path.append(str(_server_root))
from proto import perceiver_pb2, segmentation_pb2

from streamlog.protoio import ProtoIO

if TYPE_CHECKING:
    from streamlog.frame_store import FrameStore
    from streamlog.annotator import Annotator

logger = logging.getLogger(__name__)

PREFIX_FRAME = b"\x01"
PREFIX_ANNOTATION = b"\x02"

_frame_io = ProtoIO(perceiver_pb2.PerceiverDataFrame)
_seg_io = ProtoIO(segmentation_pb2.SegmentationResponse)


class DashboardBridge:
    """Manages dashboard WebSocket connections with binary protobuf protocol."""

    def __init__(self, store: "FrameStore", annotator: "Annotator") -> None:
        self._store = store
        self._annotator = annotator
        self._connections: set[WebSocket] = set()

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    async def handle_connection(self, websocket: WebSocket) -> None:
        """Full lifecycle of a single dashboard WS connection."""
        await websocket.accept()
        self._connections.add(websocket)
        logger.info(f"Dashboard connected  (total: {len(self._connections)})")

        # Send latest frame immediately so UI isn't blank
        latest = self._store.latest()
        if latest:
            try:
                await websocket.send_bytes(PREFIX_FRAME + _frame_io.encode([latest]))
            except Exception:
                pass

        # Send existing annotations so segmentation pane isn't blank
        annotations = self._annotator.all_annotations()
        logger.info(f"Dashboard connect: sending {len(annotations)} existing annotations")
        if annotations:
            first = annotations[0]
            fid = first.frame_identifier
            masks = first.masks or []
            mask_sizes = [len(m.mask_data) for m in masks if m.mask_data]
            logger.info(
                f"  first annotation: ts={fid.timestamp_ns} fn={fid.frame_number} "
                f"masks={len(masks)} mask_data_sizes={mask_sizes}"
            )
            try:
                await websocket.send_bytes(
                    PREFIX_ANNOTATION + _seg_io.encode(annotations)
                )
            except Exception:
                pass

        # Subscribe to live frames
        async def on_frame(frame: perceiver_pb2.PerceiverDataFrame) -> None:
            try:
                await websocket.send_bytes(PREFIX_FRAME + _frame_io.encode([frame]))
            except Exception:
                pass

        unsub = self._store.subscribe(on_frame)

        try:
            while True:
                try:
                    text = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    await self._handle_message(websocket, json.loads(text))
                except asyncio.TimeoutError:
                    pass  # keep-alive
                except json.JSONDecodeError:
                    pass
        except WebSocketDisconnect:
            pass
        except Exception as exc:
            logger.error(f"Dashboard WS error: {exc}", exc_info=True)
        finally:
            unsub()
            self._connections.discard(websocket)
            logger.info(f"Dashboard disconnected  (total: {len(self._connections)})")

    async def broadcast_annotation(self, resp: segmentation_pb2.SegmentationResponse) -> None:
        """Push an annotation to all connected dashboards."""
        payload = PREFIX_ANNOTATION + _seg_io.encode([resp])
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_bytes(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.discard(ws)

    # ── Internal ──────────────────────────────────────────────────────────

    async def _handle_message(self, ws: WebSocket, msg: dict) -> None:
        action = msg.get("action")

        if action == "get_stats":
            await ws.send_text(json.dumps({"type": "stats", **self._store.stats()}))

        elif action == "seek":
            start = int(msg.get("start", 0))
            end = int(msg.get("end", start + 1))
            frames = self._store.get_range(start, end)
            if frames:
                payload = PREFIX_FRAME + _frame_io.encode(frames)
                await ws.send_bytes(payload)

                # Send matching annotations so segmentation pane stays in sync
                annotations = []
                for f in frames:
                    fid = f.frame_identifier
                    ann = self._annotator.get_annotation(fid.timestamp_ns, fid.frame_number)
                    if ann is not None:
                        annotations.append(ann)
                    else:
                        logger.debug(
                            f"seek: no annotation for ts={fid.timestamp_ns} fn={fid.frame_number}"
                        )
                logger.info(
                    f"seek [{start}:{end}] → {len(frames)} frames, {len(annotations)} annotations "
                    f"(annotator has {self._annotator.completed_count} total)"
                )
                if annotations:
                    await ws.send_bytes(
                        PREFIX_ANNOTATION + _seg_io.encode(annotations)
                    )

        elif action == "get_annotations":
            annotations = self._annotator.all_annotations()
            if annotations:
                payload = PREFIX_ANNOTATION + _seg_io.encode(annotations)
                await ws.send_bytes(payload)
