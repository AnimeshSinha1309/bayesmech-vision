"""
BayesMech Vision Server

Endpoints
---------
WS  /ar-stream          Android device → push PerceiverDataFrame protos
WS  /ws/dashboard       Dashboard ← subscribe to stream, receive JSON frame updates
GET /api/health         Server status
GET /api/stream         VisionStream stats
GET /api/recordings     List saved .pb recordings
POST /api/playback/start   Load a recording into the stream
POST /api/playback/stop    Stop active replay
GET /api/playback/status   Replay status
POST /api/upload_recording  Upload .pb file and start replay
/   (static)            React dashboard (dashboard/dist/)
"""

import asyncio
import base64
import io
import json
import logging
import sys
import yaml
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps

_root = Path(__file__).parent.parent
sys.path.append(str(_root))
sys.path.append(str(_root / "proto"))  # pb2 files import each other by bare name
from proto import perceiver_pb2

from vision_stream import VisionStream

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-20s  %(levelname)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

_config_path = Path(__file__).parent / "config.yaml"
with open(_config_path) as _f:
    config = yaml.safe_load(_f)

RECORDINGS_DIR = Path(__file__).parent / "recordings"
RECORDINGS_DIR.mkdir(exist_ok=True)

# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(title="BayesMech Vision Server", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global stream ─────────────────────────────────────────────────────────────
# Single VisionStream instance shared by all handlers.
# Downstream services (segmentation, SLAM) import and read from this object.

stream = VisionStream(max_frames=300)

# Active dashboard WebSocket connections
_dashboard_connections: set[WebSocket] = set()


# ═══════════════════════════════════════════════════════════════════════════════
#  Frame → JSON encoding  (dashboard wire format)
# ═══════════════════════════════════════════════════════════════════════════════

ImageFormat = perceiver_pb2.ImageFrame.ImageFormat
DepthFormat = perceiver_pb2.DepthFrame.DepthFormat


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def _encode_rgb(frame: perceiver_pb2.PerceiverDataFrame) -> str | None:
    """Return base64 JPEG string from an RGB ImageFrame."""
    rgb = frame.rgb_frame
    if not rgb.data:
        return None
    if rgb.format == ImageFormat.JPEG:
        return _b64(rgb.data)
    if rgb.format in (ImageFormat.BITMAP_RGB, ImageFormat.BITMAP_RGBA):
        intr = stream.cached_intrinsics
        if not intr:
            return None
        channels = 4 if rgb.format == ImageFormat.BITMAP_RGBA else 3
        try:
            arr = np.frombuffer(rgb.data, dtype=np.uint8).reshape(
                int(intr.image_height), int(intr.image_width), channels
            )
            buf = io.BytesIO()
            Image.fromarray(arr[:, :, :3]).save(buf, format="JPEG", quality=80)
            return _b64(buf.getvalue())
        except Exception as exc:
            logger.debug(f"RGB encode failed: {exc}")
    return None


def _encode_depth(frame: perceiver_pb2.PerceiverDataFrame) -> str | None:
    """Return base64 colorized depth PNG."""
    depth = frame.depth_frame
    if not depth.data:
        return None
    intr = stream.cached_intrinsics
    if not intr or not intr.depth_width or not intr.depth_height:
        return None
    try:
        w, h = int(intr.depth_width), int(intr.depth_height)
        if depth.format == DepthFormat.UINT16_MILLIMETERS:
            arr = np.frombuffer(depth.data, dtype=np.uint16).reshape(h, w)
            arr_f = arr.astype(np.float32)
        elif depth.format == DepthFormat.FLOAT32_METERS:
            arr_f = np.frombuffer(depth.data, dtype=np.float32).reshape(h, w) * 1000
        else:
            return None

        finite = arr_f[arr_f > 0]
        if finite.size == 0:
            return None
        lo, hi = float(finite.min()), float(finite.max())
        norm = ((arr_f - lo) / max(hi - lo, 1e-6) * 255).clip(0, 255).astype(np.uint8)
        img = ImageOps.colorize(Image.fromarray(norm).convert("L"), "black", "white", "blue")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return _b64(buf.getvalue())
    except Exception as exc:
        logger.debug(f"Depth encode failed: {exc}")
        return None


