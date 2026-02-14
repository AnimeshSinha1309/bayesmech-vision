"""
Client for communicating with the segmentation server (v2.0 API)
Uses binary protobuf over WebSocket for video streaming
HTTP for session management and prompts
"""

import asyncio
import aiohttp
import logging
import numpy as np
import cv2
import sys
from pathlib import Path
from typing import Optional, Callable, Dict

# Add proto directory to path
sys.path.append(str(Path(__file__).parent.parent))
from proto import ar_stream_pb2

logger = logging.getLogger(__name__)


class SessionConnection:
    """Represents a single session's WebSocket connection"""

    def __init__(self, session_id: str, client_id: str, ws: aiohttp.ClientWebSocketResponse):
        self.session_id = session_id
        self.client_id = client_id  # Original client_id for this session
        self.ws = ws
        self.listen_task: Optional[asyncio.Task] = None
        self.callback: Optional[Callable] = None

    async def start_listening(self, callback: Callable):
        """Start listening for results on this connection"""
        self.callback = callback
        self.listen_task = asyncio.create_task(self._listen())

    async def _listen(self):
        """Listen for segmentation results"""
        try:
            async for msg in self.ws:
                if msg.type == aiohttp.WSMsgType.BINARY:
                    try:
                        output = ar_stream_pb2.SegmentationOutput()
                        output.ParseFromString(msg.data)

                        # Convert to dict format - use original client_id, not session_id
                        result_dict = {
                            "type": "segmentation_result",
                            "client_id": self.client_id,  # Original client_id
                            "session_id": output.session_id,
                            "frame_number": output.frame_number,
                            "timestamp_ms": output.timestamp_ms,
                            "prompt": output.prompt_type,
                            "num_objects": output.num_objects,
                            "masks": {}
                        }

                        # Decode masks
                        for mask in output.masks:
                            mask_base64 = mask.mask_data.decode('utf-8')
                            result_dict["masks"][str(mask.object_id)] = mask_base64

                        # Call callback
                        if self.callback:
                            try:
                                await self.callback(result_dict)
                            except Exception as e:
                                logger.error(f"Error in result callback: {e}", exc_info=True)

                    except Exception as e:
                        logger.error(f"Error parsing SegmentationOutput: {e}", exc_info=True)

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {msg.data}")
                    break
                elif msg.type == aiohttp.WSMsgType.CLOSE:
                    logger.info(f"WebSocket close for session {self.session_id}")
                    break

        except asyncio.CancelledError:
            logger.info(f"WebSocket listener cancelled for {self.session_id}")
        except Exception as e:
            logger.error(f"Error listening for results: {e}", exc_info=True)

    async def send_frame(self, request: ar_stream_pb2.SegmentationRequest):
        """Send a frame via this WebSocket"""
        if self.ws and not self.ws.closed:
            await self.ws.send_bytes(request.SerializeToString())

    async def close(self):
        """Close this connection"""
        if self.listen_task:
            self.listen_task.cancel()
            try:
                await self.listen_task
            except asyncio.CancelledError:
                pass

        if self.ws and not self.ws.closed:
            await self.ws.close()


