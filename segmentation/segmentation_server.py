"""
Standalone Segmentation Server
Handles video segmentation independently from the main AR streaming server
Uses binary protobuf over WebSocket for all video data communication
HTTP API for session control and prompts
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
import numpy as np
import time
from typing import Dict
from pathlib import Path
import sys
import uuid
import cv2

# Add proto directory to path
sys.path.append(str(Path(__file__).parent.parent))
from proto import ar_stream_pb2

from segmentation_service import segmentation_service, encode_mask_to_base64

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Segmentation Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session management
sessions: Dict[str, dict] = {}  # session_id -> {ws: WebSocket, last_activity: float}
session_locks: Dict[str, asyncio.Lock] = {}


async def cleanup_inactive_sessions():
    """Background task to cleanup inactive sessions"""
    while True:
        await asyncio.sleep(60)  # Check every minute

        timeout_seconds = segmentation_service.session_timeout_minutes * 60
        current_time = time.time()

        sessions_to_remove = []
        for session_id, session_data in sessions.items():
            if current_time - session_data['last_activity'] > timeout_seconds:
                sessions_to_remove.append(session_id)

        for session_id in sessions_to_remove:
            logger.info(f"Cleaning up inactive session: {session_id}")
            await segmentation_service.cleanup_session(session_id)
            if session_id in sessions:
                # Close WebSocket if still open
                try:
                    await sessions[session_id]['ws'].close()
                except:
                    pass
                del sessions[session_id]
            if session_id in session_locks:
                del session_locks[session_id]


@app.on_event("startup")
async def startup():
    """Initialize segmentation service on startup"""
    logger.info("Starting Segmentation Server...")
    success = await segmentation_service.initialize()
    if success:
        logger.info("✓ Segmentation service initialized successfully")
        logger.info(f"  Model: {segmentation_service.model_type}")
        logger.info(f"  Device: {segmentation_service.device}")
        logger.info(f"  Max tracked objects: {segmentation_service.max_tracked_objects}")
        logger.info(f"  Session timeout: {segmentation_service.session_timeout_minutes} minutes")

        # Start cleanup task
        asyncio.create_task(cleanup_inactive_sessions())
    else:
        logger.error("✗ Segmentation service initialization failed")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    logger.info("Shutting down segmentation server...")
    for session_id in list(sessions.keys()):
        await segmentation_service.cleanup_session(session_id)


# HTTP Control Plane

@app.post("/segment/session/start")
async def start_session():
    """
    Start a new segmentation session

    Returns:
        {
            "session_id": "uuid-string",
            "status": "ok"
        }
    """
    session_id = str(uuid.uuid4())

    # Initialize session in service
    await segmentation_service.create_session(session_id)

    logger.info(f"Started new session: {session_id}")

    return {
        "session_id": session_id,
        "status": "ok"
    }


@app.post("/segment/session/{session_id}/prompt")
async def add_prompt(session_id: str, data: dict):
    """
    Add segmentation prompt to a session

    Body: {
        "text": str (optional),
        "points": [[x, y], ...] (optional),
        "labels": [1, 0, ...] (optional, 1=foreground, 0=background)
    }

    Returns:
        {
            "status": "ok",
            "num_objects": int
        }
    """
    if session_id not in sessions and session_id not in segmentation_service.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    text_prompt = data.get("text")
    points = data.get("points")
    labels = data.get("labels")

    try:
        # Update activity timestamp
        if session_id in sessions:
            sessions[session_id]['last_activity'] = time.time()

        # Run segmentation
        masks = await segmentation_service.segment_with_prompt(
            client_id=session_id,
            text_prompt=text_prompt,
            points=points,
            labels=labels
        )

        # Broadcast result via WebSocket if connected
        if session_id in sessions:
            await broadcast_segmentation_result(
                session_id=session_id,
                masks=masks,
                prompt_type=text_prompt or "point"
            )

        return {
            "status": "ok",
            "num_objects": len(masks)
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing prompt: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/segment/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a segmentation session and cleanup resources

    Returns:
        {"status": "ok"}
    """
    try:
        await segmentation_service.cleanup_session(session_id)

        if session_id in sessions:
            # Close WebSocket if still open
            try:
                await sessions[session_id]['ws'].close()
            except:
                pass
            del sessions[session_id]

        if session_id in session_locks:
            del session_locks[session_id]

        logger.info(f"Deleted session: {session_id}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/segment/status")
async def get_status():
    """Get segmentation service status"""
    status = segmentation_service.get_status()
    status['active_sessions'] = len(sessions)
    status['session_ids'] = list(sessions.keys())
    return status


# WebSocket for Video Streaming

