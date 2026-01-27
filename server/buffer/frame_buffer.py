from collections import deque
from threading import Lock
import time
import logging

logger = logging.getLogger(__name__)

class FrameBuffer:
    """Thread-safe circular buffer for incoming frames"""

    def __init__(self, max_size: int = 60, client_id: str = "default"):
        self.max_size = max_size
        self.client_id = client_id
        self.buffer = deque(maxlen=max_size)
        self.lock = Lock()

        # Metadata
        self.frames_received = 0
        self.frames_processed = 0
        self.frames_with_depth = 0
        self.frames_without_depth = 0
        self.start_time = time.time()

    def add_frame(self, frame_data: dict):
        """Add frame to buffer (FIFO, drops oldest if full)"""
        with self.lock:
            self.buffer.append(frame_data)
            self.frames_received += 1
            
            # Track depth availability
            if 'depth_map' in frame_data and frame_data['depth_map'] is not None:
                self.frames_with_depth += 1
            else:
                self.frames_without_depth += 1

    def get_latest_frame(self):
        """Get most recent frame"""
        with self.lock:
            return self.buffer[-1] if self.buffer else None

    def get_frame_sequence(self, count: int) -> list:
        """Get last N frames for temporal processing"""
        with self.lock:
            return list(self.buffer)[-count:] if len(self.buffer) >= count else []

    def get_frame_by_number(self, frame_num: int):
        """Get specific frame by sequence number"""
        with self.lock:
            for frame in reversed(self.buffer):
                if frame.get('frame_number') == frame_num:
                    return frame
            return None

    def mark_processed(self, frame_num: int):
        """Mark frame as processed"""
        self.frames_processed += 1

    def get_stats(self) -> dict:
        """Get buffer statistics"""
        elapsed = time.time() - self.start_time
        total_frames = self.frames_with_depth + self.frames_without_depth
        depth_percentage = (self.frames_with_depth / total_frames * 100) if total_frames > 0 else 0
        
        return {
            'client_id': self.client_id,
            'buffer_size': len(self.buffer),
            'max_size': self.max_size,
            'frames_received': self.frames_received,
            'frames_processed': self.frames_processed,
            'frames_with_depth': self.frames_with_depth,
            'frames_without_depth': self.frames_without_depth,
            'depth_percentage': round(depth_percentage, 1),
            'avg_fps_received': self.frames_received / elapsed if elapsed > 0 else 0,
            'avg_fps_processed': self.frames_processed / elapsed if elapsed > 0 else 0,
        }
