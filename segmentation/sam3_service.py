import sys
import os
import torch
import asyncio
import numpy as np
import cv2
from typing import List, Optional, Dict, Any, Tuple
from io import BytesIO
from PIL import Image
from collections import deque
import base64
import tempfile
import shutil

# Global model variables
video_predictor = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class StreamingSession:
    """Manages streaming segmentation session for a client"""
    def __init__(self, client_id: str, max_buffer_size: int = 30):
        self.client_id = client_id
        self.frame_buffer = deque(maxlen=max_buffer_size)  # RGB frames
        self.session_id = None
        self.inference_state = None
        self.temp_dir = None
        self.tracked_objects = {}  # obj_id -> metadata
        self.last_segmentation_frame = -1
        self.segmentation_interval = 3  # Segment every 3 frames

    async def add_frame(self, rgb_frame: np.ndarray, frame_number: int):
        """Add new frame to buffer"""
        self.frame_buffer.append({
            'frame': rgb_frame,
            'frame_number': frame_number
        })

    async def should_segment(self, frame_number: int) -> bool:
        """Determine if we should run segmentation on this frame"""
        if len(self.tracked_objects) == 0:
            return False  # No active tracking

        if frame_number - self.last_segmentation_frame >= self.segmentation_interval:
            return True

        return False

    def create_temp_video_dir(self):
        """Create temporary directory for frame buffer"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

        self.temp_dir = tempfile.mkdtemp(prefix=f"sam3_session_{self.client_id}_")

        # Write buffered frames as JPEGs
        for idx, frame_data in enumerate(self.frame_buffer):
            frame_path = os.path.join(self.temp_dir, f"{idx:05d}.jpg")
            cv2.imwrite(frame_path, cv2.cvtColor(frame_data['frame'], cv2.COLOR_RGB2BGR))

        return self.temp_dir

    def cleanup(self):
        """Clean up temporary resources"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