@app.websocket("/segment/stream")
async def stream_websocket(websocket: WebSocket, session_id: str = None):
    """
    WebSocket endpoint for bidirectional video streaming

    Client sends: SegmentationRequest (binary protobuf)
    Server sends: SegmentationOutput (binary protobuf)

    Query params:
        session_id: Session ID from /segment/session/start
    """
    if not session_id:
        await websocket.close(code=1008, reason="Missing session_id query parameter")
        return

    if session_id not in segmentation_service.sessions:
        await websocket.close(code=1008, reason=f"Session {session_id} not found. Call /segment/session/start first.")
        return

    await websocket.accept()

    # Register session
    sessions[session_id] = {
        'ws': websocket,
        'last_activity': time.time()
    }
    session_locks[session_id] = asyncio.Lock()

    logger.info(f"WebSocket connected for session: {session_id}")

    try:
        while True:
            # Receive binary protobuf
            data = await websocket.receive_bytes()

            # Update activity timestamp
            sessions[session_id]['last_activity'] = time.time()

            # Parse SegmentationRequest
            try:
                request = ar_stream_pb2.SegmentationRequest()
                request.ParseFromString(data)

                # Validate
                if not request.HasField('image_frame'):
                    logger.warning(f"Received request without image_frame from {session_id}")
                    continue

                # Extract RGB frame from ImageFrame
                image_frame = request.image_frame

                if image_frame.format == ar_stream_pb2.JPEG:
                    # Decode JPEG
                    import cv2
                    jpg_data = np.frombuffer(image_frame.data, dtype=np.uint8)
                    rgb_frame = cv2.imdecode(jpg_data, cv2.IMREAD_COLOR)
                    rgb_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_BGR2RGB)

                elif image_frame.format == ar_stream_pb2.RGB_888:
                    # Raw RGB
                    rgb_data = np.frombuffer(image_frame.data, dtype=np.uint8)
                    rgb_frame = rgb_data.reshape(
                        (image_frame.height, image_frame.width, 3)
                    )

                else:
                    logger.warning(f"Unsupported image format: {image_frame.format}")
                    continue

                # Validate dimensions
                if image_frame.width > 0 and image_frame.height > 0:
                    expected_h, expected_w = rgb_frame.shape[:2]
                    if expected_w != image_frame.width or expected_h != image_frame.height:
                        logger.warning(
                            f"Dimension mismatch: proto says {image_frame.width}x{image_frame.height}, "
                            f"got {expected_w}x{expected_h}"
                        )

                # Add frame to segmentation service (async, non-blocking)
                asyncio.create_task(
                    segmentation_service.add_frame(
                        session_id,
                        rgb_frame,
                        request.frame_number
                    )
                )

            except Exception as e:
                logger.error(f"Error parsing SegmentationRequest: {e}")
                continue

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        # Cleanup
        if session_id in sessions:
            del sessions[session_id]
        # Note: Don't delete session from service yet - allow reconnection


async def broadcast_segmentation_result(
    session_id: str,
    masks: Dict[str, np.ndarray],
    prompt_type: str,
    frame_number: int = 0
):
    """
    Broadcast segmentation results to connected WebSocket

    Args:
        session_id: Session ID
        masks: Dictionary of object_id -> mask (numpy array)
        prompt_type: Type of prompt used
        frame_number: Frame number
    """
    if session_id not in sessions:
        return

    try:
        # Build SegmentationOutput protobuf
        output = ar_stream_pb2.SegmentationOutput()
        output.session_id = session_id
        output.frame_number = frame_number
        output.timestamp_ms = int(time.time() * 1000)
        output.prompt_type = prompt_type
        output.num_objects = len(masks)

        # Add masks
        for obj_id_str, mask_array in masks.items():
            mask_msg = output.masks.add()
            mask_msg.object_id = int(obj_id_str)

            # Encode mask to base64 PNG
            mask_msg.mask_data = encode_mask_to_base64(mask_array, int(obj_id_str)).encode('utf-8')

            # Calculate confidence and pixel count
            if mask_array.dtype == bool:
                mask_msg.pixel_count = int(np.sum(mask_array))
                mask_msg.confidence = 1.0
            else:
                mask_msg.pixel_count = int(np.sum(mask_array > 0.5))
                mask_msg.confidence = float(np.mean(mask_array))

        # Send binary protobuf
        await sessions[session_id]['ws'].send_bytes(output.SerializeToString())

    except Exception as e:
        logger.warning(f"Failed to broadcast result to {session_id}: {e}")


# Set callback for automatic result broadcasting
segmentation_service.set_result_callback(
    lambda client_id, masks, prompt, frame_num=0: asyncio.create_task(
        broadcast_segmentation_result(
            session_id=client_id,
            masks=masks,  # Use actual numpy array masks
            prompt_type=prompt,
            frame_number=frame_num
        )
    )
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8081,
        log_level="info"
    )
