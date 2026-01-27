"""
AR Stream Server - Simple WebSocket server for streaming AR data from Android devices

Endpoints:
  GET  /              - Dashboard web interface
  GET  /api/clients  - List connected clients (for dashboard)
  WS   /ar-stream    - AR data stream (from Android app)
  WS   /ws/dashboard - Dashboard real-time updates

This server receives RGB and depth data from Android ARCore apps and displays
them in a real-time web dashboard. No processing or storage - just streaming.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import HTMLResponse
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

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load config
config_path = Path(__file__).parent / 'config.yaml'
with open(config_path) as f:
    config = yaml.safe_load(f)

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="BayesMech CamAlytics Server", version="1.0.0")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware to allow WebSocket connections from mobile devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (mobile devices on same network)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize components
client_manager = ClientManager()

# Import protobuf from the proto/ directory
try:
    import sys
    proto_path = Path(__file__).parent / 'proto'
    sys.path.insert(0, str(proto_path))
    import ar_stream_pb2
except ImportError as e:
    logger.error(f"✗ Failed to import protobuf module: {e}")
    logger.error("Check that ar_stream_pb2.py exists in the proto/ directory!")
    ar_stream_pb2 = None


# Dashboard WebSocket connections
dashboard_connections: Set[WebSocket] = set()
# Store latest frame data for each client
latest_frames = {}
# Playback manager
playback_manager = PlaybackManager(recordings_dir="recordings")

@app.on_event("startup")
async def startup():
    pass

@app.on_event("shutdown")
async def shutdown():
    pass

@app.websocket("/ar-stream")
async def websocket_endpoint(websocket: WebSocket):
    # Temporary ID based on connection (will be replaced by device_id from first frame)
    temp_client_id = f"{websocket.client.host}:{websocket.client.port}"
    client_id = temp_client_id  # Will be updated when we get device_id
    device_id = None
    
    # IMPORTANT: Accept connection FIRST to avoid 403 Forbidden errors
    # Then check requirements and close gracefully if needed
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"✗ Failed to accept WebSocket connection from {temp_client_id}: {e}", exc_info=True)
        return
    
    # Now check if protobuf is initialized
    if ar_stream_pb2 is None:
        logger.error(f"Protobuf not initialized - closing connection for {temp_client_id}")
        try:
            await websocket.send_text("ERROR: Protobuf not initialized on server. Run generate_proto.sh")
            await websocket.close(code=1011, reason="Protobuf not initialized")
        except:
            pass
        return

    # Send a welcome message to confirm successful setup
    try:
        await websocket.send_text(f"Connected to AR Stream Server - Temporary ID: {temp_client_id}")
    except Exception as e:
        logger.error(f"Failed to send welcome message to {temp_client_id}: {e}")

    try:
        frame_count = 0
        while True:
            # Receive binary frame
            data = await websocket.receive_bytes()
            frame_count += 1
            
            # Deserialize protobuf
            ar_frame = ar_stream_pb2.ARFrame()
            try:
                ar_frame.ParseFromString(data)
            except Exception as e:
                logger.error(f"Failed to parse protobuf from {temp_client_id}: {e}")
                continue

            # On first frame, extract device_id and update client_id
            if frame_count == 1:
                if ar_frame.device_id:
                    device_id = ar_frame.device_id
                    # Check if this device was previously connected
                    old_client = client_manager.find_client_by_device_id(device_id)
                    if old_client:
                        # Remove old client entry
                        client_manager.remove_client(old_client)
                    client_id = device_id
                else:
                    client_id = temp_client_id
                
                # Register client with final ID
                client_manager.add_client(client_id, websocket, device_id=device_id, connection_info=temp_client_id)

            # Extract frame data
            frame_data = extract_frame_data(ar_frame, client_id)

            # Add to buffer
            frame_buffer = client_manager.get_frame_buffer(client_id)
            if frame_buffer:
                frame_buffer.add_frame(frame_data)
                client_manager.update_last_frame_time(client_id)
            
            # Broadcast to dashboard (non-blocking)
            if dashboard_connections:
                asyncio.create_task(broadcast_frame_to_dashboards(client_id, frame_data))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"✗ Error for client {client_id}: {e}", exc_info=True)
        logger.error(f"  Error type: {type(e).__name__}")
        logger.error(f"  Error details: {str(e)}")
    finally:
        client_manager.remove_client(client_id)


def extract_frame_data(ar_frame, client_id: str) -> dict:
    """Extract data from protobuf ARFrame"""
    data = {
        'client_id': client_id,
        'timestamp_ns': ar_frame.timestamp_ns,
        'frame_number': ar_frame.frame_number,
    }
    
    logger.debug(f"Extracting frame {ar_frame.frame_number} from {client_id}")

    # Camera data
    if ar_frame.HasField('camera'):
        cam = ar_frame.camera
        data['camera'] = {}

        if cam.intrinsic_matrix:
            data['camera']['intrinsic_matrix'] = np.array(cam.intrinsic_matrix).reshape(3, 3)

        if cam.projection_matrix:
            data['camera']['projection_matrix'] = np.array(cam.projection_matrix).reshape(4, 4)

        if cam.view_matrix:
            data['camera']['view_matrix'] = np.array(cam.view_matrix).reshape(4, 4)

        if cam.pose_matrix:
            data['camera']['pose_matrix'] = np.array(cam.pose_matrix).reshape(4, 4)

        data['camera']['image_width'] = cam.image_width
        data['camera']['image_height'] = cam.image_height
        data['camera']['tracking_state'] = cam.tracking_state
    else:
        pass

    # RGB frame
    if ar_frame.HasField('rgb_frame'):
        rgb = ar_frame.rgb_frame
        
        try:
            if rgb.format == ar_stream_pb2.JPEG:
                # Decode JPEG using Pillow
                img = Image.open(io.BytesIO(rgb.data))
                data['rgb_image'] = np.array(img)
            elif rgb.format == ar_stream_pb2.RGB_888:
                # Raw RGB
                data['rgb_image'] = np.frombuffer(
                    rgb.data, dtype=np.uint8
                ).reshape(rgb.height, rgb.width, 3)
            else:
                logger.error(f"  ✗ Unknown RGB format: {rgb.format}")
        except Exception as e:
            logger.error(f"✗ Failed to decode RGB frame: {e}", exc_info=True)
    else:
        pass

    # Depth frame (optional)
    if ar_frame.HasField('depth_frame'):
        depth = ar_frame.depth_frame
        
        try:
            # Decode 16-bit depth (millimeters)
            depth_data = np.frombuffer(depth.data, dtype=np.uint16)
            data['depth_map'] = depth_data.reshape(depth.height, depth.width)
            data['depth_range'] = (depth.min_depth_m, depth.max_depth_m)
            # Confidence map if present
            if depth.confidence:
                conf_data = np.frombuffer(depth.confidence, dtype=np.uint8)
                data['depth_confidence'] = conf_data.reshape(depth.height, depth.width)
        except Exception as e:
            logger.error(f"✗ Failed to decode depth frame: {e}", exc_info=True)

    # Motion/sensor data (optional)
    if ar_frame.HasField('motion'):
        motion = ar_frame.motion
        data['motion'] = {}
        
        if motion.HasField('linear_acceleration'):
            data['motion']['linear_acceleration'] = {
                'x': motion.linear_acceleration.x,
                'y': motion.linear_acceleration.y,
                'z': motion.linear_acceleration.z
            }
        
        if motion.HasField('linear_velocity_pose'):
            data['motion']['linear_velocity_pose'] = {
                'x': motion.linear_velocity_pose.x,
                'y': motion.linear_velocity_pose.y,
                'z': motion.linear_velocity_pose.z
            }
        
        if motion.HasField('linear_velocity_accel'):
            data['motion']['linear_velocity_accel'] = {
                'x': motion.linear_velocity_accel.x,
                'y': motion.linear_velocity_accel.y,
                'z': motion.linear_velocity_accel.z
            }
        
        if motion.HasField('angular_velocity'):
            data['motion']['angular_velocity'] = {
                'x': motion.angular_velocity.x,
                'y': motion.angular_velocity.y,
                'z': motion.angular_velocity.z
            }
        
        if motion.HasField('gravity'):
            data['motion']['gravity'] = {
                'x': motion.gravity.x,
                'y': motion.gravity.y,
                'z': motion.gravity.z
            }
        
        if motion.HasField('orientation'):
            data['motion']['orientation'] = {
                'x': motion.orientation.x,
                'y': motion.orientation.y,
                'z': motion.orientation.z,
                'w': motion.orientation.w
            }
        
        # Log motion data summary
        if motion.HasField('linear_acceleration') and motion.HasField('angular_velocity'):
            logger.debug(f"  Motion data: accel=[{motion.linear_acceleration.x:.2f}, "
                        f"{motion.linear_acceleration.y:.2f}, {motion.linear_acceleration.z:.2f}] m/s², "
                        f"gyro=[{motion.angular_velocity.x:.2f}, {motion.angular_velocity.y:.2f}, "
                        f"{motion.angular_velocity.z:.2f}] rad/s")

    return data

@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    """Serve the dashboard HTML"""
    dashboard_path = Path(__file__).parent / 'templates' / 'dashboard.html'
    with open(dashboard_path, 'r') as f:
        return f.read()

@app.get("/api/clients")
async def get_clients():
    """Get list of all connected clients with stats"""
    all_clients = client_manager.get_all_clients()
    clients_data = []
    
    for client_id in all_clients:
        buffer = client_manager.get_frame_buffer(client_id)
        if buffer:
            stats = buffer.get_stats()
            # Transform to match dashboard expected format
            client_data = {
                'client_id': stats['client_id'],
                'frame_count': stats['frames_received'],
                'current_fps': round(stats['avg_fps_received'], 1),
                'buffer_size': stats['buffer_size'],
                'max_buffer_size': stats['max_size'],
                'depth_percentage': stats['depth_percentage'],
                'frames_with_depth': stats['frames_with_depth'],
                'frames_without_depth': stats['frames_without_depth'],
            }
            clients_data.append(client_data)
    
    return {
        "clients": clients_data,
        "count": len(clients_data)
    }

@app.get("/api/recordings")
async def get_recordings():
    """Get list of available recordings"""
    recordings = playback_manager.list_recordings()
    return {
        "recordings": [
            {
                "filename": rec.name,
                "size_mb": round(rec.stat().st_size / (1024 * 1024), 2),
                "modified": rec.stat().st_mtime
            }
            for rec in recordings
        ]
    }

@app.post("/api/playback/start")
async def start_playback(request: dict):
    """Start playback of a recording"""
    filename = request.get("filename")
    speed = request.get("speed", 1.0)
    loop = request.get("loop", False)
    
    if not filename:
        return {"error": "Missing filename"}, 400
    
    try:
        # Register playback as a client
        playback_client_id = f"playback_{filename}"
        client_manager.add_client(playback_client_id, None)
        
        async def broadcast_frame(ar_frame):
            """Broadcast frame to all dashboard connections"""
            frame_data = extract_frame_data(ar_frame, playback_client_id)
            
            # Add to buffer so it shows up in client list
            frame_buffer = client_manager.get_frame_buffer(playback_client_id)
            if frame_buffer:
                frame_buffer.add_frame(frame_data)
                client_manager.update_last_frame_time(playback_client_id)
            
            await broadcast_frame_to_dashboards(playback_client_id, frame_data)
        
        await playback_manager.start_playback(filename, broadcast_frame, ar_stream_pb2, speed, loop)
        return {"status": "success", "message": f"Playback started: {filename}"}
    except FileNotFoundError as e:
        return {"error": str(e)}, 404
    except Exception as e:
        logger.error(f"Playback start error: {e}")
        return {"error": str(e)}, 500

@app.post("/api/playback/stop")
async def stop_playback():
    """Stop current playback"""
    await playback_manager.stop_playback()
    return {"status": "success", "message": "Playback stopped"}

@app.get("/api/playback/status")
async def get_playback_status():
    """Get current playback status"""
    return playback_manager.get_status()

@app.post("/api/upload_recording")
async def upload_recording(file: UploadFile = File(...)):
    """Upload a recording file and start playback"""
    try:
        # Save uploaded file to recordings directory
        file_path = playback_manager.recordings_dir / file.filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Uploaded recording: {file.filename} ({len(content)} bytes)")
        
        # Register playback as a client
        playback_client_id = f"playback_{file.filename}"
        client_manager.add_client(playback_client_id, None)
        
        # Automatically start playback
        async def broadcast_frame(ar_frame):
            """Broadcast frame to all dashboard connections"""
            frame_data = extract_frame_data(ar_frame, playback_client_id)
            
            # Add to buffer so it shows up in client list
            frame_buffer = client_manager.get_frame_buffer(playback_client_id)
            if frame_buffer:
                frame_buffer.add_frame(frame_data)
                client_manager.update_last_frame_time(playback_client_id)
            
            await broadcast_frame_to_dashboards(playback_client_id, frame_data)
        
        await playback_manager.start_playback(file.filename, broadcast_frame, ar_stream_pb2, speed=1.0, loop=False)
        
        return {
            "status": "success", 
            "message": f"Uploaded and started playback: {file.filename}",
            "filename": file.filename,
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return {"error": str(e)}, 500


@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket endpoint for dashboard real-time updates"""
    await websocket.accept()
    dashboard_connections.add(websocket)
    logger.info(f"Dashboard client connected. Total: {len(dashboard_connections)}")
    
    subscribed_client = None
    
    try:
        while True:
            try:
                # Receive messages from dashboard
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                data = json.loads(message)
                
                if data.get('action') == 'subscribe':
                    subscribed_client = data.get('client_id')
                    
                    # Send latest frame if available
                    if subscribed_client in latest_frames:
                        await websocket.send_text(json.dumps(latest_frames[subscribed_client]))
                        
            except asyncio.TimeoutError:
                # No message received, just continue
                pass
            except json.JSONDecodeError:
                pass
                
            # Send periodic client list updates
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        logger.info("Dashboard client disconnected")
    except Exception as e:
        logger.error(f"Dashboard WebSocket error: {e}", exc_info=True)
    finally:
        dashboard_connections.discard(websocket)