def _vec3_dict(v) -> dict[str, float]:
    return {"x": v.x, "y": v.y, "z": v.z}


def frame_to_dashboard_msg(frame: perceiver_pb2.PerceiverDataFrame) -> dict[str, Any]:
    """Encode a PerceiverDataFrame into the dashboard JSON wire format."""
    ident = frame.frame_identifier
    msg: dict[str, Any] = {
        "type": "frame_update",
        "source": stream.source,
        "device_id": ident.device_id,
        "timestamp_ns": ident.timestamp_ns,
        "frame_number": ident.frame_number,
    }

    rgb_b64 = _encode_rgb(frame)
    if rgb_b64:
        msg["rgb_frame"] = rgb_b64

    depth_b64 = _encode_depth(frame)
    if depth_b64:
        msg["depth_frame"] = depth_b64

    # Camera pose
    pose = frame.camera_pose
    if frame.HasField("camera_pose"):
        msg["camera_pose"] = {
            "position": _vec3_dict(pose.position),
            "rotation": {"x": pose.rotation.x, "y": pose.rotation.y,
                         "z": pose.rotation.z, "w": pose.rotation.w},
        }

    # Camera intrinsics (cached, not per-frame)
    intr = stream.cached_intrinsics
    if intr:
        msg["camera_intrinsics"] = {
            "fx": intr.fx, "fy": intr.fy, "cx": intr.cx, "cy": intr.cy,
            "image_width": intr.image_width, "image_height": intr.image_height,
            "depth_width": intr.depth_width, "depth_height": intr.depth_height,
        }

    # IMU
    imu = frame.imu_data
    if frame.HasField("imu_data"):
        msg["imu"] = {
            "angular_velocity": _vec3_dict(imu.angular_velocity),
            "linear_acceleration": _vec3_dict(imu.linear_acceleration),
            "gravity": _vec3_dict(imu.gravity),
            "magnetic_field": _vec3_dict(imu.magnetic_field),
        }

    # Inferred geometry summary
    geom = frame.inferred_geometry
    if frame.HasField("inferred_geometry"):
        msg["inferred_geometry"] = {
            "plane_count": len(geom.planes),
            "point_cloud_count": len(geom.point_cloud),
        }

    return msg


# ═══════════════════════════════════════════════════════════════════════════════
#  WebSocket: AR stream  (Android → server)
# ═══════════════════════════════════════════════════════════════════════════════

@app.websocket("/ar-stream")
async def ar_stream_ws(websocket: WebSocket):
    addr = f"{websocket.client.host}:{websocket.client.port}"
    await websocket.accept()
    logger.info(f"AR client connected: {addr}")

    # Stop any running replay so the live client takes over
    await stream.stop_replay()
    stream.clear()
    stream.set_source("live")

    try:
        async for raw in _iter_ws_bytes(websocket):
            frame = perceiver_pb2.PerceiverDataFrame()
            try:
                frame.ParseFromString(raw)
            except Exception as exc:
                logger.warning(f"Proto parse error from {addr}: {exc}")
                continue
            stream.push(frame)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error(f"AR stream error ({addr}): {exc}", exc_info=True)
    finally:
        logger.info(f"AR client disconnected: {addr}  (pushed {stream.frame_count} frames)")
        stream.set_source("none")


async def _iter_ws_bytes(ws: WebSocket):
    """Yield binary WebSocket messages until disconnect."""
    while True:
        yield await ws.receive_bytes()


