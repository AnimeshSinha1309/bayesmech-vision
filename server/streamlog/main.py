"""
BayesMech Vision Server

Endpoints
---------
WS  /ar-stream          Android device -> push PerceiverDataFrame protos
WS  /ws/dashboard       Dashboard <- binary protobuf stream + annotations
GET /api/health         Server status
GET /api/stream         FrameStore stats
GET /api/recordings     List saved .pb recordings
POST /api/playback/start   Load a recording into the store
POST /api/playback/stop    Stop active replay
GET /api/playback/status   Replay status
POST /api/upload_recording  Upload .pb file and start replay
/   (static)            React dashboard (dashboard/dist/)
"""

import asyncio
import logging
import sys
import yaml
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

_server_root = Path(__file__).parent.parent
_project_root = _server_root.parent
sys.path.append(str(_project_root))
sys.path.append(str(_project_root / "proto"))
sys.path.append(str(_server_root))
from proto import perceiver_pb2

from streamlog.frame_store import FrameStore
from streamlog.annotator import Annotator
from streamlog.dashboard_bridge import DashboardBridge

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

RECORDINGS_DIR = _project_root / "recordings"
RECORDINGS_DIR.mkdir(exist_ok=True)

# ── Components ────────────────────────────────────────────────────────────────

store = FrameStore()
annotator = Annotator(
    host=config.get("segmentation", {}).get("host", "http://127.0.0.1:8081"),
)
bridge = DashboardBridge(store, annotator)

# Wire: annotation results -> broadcast to dashboards
annotator.set_annotation_callback(bridge.broadcast_annotation)

# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(title="BayesMech Vision Server", version="3.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await annotator.connect()


@app.on_event("shutdown")
async def _shutdown():
    await annotator.close()


# ── WebSocket: AR stream (Android -> server) ─────────────────────────────────

@app.websocket("/ar-stream")
async def ar_stream_ws(websocket: WebSocket):
    addr = f"{websocket.client.host}:{websocket.client.port}"
    await websocket.accept()
    logger.info(f"AR client connected: {addr}")

    await store.stop_replay()
    store.clear()
    store.set_source("live")

    try:
        while True:
            raw = await websocket.receive_bytes()
            frame = perceiver_pb2.PerceiverDataFrame()
            try:
                frame.ParseFromString(raw)
            except Exception as exc:
                logger.warning(f"Proto parse error from {addr}: {exc}")
                continue
            store.push(frame)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error(f"AR stream error ({addr}): {exc}", exc_info=True)
    finally:
        logger.info(f"AR client disconnected: {addr}  (pushed {store.frame_count} frames)")
        store.set_source("none")


# ── WebSocket: Dashboard (server -> browser) ─────────────────────────────────

@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await bridge.handle_connection(websocket)


# ── REST API ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "running",
        "version": "3.0.0",
        "dashboard_connections": bridge.connection_count,
        **store.stats(),
    }


@app.get("/api/stream")
async def get_stream_stats():
    return store.stats()


@app.get("/api/recordings")
async def list_recordings():
    files = sorted(RECORDINGS_DIR.glob("*.pb"), key=lambda p: p.stat().st_mtime, reverse=True)
    # Exclude .seg.pb files
    files = [p for p in files if not p.name.endswith(".seg.pb")]
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

    await store.stop_replay()
    count = store.load_recording(path)
    ann_count = annotator.load_annotations(path)

    # Diagnostic: compare frame keys vs annotation keys
    frames = store.all_frames()
    if frames and ann_count > 0:
        sample_frame = frames[0].frame_identifier
        sample_ann_key = next(iter(annotator._annotations))
        logger.info(
            f"DIAG frame[0] key: ts={sample_frame.timestamp_ns} fn={sample_frame.frame_number} | "
            f"annotation[0] key: ts={sample_ann_key[0]} fn={sample_ann_key[1]}"
        )
        frame_keys = {(f.frame_identifier.timestamp_ns, f.frame_identifier.frame_number) for f in frames}
        ann_keys = set(annotator._annotations.keys())
        overlap = frame_keys & ann_keys
        logger.info(
            f"DIAG {count} frames, {ann_count} annotations, {len(overlap)} keys overlap"
        )
    else:
        logger.info(f"DIAG {count} frames loaded, {ann_count} annotations loaded")

    annotator.annotate_recording(frames)

    # Start timed replay to subscribers
    await store.start_replay(
        speed=float(request.get("speed", 1.0)),
        loop=bool(request.get("loop", False)),
    )
    return {"status": "started", "filename": filename, "frames": count}


@app.post("/api/playback/stop")
async def stop_playback():
    await store.stop_replay()
    await annotator.stop()
    return {"status": "stopped"}


@app.get("/api/playback/status")
async def playback_status():
    return {
        "is_replaying": store.is_replaying,
        "source": store.source,
    }


@app.post("/api/upload_recording")
async def upload_recording(file: UploadFile = File(...)):
    if not file.filename.endswith(".pb"):
        raise HTTPException(status_code=400, detail="Expected a .pb file")
    dest = RECORDINGS_DIR / file.filename
    content = await file.read()
    dest.write_bytes(content)
    logger.info(f"Uploaded {file.filename} ({len(content) / 1024:.1f} KB)")

    count = store.load_recording(dest)
    ann_count = annotator.load_annotations(dest)

    frames = store.all_frames()
    if frames and ann_count > 0:
        sample_frame = frames[0].frame_identifier
        sample_ann_key = next(iter(annotator._annotations))
        logger.info(
            f"DIAG frame[0] key: ts={sample_frame.timestamp_ns} fn={sample_frame.frame_number} | "
            f"annotation[0] key: ts={sample_ann_key[0]} fn={sample_ann_key[1]}"
        )
        frame_keys = {(f.frame_identifier.timestamp_ns, f.frame_identifier.frame_number) for f in frames}
        ann_keys = set(annotator._annotations.keys())
        overlap = frame_keys & ann_keys
        logger.info(
            f"DIAG {count} frames, {ann_count} annotations, {len(overlap)} keys overlap"
        )
    else:
        logger.info(f"DIAG {count} frames loaded, {ann_count} annotations loaded")

    annotator.annotate_recording(frames)

    await store.start_replay(speed=1.0, loop=False)
    return {"status": "uploaded_and_playing", "filename": file.filename, "size": len(content), "frames": count}


# ── Static files ──────────────────────────────────────────────────────────────

_dashboard_dist = _project_root / "dashboard" / "dist"
if _dashboard_dist.exists():
    app.mount("/", StaticFiles(directory=str(_dashboard_dist), html=True), name="dashboard")
else:
    logger.warning(f"Dashboard build not found at {_dashboard_dist}. Run 'npm run build' in dashboard/")

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config["server"]["host"],
        port=config["server"]["port"],
        log_level="info",
    )
