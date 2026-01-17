from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
import yaml
from pathlib import Path
import numpy as np
from PIL import Image
import io
import time

from buffer.client_manager import ClientManager
from processing.pipeline import ProcessingPipeline
from storage.database import InferenceDatabase

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
# This fixes the 403 Forbidden error
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
database = InferenceDatabase(config['database']['path'])
pipeline = ProcessingPipeline(config['processing'], database)

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

@app.on_event("startup")
async def startup():
    await pipeline.start()
    logger.info(f"Server started on {config['server']['host']}:{config['server']['port']}")

@app.on_event("shutdown")
async def shutdown():
    await pipeline.stop()
    logger.info("Server stopped")

@app.websocket("/ar-stream")
async def websocket_endpoint(websocket: WebSocket):
    client_id = f"{websocket.client.host}:{websocket.client.port}"
    
    # Log connection attempt details
    logger.info(f"=" * 60)
    logger.info(f"WebSocket connection attempt from: {client_id}")
    logger.info(f"  Client host: {websocket.client.host}")
    logger.info(f"  Client port: {websocket.client.port}")
    logger.info(f"  Headers: {dict(websocket.headers)}")
    logger.info(f"=" * 60)
    
    # IMPORTANT: Accept connection FIRST to avoid 403 Forbidden errors
    # Then check requirements and close gracefully if needed
    try:
        await websocket.accept()
        logger.info(f"✓ WebSocket connection ACCEPTED for client {client_id}")
    except Exception as e:
        logger.error(f"✗ Failed to accept WebSocket connection from {client_id}: {e}", exc_info=True)
        return
    
    # Now check if protobuf is initialized
    if ar_stream_pb2 is None:
        logger.error(f"Protobuf not initialized - closing connection for {client_id}")
        try:
            await websocket.send_text("ERROR: Protobuf not initialized on server. Run generate_proto.sh")
            await websocket.close(code=1011, reason="Protobuf not initialized")
        except:
            pass
        return

    # Send a welcome message to confirm successful setup
    try:
        await websocket.send_text(f"Connected to AR Stream Server - Client ID: {client_id}")
    except Exception as e:
        logger.error(f"Failed to send welcome message to {client_id}: {e}")

    # Register client
    client_manager.add_client(client_id, websocket)
    database.register_client(client_id)
    logger.info(f"Client {client_id} registered in client manager and database")

    try:
        frame_count = 0
        while True:
            # Receive binary frame
            data = await websocket.receive_bytes()
            frame_count += 1
            
            if frame_count == 1:
                logger.info(f"→ First frame received from {client_id} ({len(data)} bytes)")
            elif frame_count % 100 == 0:
                logger.debug(f"→ Received frame #{frame_count} from {client_id} ({len(data)} bytes)")

            # Deserialize protobuf
            ar_frame = ar_stream_pb2.ARFrame()
            try:
                ar_frame.ParseFromString(data)
            except Exception as e:
                logger.error(f"Failed to parse protobuf from {client_id}: {e}")
                continue

            # Extract frame data
            frame_data = extract_frame_data(ar_frame, client_id)

            # Add to buffer
            frame_buffer = client_manager.get_frame_buffer(client_id)
            if frame_buffer:
                frame_buffer.add_frame(frame_data)
                client_manager.update_last_frame_time(client_id)

            # Submit for processing (non-blocking)
            await pipeline.submit_frame(frame_data)

    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected (WebSocketDisconnect)")
    except Exception as e:
        logger.error(f"✗ Error for client {client_id}: {e}", exc_info=True)
        logger.error(f"  Error type: {type(e).__name__}")
        logger.error(f"  Error details: {str(e)}")
    finally:
        client_manager.remove_client(client_id)
        database.disconnect_client(client_id)
        logger.info(f"Client {client_id} cleaned up and removed")


def extract_frame_data(ar_frame, client_id: str) -> dict:
    """Extract data from protobuf ARFrame"""
    data = {
        'client_id': client_id,
        'timestamp_ns': ar_frame.timestamp_ns,
        'frame_number': ar_frame.frame_number,
    }

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

    # RGB frame
    if ar_frame.HasField('rgb_frame'):
        rgb = ar_frame.rgb_frame
        if rgb.format == ar_stream_pb2.JPEG:
            # Decode JPEG using Pillow
            img = Image.open(io.BytesIO(rgb.data))
            data['rgb_image'] = np.array(img)
        elif rgb.format == ar_stream_pb2.RGB_888:
            # Raw RGB
            data['rgb_image'] = np.frombuffer(
                rgb.data, dtype=np.uint8
            ).reshape(rgb.height, rgb.width, 3)

    # Depth frame (optional)
    if ar_frame.HasField('depth_frame'):
        depth = ar_frame.depth_frame
        # Decode 16-bit depth (millimeters)
        depth_data = np.frombuffer(depth.data, dtype=np.uint16)
        data['depth_map'] = depth_data.reshape(depth.height, depth.width)
        data['depth_range'] = (depth.min_depth_m, depth.max_depth_m)

        # Confidence map if present
        if depth.confidence:
            conf_data = np.frombuffer(depth.confidence, dtype=np.uint8)
            data['depth_confidence'] = conf_data.reshape(depth.height, depth.width)

    return data

@app.get("/")
async def get_status():
    """Get server status"""
    all_clients = client_manager.get_all_clients()
    client_stats = []

    for client_id in all_clients:
        buffer = client_manager.get_frame_buffer(client_id)
        if buffer:
            client_stats.append(buffer.get_stats())

    return {
        "status": "running",
        "active_connections": len(all_clients),
        "clients": client_stats,
        "processing_queue_size": pipeline.processing_queue.qsize(),
    }

@app.get("/clients")
async def get_clients():
    """Get list of all connected clients"""
    all_clients = client_manager.get_all_clients()
    return {
        "clients": all_clients,
        "count": len(all_clients)
    }

@app.get("/tracks/{client_id}")
async def get_client_tracks(client_id: str):
    """Get active tracks for a client"""
    tracks = database.get_active_tracks(client_id)
    return {
        "client_id": client_id,
        "tracks": tracks,
        "count": len(tracks)
    }

@app.get("/export/{client_id}")
async def export_client_data(client_id: str):
    """Export inference results for a client"""
    output_dir = Path("./exports")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{client_id.replace(':', '_')}_{int(time.time())}.json"

    database.export_to_json(client_id, str(output_path))

    return {
        "message": "Export complete",
        "file": str(output_path)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/diagnostics")
async def get_diagnostics():
    """Diagnostic information for troubleshooting connections"""
    import socket
    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "Unknown"
    
    return {
        "server_status": "running",
        "hostname": hostname,
        "local_ip": local_ip,
        "listening_on": {
            "host": config['server']['host'],
            "port": config['server']['port']
        },
        "websocket_endpoint": f"ws://{local_ip}:{config['server']['port']}/ar-stream",
        "protobuf_status": "initialized" if ar_stream_pb2 else "not_initialized",
        "active_connections": len(client_manager.get_all_clients()),
        "processing_queue_size": pipeline.processing_queue.qsize(),
        "instructions": {
            "android_config": f"ws://{local_ip}:{config['server']['port']}/ar-stream",
            "note": "Make sure your Android device is on the same network and replace the IP in HelloArActivity.kt"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config['server']['host'],
        port=config['server']['port'],
        log_level="info"
    )