# ═══════════════════════════════════════════════════════════════════════════════
#  WebSocket: Dashboard  (server → browser)
# ═══════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await websocket.accept()
    _dashboard_connections.add(websocket)
    logger.info(f"Dashboard connected  (total: {len(_dashboard_connections)})")

    # Send the latest frame immediately so the UI isn't blank on connect
    latest = stream.latest()
    if latest:
        try:
            await websocket.send_text(json.dumps(frame_to_dashboard_msg(latest)))
        except Exception:
            pass

    # Subscribe: every new frame gets pushed to this client
    async def on_frame(frame: perceiver_pb2.PerceiverDataFrame) -> None:
        try:
            await websocket.send_text(json.dumps(frame_to_dashboard_msg(frame)))
        except Exception:
            pass  # disconnect handled in finally

    unsub = stream.subscribe(on_frame)

    try:
        # Keep connection alive; handle any inbound messages from the dashboard
        while True:
            try:
                text = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                await _handle_dashboard_message(websocket, json.loads(text))
            except asyncio.TimeoutError:
                pass  # heartbeat / keep-alive
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error(f"Dashboard WS error: {exc}", exc_info=True)
    finally:
        unsub()
        _dashboard_connections.discard(websocket)
        logger.info(f"Dashboard disconnected  (total: {len(_dashboard_connections)})")


async def _handle_dashboard_message(ws: WebSocket, msg: dict) -> None:
    """Handle control messages sent from the dashboard over /ws/dashboard."""
    action = msg.get("action")
    if action == "get_stats":
        await ws.send_text(json.dumps({"type": "stats", **stream.stats()}))
    elif action == "get_latest":
        frame = stream.latest()
        if frame:
            await ws.send_text(json.dumps(frame_to_dashboard_msg(frame)))


# ═══════════════════════════════════════════════════════════════════════════════
#  REST API
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {
        "status": "running",
        "version": "2.0.0",
        "dashboard_connections": len(_dashboard_connections),
        **stream.stats(),
    }


@app.get("/api/stream")
async def get_stream_stats():
    return stream.stats()


@app.get("/api/recordings")
async def list_recordings():
    files = sorted(RECORDINGS_DIR.glob("*.pb"), key=lambda p: p.stat().st_mtime, reverse=True)
    return {
        "recordings": [
            {
                "filename": p.name,
                "size_mb": round(p.stat().st_size / (1024 ** 2), 2),
                "modified": p.stat().st_mtime,
            }
            for p in files
        ]
    }


@app.post("/api/playback/start")
async def start_playback(request: dict):
    filename = request.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    path = RECORDINGS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Recording not found: {filename}")
    await stream.start_replay(
        path,
        speed=float(request.get("speed", 1.0)),
        loop=bool(request.get("loop", False)),
    )
    return {"status": "started", "filename": filename}


@app.post("/api/playback/stop")
async def stop_playback():
    await stream.stop_replay()
    return {"status": "stopped"}


@app.get("/api/playback/status")
async def playback_status():
    return {
        "is_replaying": stream.is_replaying,
        "source": stream.source,
    }


@app.post("/api/upload_recording")
async def upload_recording(file: UploadFile = File(...)):
    if not file.filename.endswith(".pb"):
        raise HTTPException(status_code=400, detail="Expected a .pb file")
    dest = RECORDINGS_DIR / file.filename
    content = await file.read()
    dest.write_bytes(content)
    logger.info(f"Uploaded {file.filename} ({len(content) / 1024:.1f} KB)")
    await stream.start_replay(dest, speed=1.0, loop=False)
    return {"status": "uploaded_and_playing", "filename": file.filename, "size": len(content)}


# ═══════════════════════════════════════════════════════════════════════════════
#  Static files (React dashboard)  — must be registered last
# ═══════════════════════════════════════════════════════════════════════════════

_dashboard_dist = Path(__file__).parent.parent / "dashboard" / "dist"
if _dashboard_dist.exists():
    app.mount("/", StaticFiles(directory=str(_dashboard_dist), html=True), name="dashboard")
else:
    logger.warning(f"Dashboard build not found at {_dashboard_dist}. Run 'npm run build' in dashboard/")


# ═══════════════════════════════════════════════════════════════════════════════
#  Entry point
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config["server"]["host"],
        port=config["server"]["port"],
        log_level="info",
    )