def encode_image_to_base64(image_array: np.ndarray, format='JPEG') -> str:
    """Convert numpy array image to base64 string"""
    # Log image statistics
    img = Image.fromarray(image_array)
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode('utf-8')
    return encoded

def encode_depth_to_base64(depth_array: np.ndarray) -> str:
    """Convert depth map to base64 PNG (colorized)"""
    # Normalize depth to 0-255
    depth_normalized = ((depth_array - depth_array.min()) / 
                       (depth_array.max() - depth_array.min()) * 255).astype(np.uint8)
    
    # Apply colormap for better visualization
    from PIL import ImageOps
    img = Image.fromarray(depth_normalized)
    img = ImageOps.colorize(img.convert('L'), 'black', 'white', 'blue')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode('utf-8')
    return encoded

async def broadcast_frame_to_dashboards(client_id: str, frame_data: dict):
    """Broadcast frame data to all connected dashboards"""
    if not dashboard_connections:
        return
    
    logger.debug(f"Broadcasting frame from {client_id} to {len(dashboard_connections)} dashboards")
    
    # Prepare dashboard message
    dashboard_msg = {
        'type': 'frame_update',
        'client_id': client_id,
        'timestamp': frame_data.get('timestamp_ns', 0),
        'frame_number': frame_data.get('frame_number', 0),
    }
    
    # Encode RGB image if present
    if 'rgb_image' in frame_data:
        try:
            rgb_base64 = encode_image_to_base64(frame_data['rgb_image'])
            dashboard_msg['rgb_frame'] = rgb_base64
            height, width = frame_data['rgb_image'].shape[:2]
            dashboard_msg['resolution'] = {'width': width, 'height': height}
        except Exception as e:
            logger.error(f"  ✗ Failed to encode RGB image: {e}", exc_info=True)
    else:
        logger.warning(f"✗ No RGB image in frame_data for broadcast")
    
    # Encode depth map if present
    if 'depth_map' in frame_data:
        try:
            depth_base64 = encode_depth_to_base64(frame_data['depth_map'])
            dashboard_msg['depth_frame'] = depth_base64
        except Exception as e:
            logger.error(f"✗ Failed to encode depth map: {e}", exc_info=True)
    else:
        logger.debug(f"✗ No depth map in frame_data for broadcast")
    
    # Add camera data
    if 'camera' in frame_data:
        camera = frame_data['camera']
        dashboard_msg['camera'] = {}
        
        for key in ['pose_matrix', 'view_matrix', 'projection_matrix', 'intrinsic_matrix']:
            if key in camera and camera[key] is not None:
                dashboard_msg['camera'][key] = camera[key].flatten().tolist()
        
        dashboard_msg['tracking_state'] = camera.get('tracking_state', 0)
        logger.debug(f"  Camera data added to broadcast")
    
    # Add motion/sensor data
    if 'motion' in frame_data:
        dashboard_msg['motion'] = frame_data['motion']
        logger.debug(f"  Motion data added to broadcast")
    
    # Store latest frame
    latest_frames[client_id] = dashboard_msg
    
    # Broadcast to all dashboard connections
    msg_json = json.dumps(dashboard_msg)
    logger.debug(f"  Broadcasting JSON message: {len(msg_json)} bytes")
    disconnected = set()
    
    for connection in dashboard_connections:
        try:
            await connection.send_text(msg_json)
        except Exception as e:
            logger.warning(f"Failed to send to dashboard: {e}")
            disconnected.add(connection)
    
    # Remove disconnected clients
    dashboard_connections.difference_update(disconnected)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config['server']['host'],
        port=config['server']['port'],
        log_level="info"
    )