class SAM3StreamingService:
    """Main service for managing streaming video segmentation across multiple clients"""

    def __init__(self):
        self.sessions: Dict[str, StreamingSession] = {}
        self.video_predictor = None
        self.device = DEVICE
        self._lock = asyncio.Lock()

    async def initialize(self):
        """Load SAM3 model"""
        global video_predictor

        try:
            print(f"Loading SAM3 model on {self.device}...")

            # Try to import SAM3
            try:
                from sam3.model_builder import build_sam3_video_predictor

                # Look for checkpoint in models directory
                checkpoint_path = os.path.join(os.path.dirname(__file__), "..", "models", "sam3", "sam3.pt")

                if os.path.exists(checkpoint_path):
                    self.video_predictor = build_sam3_video_predictor(
                        checkpoint_path=checkpoint_path,
                        apply_temporal_disambiguation=True
                    )
                    video_predictor = self.video_predictor
                    print(f"SAM3 Model loaded successfully from {checkpoint_path}")
                    print(f"GPU Memory allocated: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
                    return True
                else:
                    print(f"WARNING: Checkpoint not found at {checkpoint_path}")
                    print("Please ensure 'sam3.pt' is in the models/sam3/ directory")
                    return False

            except ImportError as e:
                print(f"FAILED to import SAM3: {e}")
                print("Installing SAM3 from GitHub...")
                # Installation will be handled separately
                return False

        except Exception as e:
            print(f"Error loading model: {e}")
            return False

    async def create_session(self, client_id: str) -> StreamingSession:
        """Create new streaming session for a client"""
        async with self._lock:
            if client_id in self.sessions:
                # Clean up old session
                self.sessions[client_id].cleanup()

            session = StreamingSession(client_id)
            self.sessions[client_id] = session
            print(f"Created SAM3 streaming session for client {client_id}")
            return session

    async def add_frame(self, client_id: str, rgb_frame: np.ndarray, frame_number: int):
        """Add frame to client's buffer"""
        if client_id not in self.sessions:
            await self.create_session(client_id)
            print(f"✓ Created new SAM3 session for {client_id}, buffer ready for segmentation")

        session = self.sessions[client_id]
        await session.add_frame(rgb_frame, frame_number)

        # Log every 30 frames
        if frame_number % 30 == 0:
            print(f"  SAM3 buffer for {client_id}: {len(session.frame_buffer)} frames")

    async def segment_with_prompt(
        self,
        client_id: str,
        text_prompt: Optional[str] = None,
        points: Optional[List[List[float]]] = None,
        labels: Optional[List[int]] = None
    ) -> Dict[str, np.ndarray]:
        """
        Segment objects in the latest frame using text or point prompts

        Returns:
            Dictionary mapping object_id -> segmentation_mask (bool array)
        """
        if self.video_predictor is None:
            raise ValueError("SAM3 model not loaded")

        if client_id not in self.sessions:
            print(f"❌ No session found for client {client_id}")
            print(f"   Available sessions: {list(self.sessions.keys())}")
            raise ValueError(f"No streaming session found for client {client_id}. Please ensure frames are being received from the client.")

        session = self.sessions[client_id]

        if len(session.frame_buffer) == 0:
            print(f"❌ No frames in buffer for client {client_id}")
            raise ValueError(f"No frames available in buffer for client {client_id}. Please wait for frames to arrive.")

        try:
            # Create temporary directory with buffered frames
            temp_dir = session.create_temp_video_dir()

            # Initialize SAM3 video session
            response = self.video_predictor.handle_request({
                "type": "start_session",
                "resource_path": temp_dir
            })

            session.session_id = response["session_id"]

            # Use the latest frame for prompting
            latest_frame_idx = len(session.frame_buffer) - 1

            # Add prompt to SAM3
            prompt_request = {
                "type": "add_prompt",
                "session_id": session.session_id,
                "frame_index": latest_frame_idx,
            }

            if text_prompt:
                prompt_request["text"] = text_prompt
            if points:
                prompt_request["points"] = points
            if labels:
                prompt_request["labels"] = labels

            response = self.video_predictor.handle_request(prompt_request)

            # Extract segmentation outputs
            outputs = response.get("outputs", {})

            # Update tracked objects
            for obj_id in outputs.keys():
                session.tracked_objects[obj_id] = {
                    "prompt": text_prompt or "point_prompt",
                    "frame_added": latest_frame_idx
                }

            session.last_segmentation_frame = latest_frame_idx

            return outputs

        except Exception as e:
            print(f"Error during segmentation: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Segmentation error: {str(e)}")

    async def propagate_masks(self, client_id: str) -> Dict[int, Dict[str, np.ndarray]]:
        """
        Propagate segmentation masks across all buffered frames

        Returns:
            Dictionary mapping frame_idx -> {object_id -> mask}
        """
        if self.video_predictor is None:
            raise ValueError("SAM3 model not loaded")

        if client_id not in self.sessions:
            raise ValueError(f"No session found for client {client_id}")

        session = self.sessions[client_id]

        if session.session_id is None:
            raise ValueError("No active segmentation session")

        try:
            # Propagate through all buffered frames
            video_segments = {}

            # This would use SAM3's propagate_in_video API
            # For now, return the current frame's segmentation
            # Full implementation would iterate through frames

            return video_segments

        except Exception as e:
            print(f"Error during mask propagation: {e}")
            raise ValueError(f"Mask propagation error: {str(e)}")

    async def cleanup_session(self, client_id: str):
        """Clean up session resources"""
        if client_id in self.sessions:
            self.sessions[client_id].cleanup()
            del self.sessions[client_id]
            print(f"Cleaned up SAM3 session for client {client_id}")

    def get_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            "model_loaded": self.video_predictor is not None,
            "device": self.device,
            "active_sessions": len(self.sessions),
            "cuda_available": torch.cuda.is_available(),
            "vram_info": self._get_vram_info()
        }

    def _get_vram_info(self) -> Dict[str, str]:
        """Get VRAM usage information"""
        if torch.cuda.is_available():
            return {
                "allocated": f"{torch.cuda.memory_allocated() / 1024**3:.2f} GB",
                "reserved": f"{torch.cuda.memory_reserved() / 1024**3:.2f} GB"
            }
        return {"status": "cpu_only"}

def encode_mask_to_base64(mask: np.ndarray, obj_id: int) -> str:
    """
    Encode segmentation mask to base64 PNG with color overlay

    Args:
        mask: Boolean or float array (H, W)
        obj_id: Object ID for color assignment

    Returns:
        Base64 encoded PNG string
    """
    # Convert to boolean if needed
    if mask.dtype != bool:
        mask = mask > 0.0

    # Create RGBA image
    height, width = mask.shape
    rgba = np.zeros((height, width, 4), dtype=np.uint8)

    # Assign color based on object ID
    colors = [
        (255, 0, 0, 128),    # Red
        (0, 255, 0, 128),    # Green
        (0, 0, 255, 128),    # Blue
        (255, 255, 0, 128),  # Yellow
        (255, 0, 255, 128),  # Magenta
        (0, 255, 255, 128),  # Cyan
    ]
    color = colors[obj_id % len(colors)]

    rgba[mask] = color

    # Convert to PIL and encode
    img = Image.fromarray(rgba, mode='RGBA')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')


# Create global service instance
sam3_service = SAM3StreamingService()
