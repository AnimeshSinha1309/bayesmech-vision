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

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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

app = FastAPI(title="AR Stream Server", version="1.0.0")

# Add CORS middleware to allow WebSocket connections from mobile devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (mobile devices on same network)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

logger.info("CORS middleware enabled - accepting connections from all origins")

# Initialize components
client_manager = ClientManager()

# Import protobuf after ensuring it exists
try:
    import sys
    # Try both possible proto locations
    proto_path = Path(__file__).parent / 'proto' / 'proto'
    if not proto_path.exists():
        proto_path = Path(__file__).parent / 'proto'
    
    sys.path.insert(0, str(proto_path))
    import ar_stream_pb2
    logger.info(f"✓ Protobuf module loaded successfully from {proto_path}")
except ImportError as e:
    logger.error(f"✗ Failed to import protobuf module: {e}")
    logger.error("Run generate_proto.sh to generate protobuf files!")
    ar_stream_pb2 = None

# Dashboard WebSocket connections
dashboard_connections: Set[WebSocket] = set()
# Store latest frame data for each client
latest_frames = {}

@app.on_event("startup")
async def startup():
    logger.info(f"Server started on {config['server']['host']}:{config['server']['port']}")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Server stopped")

@app.websocket("/ar-stream")
async def websocket_endpoint(websocket: WebSocket):
    # Temporary ID based on connection (will be replaced by device_id from first frame)
    temp_client_id = f"{websocket.client.host}:{websocket.client.port}"
    client_id = temp_client_id  # Will be updated when we get device_id
    device_id = None
    
    # Log connection attempt details
    logger.info(f"=" * 60)
    logger.info(f"WebSocket connection attempt from: {temp_client_id}")
    logger.info(f"  Client host: {websocket.client.host}")
    logger.info(f"  Client port: {websocket.client.port}")
    logger.info(f"  Headers: {dict(websocket.headers)}")
    logger.info(f"=" * 60)
    
    # IMPORTANT: Accept connection FIRST to avoid 403 Forbidden errors
    # Then check requirements and close gracefully if needed
    try:
        await websocket.accept()
        logger.info(f"✓ WebSocket connection ACCEPTED for client {temp_client_id}")
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
                        logger.info(f"✓ Device {device_id} reconnected (was {old_client}, now {temp_client_id})")
                        # Remove old client entry
                        client_manager.remove_client(old_client)
                    client_id = device_id
                else:
                    logger.warning(f"No device_id in frame from {temp_client_id}, using IP:port as ID")
                    client_id = temp_client_id
                
                # Register client with final ID
                client_manager.add_client(client_id, websocket, device_id=device_id, connection_info=temp_client_id)
                logger.info(f"✓ Client registered as {client_id}")
                logger.info(f"→ First frame received from {client_id} ({len(data)} bytes)")
            elif frame_count % 100 == 0:
                logger.debug(f"→ Received frame #{frame_count} from {client_id} ({len(data)} bytes)")

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
        logger.info(f"Client {client_id} disconnected (WebSocketDisconnect)")
    except Exception as e:
        logger.error(f"✗ Error for client {client_id}: {e}", exc_info=True)
        logger.error(f"  Error type: {type(e).__name__}")
        logger.error(f"  Error details: {str(e)}")
    finally:
        client_manager.remove_client(client_id)
        logger.info(f"Client {client_id} cleaned up and removed")


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
        logger.debug(f"  Camera data extracted: {cam.image_width}x{cam.image_height}, tracking={cam.tracking_state}")
    else:
        logger.warning(f"  No camera data in frame {ar_frame.frame_number}")

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
        logger.warning(f"✗ No RGB frame in frame {ar_frame.frame_number}")

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
    else:
        logger.debug(f"✗ No depth frame in frame {ar_frame.frame_number}")

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
                    logger.info(f"Dashboard subscribed to client: {subscribed_client}")
                    
                    # Send latest frame if available
                    if subscribed_client in latest_frames:
                        await websocket.send_text(json.dumps(latest_frames[subscribed_client]))
                        
            except asyncio.TimeoutError:
                # No message received, just continue
                pass
            except json.JSONDecodeError:
                logger.warning("Invalid JSON received from dashboard")
                
            # Send periodic client list updates
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        logger.info("Dashboard client disconnected")
    except Exception as e:
        logger.error(f"Dashboard WebSocket error: {e}", exc_info=True)
    finally:
        dashboard_connections.discard(websocket)
        logger.info(f"Dashboard client removed. Total: {len(dashboard_connections)}")

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
