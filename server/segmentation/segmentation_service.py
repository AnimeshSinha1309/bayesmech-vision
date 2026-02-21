"""
Configurable Video Segmentation Service
Supports both SAM2 and SAM3 models based on configuration
"""

import sys
import os
import torch
import asyncio
import numpy as np
import cv2
import logging
from typing import List, Optional, Dict, Any, Tuple
from io import BytesIO
from PIL import Image
from collections import deque
import base64
import tempfile
import shutil
import yaml
from pathlib import Path

# Setup logging
logger = logging.getLogger(__name__)

# Global model variables
video_predictor = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Load configuration
config_path = Path(__file__).parent / 'segmentation_config.yaml'
with open(config_path) as f:
    CONFIG = yaml.safe_load(f)

class StreamingSession:
    """Manages streaming segmentation session for a client"""
    def __init__(self, client_id: str, max_buffer_size: int = None):
        if max_buffer_size is None:
            max_buffer_size = CONFIG['streaming']['frame_buffer_size']

        self.client_id = client_id
        self.frame_buffer = deque(maxlen=max_buffer_size)  # RGB frames
        self.session_id = None
        self.inference_state = None
        self.temp_dir = None
        self.tracked_objects = {}  # obj_id -> metadata
        self.last_segmentation_frame = -1
        self.segmentation_interval = CONFIG['streaming']['segmentation_interval']
        self.last_segmentation_frame = -1
        self.segmentation_interval = CONFIG['streaming']['segmentation_interval']
        self.latest_masks = {}  # obj_id -> mask (stores latest segmentation result)
        self.is_segmenting = False  # Lock to prevent overlapping tasks
        self.auto_segmentation_initialized = False  # Track if auto-segmentation has been triggered

    async def add_frame(self, rgb_frame: np.ndarray, frame_number: int):
        """Add new frame to buffer"""
        self.frame_buffer.append({
            'frame': rgb_frame,
            'frame_number': frame_number
        })

    async def should_segment(self, frame_number: int) -> bool:
        """Determine if we should run segmentation on this frame"""
        # Debug logging for segmentation decision
        is_tracking = len(self.tracked_objects) > 0
        if not is_tracking:
            # Don't log every frame to avoid spam, just occasionally
            if frame_number % 60 == 0:
                print(f"  [DEBUG] should_segment: False (No tracked objects)")
            return False  # No active tracking

        # Don't start new task if one is running
        if self.is_segmenting:
             if frame_number % 30 == 0:
                 print(f"  [DEBUG] should_segment: False (Already segmenting)")
             return False

        time_since_last = frame_number - self.last_segmentation_frame
        should_run = time_since_last >= self.segmentation_interval
        
        if CONFIG['streaming'].get('debug_logs', True):
            print(f"  [DEBUG] should_segment: {should_run} (tracked={len(self.tracked_objects)}, frames_since_last={time_since_last}, interval={self.segmentation_interval})")
            
        if should_run:
            return True

        return False

    def create_temp_video_dir(self):
        """Create temporary directory for frame buffer"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

        self.temp_dir = tempfile.mkdtemp(prefix=f"sam_session_{self.client_id}_")

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


class SegmentationService:
    """Main service for managing streaming video segmentation across multiple clients"""

    def __init__(self):
        self.sessions: Dict[str, StreamingSession] = {}
        self.video_predictor = None
        self.device = DEVICE
        self.model_type = CONFIG['model']['type']
        self._lock = asyncio.Lock()

        # Configuration properties
        self.max_tracked_objects = CONFIG['streaming']['max_tracked_objects']
        self.session_timeout_minutes = CONFIG['streaming'].get('session_timeout_minutes', 5)

        if CONFIG['memory'].get('pytorch_cuda_alloc_conf'):
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = CONFIG['memory']['pytorch_cuda_alloc_conf']

        self.on_segmentation_result = None  # Callback for broadcast

    def set_result_callback(self, callback):
        """Set callback function for segmentation results"""
        self.on_segmentation_result = callback

    async def initialize(self):
        """Load segmentation model based on configuration"""
        global video_predictor

        try:
            print(f"Loading {self.model_type.upper()} model on {self.device}...")

            if self.model_type == "sam2":
                return await self._load_sam2()
            elif self.model_type == "sam3":
                return await self._load_sam3()
            else:
                print(f"Unknown model type: {self.model_type}")
                return False

        except Exception as e:
            print(f"Error loading model: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def _load_sam2(self):
        """Load SAM2 model"""
        try:
            from sam2.build_sam import build_sam2_video_predictor

            sam2_config = CONFIG['model']['sam2']
            checkpoint_path = sam2_config['checkpoint_path']
            config_file = sam2_config.get('config_path')

            # Resolve paths
            checkpoint_path = os.path.join(os.path.dirname(__file__), checkpoint_path)

            if not os.path.exists(checkpoint_path):
                print(f"❌ SAM2 checkpoint not found at {checkpoint_path}")
                print("Please download SAM2 checkpoint:")
                variant = sam2_config['variant']
                print(f"  wget https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_{variant}.pt")
                return False

            print(f"Loading SAM2 {sam2_config['variant']} variant...")
            self.video_predictor = build_sam2_video_predictor(
                config_file=config_file,
                ckpt_path=checkpoint_path,
                device=self.device,
            )

            video_predictor = self.video_predictor
            print(f"✓ SAM2 {sam2_config['variant']} loaded successfully from {checkpoint_path}")

            if torch.cuda.is_available():
                print(f"GPU Memory allocated: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")

            return True

        except ImportError as e:
            print(f"SAM2 not installed. Installing...")
            print("Run: uv pip install 'git+https://github.com/facebookresearch/sam2.git'")
            return False

    async def _load_sam3(self):
        """Load SAM3 model"""
        try:
            from sam3.model_builder import build_sam3_video_predictor

            sam3_config = CONFIG['model']['sam3']
            checkpoint_path = os.path.join(
                os.path.dirname(__file__),
                sam3_config['checkpoint_path']
            )

            if not os.path.exists(checkpoint_path):
                print(f"❌ SAM3 checkpoint not found at {checkpoint_path}")
                return False

            print(f"Loading SAM3 model...")
            self.video_predictor = build_sam3_video_predictor(
                checkpoint_path=checkpoint_path,
                apply_temporal_disambiguation=sam3_config.get('apply_temporal_disambiguation', True)
            )

            video_predictor = self.video_predictor
            print(f"✓ SAM3 loaded successfully from {checkpoint_path}")

            if torch.cuda.is_available():
                print(f"GPU Memory allocated: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")

            return True

        except ImportError as e:
            print(f"SAM3 not installed: {e}")
            return False

    async def create_session(self, client_id: str) -> StreamingSession:
        """Create new streaming session for a client"""
        async with self._lock:
            if client_id in self.sessions:
                # Clean up old session
                self.sessions[client_id].cleanup()

            session = StreamingSession(client_id)
            self.sessions[client_id] = session
            print(f"Created {self.model_type.upper()} streaming session for client {client_id}")
            return session

    async def add_frame(self, client_id: str, rgb_frame: np.ndarray, frame_number: int):
        """Add frame to client's buffer"""
        if client_id not in self.sessions:
            await self.create_session(client_id)
            print(f"✓ Created new {self.model_type.upper()} session for {client_id}, buffer ready for segmentation")

        session = self.sessions[client_id]
        await session.add_frame(rgb_frame, frame_number)

        # Log every 30 frames
        if frame_number % 30 == 0:
            print(f"  {self.model_type.upper()} buffer for {client_id}: {len(session.frame_buffer)} frames")

        # Auto-segmentation: Initialize tracking with grid prompts when buffer has enough frames
        if CONFIG['streaming'].get('auto_segment_on_start', False):
            if not session.auto_segmentation_initialized and len(session.frame_buffer) >= 5:
                print(f"  [AUTO-SEGMENT] Initializing automatic segmentation for {client_id}")
                session.auto_segmentation_initialized = True
                # Trigger auto-segmentation in background
                asyncio.create_task(self._auto_segment_initialize(client_id))
                return  # Skip manual segmentation check this frame

        # Check if we should segment/propagate
        should_run = await session.should_segment(frame_number)
        if should_run:
            print(f"  [DEBUG] Triggering propagation for client {client_id} at frame {frame_number}")
            # lock immediately to prevent race condition
            session.is_segmenting = True
            # Create async task for segmentation to not block receiving frames
            asyncio.create_task(self.propagate_segmentation(client_id))

    async def _auto_segment_initialize(self, client_id: str):
        """
        Initialize automatic segmentation by generating grid-based point prompts
        """
        try:
            session = self.sessions.get(client_id)
            if not session or len(session.frame_buffer) == 0:
                print(f"  [AUTO-SEGMENT] Cannot initialize - no frames in buffer")
                return

            # Get the latest frame to determine dimensions
            latest_frame = session.frame_buffer[-1]['frame']
            height, width = latest_frame.shape[:2]

            grid_size = CONFIG['streaming'].get('auto_segment_grid_size', 32)

            # Generate grid of points across the frame
            points = []
            labels = []

            # Sample points in a grid pattern, avoiding edges
            margin = grid_size // 2
            for y in range(margin, height - margin, grid_size):
                for x in range(margin, width - margin, grid_size):
                    points.append([x, y])
                    labels.append(1)  # Positive label (foreground)

            print(f"  [AUTO-SEGMENT] Generated {len(points)} grid points ({grid_size}px spacing)")

            # Run segmentation with grid prompts
            masks = await self.segment_with_prompt(
                client_id=client_id,
                points=points,
                labels=labels
            )

            print(f"  [AUTO-SEGMENT] Initialized with {len(masks)} detected objects")

            # Broadcast initial results
            if self.on_segmentation_result and masks:
                # Pass raw numpy masks, not encoded
                await self.on_segmentation_result(
                    client_id=client_id,
                    masks=masks,
                    prompt="auto_segment_grid"
                )

        except Exception as e:
            print(f"  [AUTO-SEGMENT] Error during initialization: {e}")
            import traceback
            traceback.print_exc()
            # Mark as not initialized so it can retry later
            session.auto_segmentation_initialized = False

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
            raise ValueError(f"{self.model_type.upper()} model not loaded")

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

            if self.model_type == "sam2":
                return await self._segment_sam2(session, temp_dir, text_prompt, points, labels)
            elif self.model_type == "sam3":
                return await self._segment_sam3(session, temp_dir, text_prompt, points, labels)

        except Exception as e:
            print(f"Error during segmentation: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Segmentation error: {str(e)}")

    async def _segment_sam2(self, session, temp_dir, text_prompt, points, labels):
        """SAM2-specific segmentation logic — runs GPU work in a thread."""
        if text_prompt:
            raise ValueError("SAM2 doesn't support text prompts. Use point prompts or switch to SAM3.")

        latest_frame_idx = len(session.frame_buffer) - 1
        max_objects = CONFIG['streaming'].get('max_tracked_objects', 6)

        def _run_segment():
            predictor = self.video_predictor
            inference_state = predictor.init_state(video_path=temp_dir)
            session.inference_state = inference_state

            out_obj_ids = []
            out_mask_logits_list = []
            obj_point_map = {}

            if points and labels:
                if len(points) > max_objects * 3:
                    step = len(points) // max_objects
                    sampled_indices = range(0, len(points), step)
                    points_to_use = [points[i] for i in sampled_indices]
                    labels_to_use = [labels[i] for i in sampled_indices]
                else:
                    points_to_use = points
                    labels_to_use = labels

                for idx, (point, label) in enumerate(zip(points_to_use, labels_to_use)):
                    if idx >= max_objects:
                        break
                    obj_id = idx + 1
                    try:
                        _, obj_ids, mask_logits = predictor.add_new_points_or_box(
                            inference_state=inference_state,
                            frame_idx=latest_frame_idx,
                            obj_id=obj_id,
                            points=np.array([point], dtype=np.float32),
                            labels=np.array([label], dtype=np.int32),
                        )
                        out_obj_ids.extend(obj_ids)
                        out_mask_logits_list.extend(mask_logits)
                        for oid in obj_ids:
                            obj_point_map[oid] = (point, label)
                    except Exception as e:
                        print(f"    Warning: Failed to add point {idx}: {e}")

            outputs = {}
            for i, obj_id in enumerate(out_obj_ids):
                if i < len(out_mask_logits_list):
                    mask = (out_mask_logits_list[i] > 0.0).cpu().numpy().squeeze()
                    if np.sum(mask) > 100:
                        outputs[str(obj_id)] = mask

            print(f"    Generated {len(outputs)} valid masks from {len(out_obj_ids)} prompts")
            return outputs, out_obj_ids, obj_point_map

        outputs, out_obj_ids, obj_point_map = await asyncio.to_thread(_run_segment)

        # Store metadata (must happen on main thread — accesses session)
        if points and labels:
            for obj_id in out_obj_ids:
                point, label = obj_point_map.get(obj_id, (points[0], labels[0]))
                session.tracked_objects[obj_id] = {
                    "prompt": "grid_point" if len(points) > 10 else "point_prompt",
                    "frame_added": latest_frame_idx,
                    "original_frame_number": session.frame_buffer[latest_frame_idx]['frame_number'],
                    "points": [point],
                    "labels": [label],
                }

        session.latest_masks = outputs
        session.last_segmentation_frame = latest_frame_idx
        return outputs

    async def _segment_sam3(self, session, temp_dir, text_prompt, points, labels):
        """SAM3-specific segmentation logic"""
        # Initialize SAM3 video session
        response = self.video_predictor.handle_request({
            "type": "start_session",
            "resource_path": temp_dir
        })

        session.session_id = response["session_id"]
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
                "frame_added": latest_frame_idx,
                "original_frame_number": session.frame_buffer[latest_frame_idx]['frame_number'],
                "points": points,
                "labels": labels
            }

        # Store latest masks in session
        session.latest_masks = outputs
        session.last_segmentation_frame = latest_frame_idx

        return outputs

    async def cleanup_session(self, client_id: str):
        """Clean up session resources"""
        if client_id in self.sessions:
            self.sessions[client_id].cleanup()
            del self.sessions[client_id]
            print(f"Cleaned up {self.model_type.upper()} session for client {client_id}")

    def get_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            "model_type": self.model_type,
            "model_variant": CONFIG['model'][self.model_type].get('variant', 'N/A'),
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
                "reserved": f"{torch.cuda.memory_reserved() / 1024**3:.2f} GB",
                "free": f"{(torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated()) / 1024**3:.2f} GB"
            }
        return {"status": "cpu_only"}

    def get_latest_masks(self, client_id: str) -> Optional[Dict[str, np.ndarray]]:
        """Get the latest segmentation masks for a client"""
        if client_id not in self.sessions:
            return None

        session = self.sessions[client_id]
        if not session.latest_masks:
            return None

        return session.latest_masks

    async def propagate_segmentation(self, client_id: str):
        """
        Propagate segmentation masks to new frames in the buffer
        """
        print(f"  [DEBUG] propagate_segmentation called for {client_id}")
        
        if client_id not in self.sessions:
            print(f"  [DEBUG] propagate_segmentation: Client {client_id} not found")
            return

        session = self.sessions[client_id]
        
        # Lock is already set in add_frame, but we manage the release here
        
        try:
            # Determine if we have tracking info
            if not session.latest_masks and not session.tracked_objects:
                print(f"  [DEBUG] propagate_segmentation: No masks or tracked objects. Aborting.")
                return  # Nothing to track

            # Create temporary directory with buffered frames
            temp_dir = session.create_temp_video_dir()
            print(f"  [DEBUG] propagate_segmentation: Created temp dir {temp_dir} with {len(session.frame_buffer)} frames")
            
            if self.model_type == "sam2":
                await self._propagate_sam2(session, temp_dir)
            elif self.model_type == "sam3":
                # SAM3 propagation (placeholder/basic implementation)
                 pass

        except Exception as e:
            print(f"Error during propagation: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            # Release lock
            session.is_segmenting = False

    async def _propagate_sam2(self, session, temp_dir):
        """SAM2 mask propagation — runs GPU work in a thread to avoid blocking the event loop."""
        latest_frame_idx = len(session.frame_buffer) - 1

        def _run_propagation():
            """Synchronous GPU work: init state, apply prompts, propagate."""
            predictor = self.video_predictor
            inference_state = predictor.init_state(video_path=temp_dir)
            session.inference_state = inference_state

            prompts_applied = False

            for obj_id, metadata in session.tracked_objects.items():
                original_frame_num = metadata.get("original_frame_number", -1)

                prompt_frame_idx = -1
                for idx, f_data in enumerate(session.frame_buffer):
                    if f_data['frame_number'] == original_frame_num:
                        prompt_frame_idx = idx
                        break

                if prompt_frame_idx < 0:
                    prompt_frame_idx = 0
                    metadata["original_frame_number"] = session.frame_buffer[0]['frame_number']
                    metadata["frame_added"] = 0
                    print(f"    [PROPAGATE] Re-anchoring obj {obj_id} to frame 0 (original frame lost)")

                if "points" in metadata and metadata["points"]:
                    try:
                        predictor.add_new_points_or_box(
                            inference_state=inference_state,
                            frame_idx=prompt_frame_idx,
                            obj_id=int(obj_id),
                            points=np.array(metadata["points"], dtype=np.float32),
                            labels=np.array(metadata["labels"], dtype=np.int32),
                        )
                        prompts_applied = True
                    except Exception as e:
                        print(f"    Warning: Failed to re-apply prompt for obj {obj_id}: {e}")

            if not prompts_applied:
                print(f"    [PROPAGATE] Warning: No prompts applied, skipping propagation")
                return None

            print(f"    [PROPAGATE] Prompts applied successfully, propagating through {len(session.frame_buffer)} frames")

            video_segments = {}
            for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(inference_state):
                video_segments[out_frame_idx] = {
                    out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy().squeeze()
                    for i, out_obj_id in enumerate(out_obj_ids)
                }

            return video_segments

        video_segments = await asyncio.to_thread(_run_propagation)

        if video_segments and latest_frame_idx in video_segments:
            session.latest_masks = video_segments[latest_frame_idx]
            session.last_segmentation_frame = session.frame_buffer[latest_frame_idx]['frame_number']

            if self.on_segmentation_result:
                await self.on_segmentation_result(
                    client_id=session.client_id,
                    masks=session.latest_masks,
                    prompt="auto_propagation",
                    frame_num=session.last_segmentation_frame,
                )


    def composite_rgb_with_masks(self, rgb_frame: np.ndarray, masks: Dict[str, np.ndarray]) -> np.ndarray:
        """
        Composite RGB frame with segmentation masks

        Args:
            rgb_frame: RGB image (H, W, 3)
            masks: Dictionary of obj_id -> mask (H, W)

        Returns:
            Composited RGB image with overlays (H, W, 3)
        """
        # Create copy of RGB frame
        output = rgb_frame.copy()

        # Color palette for different objects
        colors = [
            [255, 0, 0],    # Red
            [0, 255, 0],    # Green
            [0, 0, 255],    # Blue
            [255, 255, 0],  # Yellow
            [255, 0, 255],  # Magenta
            [0, 255, 255],  # Cyan
        ]

        # Blend each mask with alpha=0.5
        for idx, (obj_id, mask) in enumerate(masks.items()):
            # Convert mask to boolean if needed
            if mask.dtype != bool:
                mask = mask > 0.0

            # Resize mask if needed to match RGB frame
            if mask.shape[:2] != rgb_frame.shape[:2]:
                mask = cv2.resize(mask.astype(np.uint8),
                                (rgb_frame.shape[1], rgb_frame.shape[0]),
                                interpolation=cv2.INTER_NEAREST).astype(bool)

            # Get color for this object
            color = colors[idx % len(colors)]

            # Blend with 0.5 alpha
            output[mask] = (output[mask] * 0.5 + np.array(color) * 0.5).astype(np.uint8)

        return output


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
segmentation_service = SegmentationService()
