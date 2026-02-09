"""
AR Stream Server - WebSocket server for streaming AR data from Android devices

Endpoints:
  GET  /api/clients             - List connected clients
  GET  /api/health              - Health check
  GET  /api/recordings          - List recordings
  POST /api/segmentation/*      - Enable/disable segmentation
  POST /api/upload_recording    - Upload a recording
  POST /api/playback/*          - Start/stop playback
  WS   /ar-stream               - AR data stream (from Android app)
  WS   /ws/dashboard            - Dashboard real-time updates
  WS   /ws/segmentation         - Segmentation prompts/results
  /    (static)                 - React dashboard (served from dashboard/dist/)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
import yaml
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import io
import base64
import json
from typing import Set

from buffer.client_manager import ClientManager
from playback import PlaybackManager
from segmentation_client import segmentation_client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load config
config_path = Path(__file__).parent / 'config.yaml'
with open(config_path) as f:
    config = yaml.safe_load(f)

app = FastAPI(title="BayesMech CamAlytics Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import protobuf from the root proto/ directory
try:
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    from proto import ar_stream_pb2
except ImportError as e:
    logger.error(f"Failed to import protobuf module: {e}")
    ar_stream_pb2 = None

# --- State ---
client_manager = ClientManager()
dashboard_connections: Set[WebSocket] = set()
latest_frames: dict = {}
latest_segmentation_masks: dict = {}  # client_id -> encoded masks
segmentation_enabled: dict = {}       # client_id -> bool
last_segmentation_time: dict = {}     # client_id -> timestamp
SEGMENTATION_FRAME_INTERVAL = 1.0
playback_manager = PlaybackManager(recordings_dir="recordings")


# ============================================================
#  Lifecycle
# ============================================================

@app.on_event("startup")
async def startup():
    logger.info("Starting BayesMech CamAlytics Server...")
    await segmentation_client.connect()
    segmentation_client.set_result_callback(handle_segmentation_result)

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down server...")
    await segmentation_client.close()


# ============================================================
#  Frame extraction helpers
# ============================================================

VEC3_FIELDS = [
    'linear_acceleration', 'linear_velocity_pose', 'linear_velocity_accel',
    'angular_velocity', 'gravity',
]

def _extract_vec3(msg) -> dict:
    return {'x': msg.x, 'y': msg.y, 'z': msg.z}

def extract_frame_data(ar_frame, client_id: str) -> dict:
    """Extract data from protobuf ARFrame into a plain dict."""
    data = {
        'client_id': client_id,
        'timestamp_ns': ar_frame.timestamp_ns,
        'frame_number': ar_frame.frame_number,
    }

    # Camera data
    if ar_frame.HasField('camera'):
        cam = ar_frame.camera
        camera = {
            'image_width': cam.image_width,
            'image_height': cam.image_height,
            'tracking_state': cam.tracking_state,
        }
        for name, shape in [('intrinsic_matrix', (3, 3)), ('projection_matrix', (4, 4)),
                            ('view_matrix', (4, 4)), ('pose_matrix', (4, 4))]:
            raw = getattr(cam, name)
            if raw:
                camera[name] = np.array(raw).reshape(shape)
        data['camera'] = camera

    # RGB frame
    if ar_frame.HasField('rgb_frame'):
        rgb = ar_frame.rgb_frame
        try:
            if rgb.format == ar_stream_pb2.JPEG:
                data['rgb_image'] = np.array(Image.open(io.BytesIO(rgb.data)))
            elif rgb.format == ar_stream_pb2.RGB_888:
                data['rgb_image'] = np.frombuffer(rgb.data, dtype=np.uint8).reshape(rgb.height, rgb.width, 3)
            else:
                logger.error(f"Unknown RGB format: {rgb.format}")
        except Exception as e:
            logger.error(f"Failed to decode RGB frame: {e}")

    # Depth frame
    if ar_frame.HasField('depth_frame'):
        depth = ar_frame.depth_frame
        try:
            data['depth_map'] = np.frombuffer(depth.data, dtype=np.uint16).reshape(depth.height, depth.width)
            data['depth_range'] = (depth.min_depth_m, depth.max_depth_m)
            if depth.confidence:
                data['depth_confidence'] = np.frombuffer(depth.confidence, dtype=np.uint8).reshape(depth.height, depth.width)
        except Exception as e:
            logger.error(f"Failed to decode depth frame: {e}")

    # Motion / sensor data
    if ar_frame.HasField('motion'):
        motion = ar_frame.motion
        motion_data = {}
        for field in VEC3_FIELDS:
            if motion.HasField(field):
                motion_data[field] = _extract_vec3(getattr(motion, field))
        if motion.HasField('orientation'):
            o = motion.orientation
            motion_data['orientation'] = {'x': o.x, 'y': o.y, 'z': o.z, 'w': o.w}
        if motion_data:
            data['motion'] = motion_data

    return data


# ============================================================
#  Image encoding helpers
# ============================================================

def encode_image_to_base64(image_array: np.ndarray, format='JPEG') -> str:
    buf = io.BytesIO()
    Image.fromarray(image_array).save(buf, format=format)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def encode_depth_to_base64(depth_array: np.ndarray) -> str:
    depth_norm = ((depth_array - depth_array.min()) /
                  (depth_array.max() - depth_array.min()) * 255).astype(np.uint8)
    img = ImageOps.colorize(Image.fromarray(depth_norm).convert('L'), 'black', 'white', 'blue')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def composite_rgb_with_masks(rgb_frame: np.ndarray, encoded_masks: dict) -> np.ndarray:
    """Overlay segmentation masks onto an RGB frame."""
    import cv2
    output = rgb_frame.copy()
    colors = [[255,0,0], [0,255,0], [0,0,255], [255,255,0], [255,0,255], [0,255,255]]

    for idx, (obj_id, mask_base64) in enumerate(encoded_masks.items()):
        try:
            mask_rgba = np.array(Image.open(io.BytesIO(base64.b64decode(mask_base64))))
            mask = mask_rgba[:, :, 3] > 0 if mask_rgba.shape[2] == 4 else mask_rgba[:, :, 0] > 0
            if mask.shape[:2] != rgb_frame.shape[:2]:
                mask = cv2.resize(mask.astype(np.uint8),
                                  (rgb_frame.shape[1], rgb_frame.shape[0]),
                                  interpolation=cv2.INTER_NEAREST).astype(bool)
            output[mask] = (output[mask] * 0.5 + np.array(colors[idx % len(colors)]) * 0.5).astype(np.uint8)
        except Exception as e:
            logger.error(f"Failed to decode mask {obj_id}: {e}")

    return output


# ============================================================
#  Dashboard broadcasting
# ============================================================

async def _broadcast_to_dashboards(msg_json: str):
    """Send a JSON string to all dashboard WebSocket connections."""
    disconnected = set()
    for conn in dashboard_connections:
        try:
            await conn.send_text(msg_json)
        except Exception:
            disconnected.add(conn)
    dashboard_connections.difference_update(disconnected)

async def broadcast_frame_to_dashboards(client_id: str, frame_data: dict):
    """Encode frame data and broadcast to all connected dashboards."""
    if not dashboard_connections:
        return

    msg: dict = {
        'type': 'frame_update',
        'client_id': client_id,
        'timestamp': frame_data.get('timestamp_ns', 0),
        'frame_number': frame_data.get('frame_number', 0),
    }

    # RGB + segmentation overlay
    if 'rgb_image' in frame_data:
        try:
            msg['rgb_frame'] = encode_image_to_base64(frame_data['rgb_image'])
            h, w = frame_data['rgb_image'].shape[:2]
            msg['resolution'] = {'width': w, 'height': h}

            if segmentation_enabled.get(client_id, True) and client_id in latest_segmentation_masks:
                masks = latest_segmentation_masks[client_id]
                if masks:
                    try:
                        msg['segmentation_frame'] = encode_image_to_base64(
                            composite_rgb_with_masks(frame_data['rgb_image'], masks))
                    except Exception as e:
                        logger.error(f"Failed to composite segmentation: {e}")
        except Exception as e:
            logger.error(f"Failed to encode RGB image: {e}")

    # Depth
    if 'depth_map' in frame_data:
        try:
            msg['depth_frame'] = encode_depth_to_base64(frame_data['depth_map'])
        except Exception as e:
            logger.error(f"Failed to encode depth map: {e}")

    # Camera matrices (flatten numpy arrays to lists)
    if 'camera' in frame_data:
        camera = frame_data['camera']
        cam_msg: dict = {}
        for key in ('pose_matrix', 'view_matrix', 'projection_matrix', 'intrinsic_matrix'):
            if key in camera and camera[key] is not None:
                cam_msg[key] = camera[key].flatten().tolist()
        msg['camera'] = cam_msg
        msg['tracking_state'] = camera.get('tracking_state', 0)

    # Motion (already plain dicts)
    if 'motion' in frame_data:
        msg['motion'] = frame_data['motion']

    latest_frames[client_id] = msg
    await _broadcast_to_dashboards(json.dumps(msg))

async def broadcast_segmentation_to_dashboards(client_id: str, encoded_masks: dict, prompt: str):
    if not dashboard_connections:
        return
    await _broadcast_to_dashboards(json.dumps({
        'type': 'segmentation_update',
        'client_id': client_id,
        'masks': encoded_masks,
        'prompt': prompt,
    }))


# ============================================================
#  Segmentation result callback
# ============================================================

async def handle_segmentation_result(data: dict):
    if data.get('type') != 'segmentation_result':
        return
    client_id = data.get('client_id')
    if not segmentation_enabled.get(client_id, True):
        return
    encoded_masks = data.get('masks', {})
    latest_segmentation_masks[client_id] = encoded_masks
    client_manager.increment_seg_output(client_id)
    logger.info(f"Segmentation result for {client_id}: {len(encoded_masks)} masks")
    await broadcast_segmentation_to_dashboards(client_id, encoded_masks, data.get('prompt', 'unknown'))


# ============================================================
#  Playback helper
# ============================================================

def _make_playback_broadcast(playback_client_id: str):
    """Create a broadcast callback for playback frames."""
    async def broadcast_frame(ar_frame):
        frame_data = extract_frame_data(ar_frame, playback_client_id)
        frame_buffer = client_manager.get_frame_buffer(playback_client_id)
        if frame_buffer:
            frame_buffer.add_frame(frame_data)
            client_manager.update_last_frame_time(playback_client_id)
        await broadcast_frame_to_dashboards(playback_client_id, frame_data)
    return broadcast_frame


# ============================================================
#  WebSocket: AR stream (phone -> server)
# ============================================================

@app.websocket("/ar-stream")
async def websocket_endpoint(websocket: WebSocket):
    temp_client_id = f"{websocket.client.host}:{websocket.client.port}"
    client_id = temp_client_id
    device_id = None

    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"Failed to accept connection from {temp_client_id}: {e}")
        return

    if ar_stream_pb2 is None:
        try:
            await websocket.send_text("ERROR: Protobuf not initialized on server")
            await websocket.close(code=1011, reason="Protobuf not initialized")
        except Exception:
            pass
        return

    try:
        await websocket.send_text(f"Connected to AR Stream Server - ID: {temp_client_id}")
    except Exception:
        pass

    try:
        frame_count = 0
        while True:
            data = await websocket.receive_bytes()
            frame_count += 1

            ar_frame = ar_stream_pb2.ARFrame()
            try:
                ar_frame.ParseFromString(data)
            except Exception as e:
                logger.error(f"Failed to parse protobuf from {temp_client_id}: {e}")
                continue

            # Register client on first frame
            if frame_count == 1:
                if ar_frame.device_id:
                    device_id = ar_frame.device_id
                    old_client = client_manager.find_client_by_device_id(device_id)
                    if old_client:
                        client_manager.remove_client(old_client)
                    client_id = device_id
                else:
                    client_id = temp_client_id
                client_manager.add_client(client_id, websocket, device_id=device_id, connection_info=temp_client_id)

            frame_data = extract_frame_data(ar_frame, client_id)

            # Buffer frame
            frame_buffer = client_manager.get_frame_buffer(client_id)
            if frame_buffer:
                frame_buffer.add_frame(frame_data)
                client_manager.update_last_frame_time(client_id)

            # Segmentation (throttled)
            if 'rgb_image' in frame_data and segmentation_enabled.get(client_id, True):
                now = asyncio.get_event_loop().time()
                if now - last_segmentation_time.get(client_id, 0) >= SEGMENTATION_FRAME_INTERVAL:
                    last_segmentation_time[client_id] = now
                    asyncio.create_task(segmentation_client.send_frame(
                        client_id, frame_data['rgb_image'], ar_frame.frame_number))
                    client_manager.increment_seg_request(client_id)

            # Broadcast to dashboards
            if dashboard_connections:
                asyncio.create_task(broadcast_frame_to_dashboards(client_id, frame_data))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Error for client {client_id}: {e}", exc_info=True)
    finally:
        client_manager.remove_client(client_id)
        for d in (segmentation_enabled, last_segmentation_time, latest_segmentation_masks):
            d.pop(client_id, None)


# ============================================================
#  WebSocket: Dashboard
# ============================================================

@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    dashboard_connections.add(websocket)
    logger.info(f"Dashboard connected. Total: {len(dashboard_connections)}")

    try:
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                data = json.loads(message)
                if data.get('action') == 'subscribe':
                    subscribed_client = data.get('client_id')
                    if subscribed_client in latest_frames:
                        await websocket.send_text(json.dumps(latest_frames[subscribed_client]))
            except asyncio.TimeoutError:
                pass
            except json.JSONDecodeError:
                pass
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Dashboard WebSocket error: {e}", exc_info=True)
    finally:
        dashboard_connections.discard(websocket)


# ============================================================
#  WebSocket: Segmentation prompts
# ============================================================

@app.websocket("/ws/segmentation")
async def segmentation_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("Segmentation client connected")

    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)

            try:
                msg_type = data.get('type')
                client_id = data.get('client_id')

                if msg_type in ('add_text_prompt', 'add_point_prompt'):
                    kwargs = {'client_id': client_id}
                    if msg_type == 'add_text_prompt':
                        kwargs['text'] = data.get('text')
                    else:
                        kwargs['points'] = data.get('points')
                        kwargs['labels'] = data.get('labels')
                    await segmentation_client.send_prompt(**kwargs)
                    await websocket.send_text(json.dumps({
                        'type': 'segmentation_queued',
                        'client_id': client_id,
                        'message': 'Segmentation started, results will stream when ready',
                    }))

                elif msg_type == 'clear_masks':
                    await segmentation_client.clear_session(client_id)
                    latest_segmentation_masks.pop(client_id, None)
                    await websocket.send_text(json.dumps({'type': 'masks_cleared', 'client_id': client_id}))

                elif msg_type == 'get_status':
                    status = await segmentation_client.get_status()
                    await websocket.send_text(json.dumps({'type': 'status', 'status': status}))

            except ValueError as e:
                await websocket.send_text(json.dumps({'type': 'error', 'message': str(e)}))
            except Exception as e:
                logger.error(f"Segmentation error: {e}", exc_info=True)
                await websocket.send_text(json.dumps({'type': 'error', 'message': f"Internal error: {e}"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Segmentation WebSocket error: {e}", exc_info=True)


# ============================================================
#  REST API
# ============================================================

@app.get("/api/clients")
async def get_clients():
    clients_data = []
    for client_id in client_manager.get_all_clients():
        buffer = client_manager.get_frame_buffer(client_id)
        if buffer:
            stats = buffer.get_stats()
            seg = client_manager.get_seg_counters(client_id)
            clients_data.append({
                'client_id': stats['client_id'],
                'frame_count': stats['frames_received'],
                'current_fps': round(stats['avg_fps_received'], 1),
                'buffer_size': stats['buffer_size'],
                'max_buffer_size': stats['max_size'],
                'depth_percentage': stats['depth_percentage'],
                'frames_with_depth': stats['frames_with_depth'],
                'frames_without_depth': stats['frames_without_depth'],
                'seg_requests_sent': seg['seg_requests_sent'],
                'seg_outputs_received': seg['seg_outputs_received'],
            })
    return {"clients": clients_data, "count": len(clients_data)}

@app.get("/api/health")
async def health_check():
    seg_status = await segmentation_client.get_status()
    return {
        "version": "split-service",
        "main_server": "running",
        "segmentation_server": "connected" if seg_status.get("connected") else "disconnected",
        "active_clients": len(client_manager.get_all_clients()),
        "dashboard_connections": len(dashboard_connections),
    }

@app.post("/api/segmentation/enable")
async def api_enable_segmentation(request: dict):
    client_id = request.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="Missing client_id")
    segmentation_enabled[client_id] = True
    last_segmentation_time[client_id] = 0
    await segmentation_client.clear_session(client_id)
    latest_segmentation_masks.pop(client_id, None)
    logger.info(f"Segmentation enabled for {client_id}")
    return {"status": "enabled", "client_id": client_id}

@app.post("/api/segmentation/disable")
async def api_disable_segmentation(request: dict):
    client_id = request.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="Missing client_id")
    segmentation_enabled[client_id] = False
    last_segmentation_time.pop(client_id, None)
    await segmentation_client.clear_session(client_id)
    latest_segmentation_masks.pop(client_id, None)
    logger.info(f"Segmentation disabled for {client_id}")
    return {"status": "disabled", "client_id": client_id}

@app.get("/api/recordings")
async def get_recordings():
    return {
        "recordings": [
            {"filename": rec.name, "size_mb": round(rec.stat().st_size / (1024 * 1024), 2), "modified": rec.stat().st_mtime}
            for rec in playback_manager.list_recordings()
        ]
    }

@app.post("/api/playback/start")
async def start_playback(request: dict):
    filename = request.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    try:
        playback_id = f"playback_{filename}"
        client_manager.add_client(playback_id, None)
        await playback_manager.start_playback(filename, _make_playback_broadcast(playback_id), ar_stream_pb2,
                                              request.get("speed", 1.0), request.get("loop", False))
        return {"status": "success", "message": f"Playback started: {filename}"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Playback start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/playback/stop")
async def stop_playback():
    await playback_manager.stop_playback()
    return {"status": "success", "message": "Playback stopped"}

@app.get("/api/playback/status")
async def get_playback_status():
    return playback_manager.get_status()

@app.post("/api/upload_recording")
async def upload_recording(file: UploadFile = File(...)):
    try:
        file_path = playback_manager.recordings_dir / file.filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Uploaded recording: {file.filename} ({len(content)} bytes)")

        playback_id = f"playback_{file.filename}"
        client_manager.add_client(playback_id, None)
        await playback_manager.start_playback(file.filename, _make_playback_broadcast(playback_id),
                                              ar_stream_pb2, speed=1.0, loop=False)
        return {"status": "success", "message": f"Uploaded and started: {file.filename}",
                "filename": file.filename, "size": len(content)}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#  Static file serving (React dashboard) - MUST be last
# ============================================================

dashboard_dist = Path(__file__).parent.parent / 'dashboard' / 'dist'
if dashboard_dist.exists():
    app.mount("/", StaticFiles(directory=str(dashboard_dist), html=True), name="dashboard")
else:
    logger.warning(f"Dashboard build not found at {dashboard_dist}. Run 'npm run build' in dashboard/")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config['server']['host'], port=config['server']['port'], log_level="info")