class SegmentationClient:
    """Client for communicating with segmentation server v2.0"""

    def __init__(self, segmentation_host: str = "http://127.0.0.1:8081"):
        self.host = segmentation_host
        self.ws_url = segmentation_host.replace("http://", "ws://").replace("https://", "wss://")
        self.session: Optional[aiohttp.ClientSession] = None
        self.is_connected = False
        self._retry_task: Optional[asyncio.Task] = None
        self.result_callback: Optional[Callable] = None

        # Per-session WebSocket connections
        self.client_id_to_session: Dict[str, str] = {}  # client_id -> session_id
        self.session_connections: Dict[str, SessionConnection] = {}  # session_id -> SessionConnection

    async def connect(self):
        """Connect to segmentation server"""
        try:
            # Create HTTP session
            self.session = aiohttp.ClientSession()

            # Test connection
            timeout = aiohttp.ClientTimeout(total=3)
            async with self.session.get(f"{self.host}/segment/status", timeout=timeout) as resp:
                if resp.status == 200:
                    status = await resp.json()
                    logger.info(f"✓ Connected to segmentation server: {status}")
                    self.is_connected = True
                else:
                    logger.error(f"✗ Segmentation server returned status {resp.status}")
                    self.is_connected = False

        except (aiohttp.ClientConnectorError, asyncio.TimeoutError):
            logger.warning("⚠ Segmentation server not available - will retry in background")
            self.is_connected = False
        except Exception as e:
            logger.error(f"✗ Error connecting to segmentation server: {e}")
            self.is_connected = False

        # Start background retry if connection failed
        if not self.is_connected:
            self._retry_task = asyncio.create_task(self._retry_connection())

    async def _retry_connection(self):
        """Retry connecting to segmentation server every 5s until successful"""
        while not self.is_connected:
            await asyncio.sleep(5)
            try:
                timeout = aiohttp.ClientTimeout(total=3)
                if not self.session or self.session.closed:
                    self.session = aiohttp.ClientSession()
                async with self.session.get(f"{self.host}/segment/status", timeout=timeout) as resp:
                    if resp.status == 200:
                        self.is_connected = True
                        logger.info("✓ Reconnected to segmentation server")
                        return
            except (aiohttp.ClientConnectorError, asyncio.TimeoutError, Exception):
                pass  # Keep retrying silently

    async def _ensure_session(self, client_id: str) -> str:
        """Ensure a session exists for this client_id, create if needed"""
        if client_id in self.client_id_to_session:
            return self.client_id_to_session[client_id]

        if not self.is_connected or not self.session:
            raise RuntimeError("Segmentation server not connected")

        try:
            # Create new session
            async with self.session.post(
                f"{self.host}/segment/session/start",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    session_id = result["session_id"]
                    self.client_id_to_session[client_id] = session_id
                    logger.info(f"✓ Created session {session_id} for client {client_id}")

                    # Connect WebSocket for this session
                    await self._connect_websocket(session_id, client_id)

                    return session_id
                else:
                    raise RuntimeError(f"Failed to create session: {resp.status}")

        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise

    async def _connect_websocket(self, session_id: str, client_id: str):
        """Connect WebSocket for a session"""
        try:
            timeout = aiohttp.ClientTimeout(total=5)
            ws = await self.session.ws_connect(
                f"{self.ws_url}/segment/stream?session_id={session_id}",
                timeout=timeout
            )

            # Create session connection wrapper with original client_id
            conn = SessionConnection(session_id, client_id, ws)
            self.session_connections[session_id] = conn

            # Start listening
            await conn.start_listening(self.result_callback)

            logger.info(f"✓ WebSocket connected for session {session_id} (client: {client_id})")

        except Exception as e:
            logger.error(f"✗ Failed to connect WebSocket: {e}")
            raise

    def set_result_callback(self, callback: Callable):
        """Set callback function for segmentation results"""
        self.result_callback = callback

    async def send_frame(self, client_id: str, rgb_frame: np.ndarray, frame_number: int):
        """
        Send frame to segmentation server (non-blocking)

        Args:
            client_id: Client identifier
            rgb_frame: RGB numpy array (H, W, 3)
            frame_number: Frame number
        """
        if not self.is_connected:
            return  # Silently skip if not connected

        try:
            # Ensure session exists
            session_id = await self._ensure_session(client_id)

            # Build SegmentationRequest
            request = ar_stream_pb2.SegmentationRequest()
            request.session_id = session_id
            request.frame_number = frame_number
            request.timestamp_ms = int(asyncio.get_event_loop().time() * 1000)

            # Encode frame as JPEG
            bgr_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
            _, jpeg_data = cv2.imencode('.jpg', bgr_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

            request.image_frame.data = jpeg_data.tobytes()
            request.image_frame.format = ar_stream_pb2.JPEG
            request.image_frame.width = rgb_frame.shape[1]
            request.image_frame.height = rgb_frame.shape[0]
            request.image_frame.quality = 85

            # Send via session's WebSocket
            if session_id in self.session_connections:
                await self.session_connections[session_id].send_frame(request)

        except Exception as e:
            logger.debug(f"Error sending frame: {e}")

    async def send_prompt(
        self,
        client_id: str,
        text: Optional[str] = None,
        points: Optional[list] = None,
        labels: Optional[list] = None
    ):
        """
        Send segmentation prompt to server

        Args:
            client_id: Client identifier
            text: Text prompt (optional)
            points: Point coordinates [[x, y], ...] (optional)
            labels: Point labels [1, 0, ...] (optional)
        """
        if not self.is_connected or not self.session:
            raise RuntimeError("Segmentation server not connected")

        try:
            # Ensure session exists
            session_id = await self._ensure_session(client_id)

            # Send prompt
            async with self.session.post(
                f"{self.host}/segment/session/{session_id}/prompt",
                json={
                    "text": text,
                    "points": points,
                    "labels": labels
                },
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info(f"✓ Prompt sent for {client_id}: {result.get('num_objects', 0)} objects")
                    return result
                else:
                    error = await resp.json()
                    raise ValueError(error.get("detail", "Unknown error"))

        except Exception as e:
            logger.error(f"Error sending prompt: {e}")
            raise

    async def clear_session(self, client_id: str):
        """Clear segmentation session for a client"""
        if client_id not in self.client_id_to_session:
            return

        session_id = self.client_id_to_session[client_id]

        # Close WebSocket connection
        if session_id in self.session_connections:
            await self.session_connections[session_id].close()
            del self.session_connections[session_id]

        if not self.is_connected or not self.session:
            return

        try:
            async with self.session.delete(
                f"{self.host}/segment/session/{session_id}",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    logger.info(f"✓ Cleared session for {client_id}")
                    del self.client_id_to_session[client_id]

        except Exception as e:
            logger.error(f"Error clearing session: {e}")

    async def get_status(self) -> dict:
        """Get segmentation server status"""
        if not self.is_connected or not self.session:
            return {"connected": False}

        try:
            async with self.session.get(
                f"{self.host}/segment/status",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    status = await resp.json()
                    status["connected"] = True
                    return status

        except Exception as e:
            logger.error(f"Error getting status: {e}")

        return {"connected": False}

    async def close(self):
        """Close connections"""
        # Cancel background tasks
        if self._retry_task:
            self._retry_task.cancel()
            try:
                await self._retry_task
            except asyncio.CancelledError:
                pass

        # Close all session connections
        for conn in list(self.session_connections.values()):
            await conn.close()
        self.session_connections.clear()

        # Close HTTP session
        if self.session:
            await self.session.close()

        self.is_connected = False
        logger.info("✓ Segmentation client closed")


# Global client instance
segmentation_client = SegmentationClient()
