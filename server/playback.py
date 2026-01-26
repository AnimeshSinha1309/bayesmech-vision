"""
Playback module for replaying recorded AR sessions.
Reads length-delimited protobuf files and streams frames to clients.
"""

import asyncio
import struct
import logging
from pathlib import Path
from typing import Optional, AsyncIterator

logger = logging.getLogger(__name__)

class PlaybackManager:
    """Manages playback of recorded AR sessions."""
    
    def __init__(self, recordings_dir: str = "recordings"):
        self.recordings_dir = Path(recordings_dir)
        self.recordings_dir.mkdir(exist_ok=True)
        self.is_playing = False
        self.playback_task: Optional[asyncio.Task] = None
        
    def list_recordings(self) -> list[Path]:
        """List all available recording files."""
        return sorted(self.recordings_dir.glob("arstream_*.pb"), reverse=True)
    
    async def read_frames(self, filepath: Path, ar_stream_pb2) -> AsyncIterator:
        """
        Read frames from a length-delimited protobuf file.
        Yields ARFrame messages one at a time.
        
        Args:
            filepath: Path to the recording file
            ar_stream_pb2: The protobuf module (passed from main.py)
        """
        logger.info(f"Reading recording from {filepath}")
        frame_count = 0
        
        try:
            with open(filepath, 'rb') as f:
                while True:
                    # Read 4-byte length prefix (big-endian)
                    length_bytes = f.read(4)
                    if not length_bytes:
                        break  # End of file
                    
                    if len(length_bytes) < 4:
                        logger.warning(f"Incomplete length prefix at frame {frame_count}")
                        break
                    
                    # Unpack big-endian unsigned int
                    frame_length = struct.unpack('>I', length_bytes)[0]
                    
                    # Validate frame length
                    if frame_length == 0 or frame_length > 10 * 1024 * 1024:  # Max 10MB per frame
                        logger.error(f"Invalid frame length: {frame_length}")
                        break
                    
                    # Read frame data
                    frame_data = f.read(frame_length)
                    if len(frame_data) < frame_length:
                        logger.warning(f"Incomplete frame data at frame {frame_count}")
                        break
                    
                    # Parse protobuf
                    try:
                        ar_frame = ar_stream_pb2.ARFrame()
                        ar_frame.ParseFromString(frame_data)
                        frame_count += 1
                        yield ar_frame
                        
                    except Exception as e:
                        logger.error(f"Failed to parse frame {frame_count}: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error reading recording: {e}")
            raise
        
        logger.info(f"Finished reading {frame_count} frames from {filepath.name}")
    
    async def play(
        self, 
        filepath: Path, 
        broadcast_callback,
        ar_stream_pb2,
        speed: float = 1.0,
        loop: bool = False
    ):
        """
        Play back a recording, streaming frames at their original timing.
        
        Args:
            filepath: Path to the recording file
            broadcast_callback: Async function to broadcast frames
            ar_stream_pb2: The protobuf module
            speed: Playback speed multiplier (1.0 = real-time)
            loop: Whether to loop playback
        """
        self.is_playing = True
        
        try:
            while self.is_playing:
                prev_timestamp = None
                frame_count = 0
                
                async for ar_frame in self.read_frames(filepath, ar_stream_pb2):
                    if not self.is_playing:
                        break
                    
                    # Calculate delay based on frame timestamps
                    if prev_timestamp is not None and ar_frame.timestamp_ns > 0:
                        delay_ns = ar_frame.timestamp_ns - prev_timestamp
                        delay_seconds = (delay_ns / 1e9) / speed
                        
                        # Cap delays to avoid long pauses (max 1 second)
                        delay_seconds = min(delay_seconds, 1.0)
                        
                        if delay_seconds > 0:
                            await asyncio.sleep(delay_seconds)
                    
                    # Broadcast frame
                    try:
                        await broadcast_callback(ar_frame)
                        frame_count += 1
                        
                        if frame_count % 100 == 0:
                            logger.debug(f"Played {frame_count} frames")
                            
                    except Exception as e:
                        logger.error(f"Error broadcasting frame: {e}")
                    
                    prev_timestamp = ar_frame.timestamp_ns
                
                logger.info(f"Playback finished: {frame_count} frames from {filepath.name}")
                
                if not loop:
                    break
                    
                # Small delay before looping
                await asyncio.sleep(1.0)
                
        except Exception as e:
            logger.error(f"Playback error: {e}")
            raise
        finally:
            self.is_playing = False
    
    async def start_playback(
        self, 
        filename: str, 
        broadcast_callback,
        ar_stream_pb2,
        speed: float = 1.0,
        loop: bool = False
    ):
        """Start playback in a background task."""
        filepath = self.recordings_dir / filename
        
        if not filepath.exists():
            raise FileNotFoundError(f"Recording not found: {filename}")
        
        # Stop any existing playback
        await self.stop_playback()
        
        # Start new playback task
        self.playback_task = asyncio.create_task(
            self.play(filepath, broadcast_callback, ar_stream_pb2, speed, loop)
        )
        
        logger.info(f"Started playback: {filename} (speed={speed}x, loop={loop})")
    
    async def stop_playback(self):
        """Stop current playback."""
        self.is_playing = False
        
        if self.playback_task and not self.playback_task.done():
            self.playback_task.cancel()
            try:
                await self.playback_task
            except asyncio.CancelledError:
                pass
        
        self.playback_task = None
        logger.info("Playback stopped")
    
    def get_status(self) -> dict:
        """Get current playback status."""
        return {
            "is_playing": self.is_playing,
            "has_task": self.playback_task is not None and not self.playback_task.done()
        }
