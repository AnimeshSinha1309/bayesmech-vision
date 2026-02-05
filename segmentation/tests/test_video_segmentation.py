#!/usr/bin/env python3
"""
Comprehensive test for the segmentation server with real video data.

This test:
1. Reads RGB frames from a protobuf recording file
2. Starts the isolated segmentation server
3. Sends frames via HTTP API
4. Adds segmentation prompts
5. Retrieves segmentation masks
6. Writes output video with segmentation overlays
"""

import sys
import os
import time
import subprocess
import requests
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
from pathlib import Path

# Add proto directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "server"))
from proto import ar_stream_pb2

# Configuration
RECORDING_FILE = "recordings/arstream_20260126_125018.pb"
OUTPUT_VIDEO = "output/segmented_video.mp4"
SEGMENTATION_SERVER_URL = "http://127.0.0.1:8081"
CLIENT_ID = "test_video_client"

# Video settings
FPS = 10
MAX_FRAMES = 50  # Limit for testing (reduced for faster execution)


class SegmentationServerManager:
    """Manages the segmentation server lifecycle"""

    def __init__(self):
        self.process = None
        self.server_dir = Path(__file__).parent / "segmentation"

    def start(self, timeout=60):
        """Start the segmentation server and wait for it to be ready"""
        print("Starting segmentation server...")

        # Use the start script
        start_script = self.server_dir / "start_segmentation_server.sh"

        self.process = subprocess.Popen(
            ["bash", str(start_script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Wait for server to be ready
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(
                    f"{SEGMENTATION_SERVER_URL}/segment/status", timeout=1
                )
                if response.status_code == 200:
                    status = response.json()
                    if status.get("model_loaded"):
                        print(f"✓ Segmentation server ready ({status.get('model_type')})")
                        return True
            except requests.exceptions.RequestException:
                pass

            # Check if process died
            if self.process.poll() is not None:
                print("✗ Segmentation server process died")
                return False

            time.sleep(1)

        print("✗ Segmentation server failed to start within timeout")
        return False

    def stop(self):
        """Stop the segmentation server"""
        if self.process:
            print("Stopping segmentation server...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
            print("✓ Segmentation server stopped")


def read_protobuf_frames(recording_path, max_frames=None):
    """
    Read RGB frames from a protobuf recording file.

    Yields:
        (frame_number, rgb_frame_np) tuples
    """
    print(f"Reading frames from {recording_path}...")

    with open(recording_path, "rb") as f:
        frame_count = 0

        while True:
            if max_frames and frame_count >= max_frames:
                break

            # Read frame size (4 bytes, big-endian)
            size_bytes = f.read(4)
            if not size_bytes or len(size_bytes) < 4:
                break

            frame_size = int.from_bytes(size_bytes, byteorder="big")

            # Read frame data
            frame_data = f.read(frame_size)
            if len(frame_data) < frame_size:
                break

            # Parse protobuf
            try:
                ar_frame = ar_stream_pb2.ARFrame()
                ar_frame.ParseFromString(frame_data)

                # Extract RGB frame
                if ar_frame.HasField("rgb_frame"):
                    rgb_frame = ar_frame.rgb_frame

                    if rgb_frame.format == ar_stream_pb2.RGB_888:
                        # Raw RGB data
                        width = rgb_frame.width
                        height = rgb_frame.height
                        rgb_data = np.frombuffer(rgb_frame.data, dtype=np.uint8)
                        rgb_img = rgb_data.reshape((height, width, 3))

                    elif rgb_frame.format == ar_stream_pb2.JPEG:
                        # JPEG compressed
                        rgb_img = cv2.imdecode(
                            np.frombuffer(rgb_frame.data, dtype=np.uint8),
                            cv2.IMREAD_COLOR,
                        )
                        rgb_img = cv2.cvtColor(rgb_img, cv2.COLOR_BGR2RGB)

                    else:
                        print(f"Unsupported format: {rgb_frame.format}")
                        continue

                    frame_count += 1
                    if frame_count % 30 == 0:
                        print(f"  Read {frame_count} frames...")

                    yield (ar_frame.frame_number, rgb_img)

            except Exception as e:
                print(f"Error parsing frame: {e}")
                continue

    print(f"✓ Read {frame_count} frames total")


def encode_frame_to_base64(rgb_frame):
    """Encode RGB frame to base64 JPEG"""
    img = Image.fromarray(rgb_frame)
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def decode_mask_from_base64(base64_str):
    """Decode base64 PNG mask to numpy array"""
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))
    rgba = np.array(img)
    return rgba


def composite_frame_with_masks(rgb_frame, masks_dict):
    """
    Composite RGB frame with segmentation masks.

    Args:
        rgb_frame: RGB image (H, W, 3)
        masks_dict: Dictionary of obj_id -> base64_encoded_rgba_mask

    Returns:
        Composited RGB image (H, W, 3)
    """
    output = rgb_frame.copy()

    for obj_id, mask_base64 in masks_dict.items():
        # Decode mask
        rgba_mask = decode_mask_from_base64(mask_base64)

        # Resize if needed
        if rgba_mask.shape[:2] != rgb_frame.shape[:2]:
            rgba_mask = cv2.resize(
                rgba_mask,
                (rgb_frame.shape[1], rgb_frame.shape[0]),
                interpolation=cv2.INTER_NEAREST,
            )

        # Extract alpha channel as mask
        alpha = rgba_mask[:, :, 3] / 255.0
        color = rgba_mask[:, :, :3]

        # Blend
        for c in range(3):
            output[:, :, c] = (
                output[:, :, c] * (1 - alpha) + color[:, :, c] * alpha
            )

    return output.astype(np.uint8)


def test_segmentation_flow():
    """Main test function"""
    print("=" * 60)
    print("Video Segmentation Test")
    print("=" * 60)

    # Check recording file exists
    if not os.path.exists(RECORDING_FILE):
        print(f"✗ Recording file not found: {RECORDING_FILE}")
        return False

    # Create output directory
    os.makedirs("output", exist_ok=True)

    # Start segmentation server
    server = SegmentationServerManager()
    if not server.start():
        return False

    try:
        # Phase 1: Send initial frames to build buffer
        print("\n[Phase 1] Sending initial frames to build buffer...")
        frame_generator = read_protobuf_frames(RECORDING_FILE, MAX_FRAMES)

        initial_frames = []
        for i, (frame_num, rgb_frame) in enumerate(frame_generator):
            initial_frames.append((frame_num, rgb_frame))

            # Send frame to server
            rgb_base64 = encode_frame_to_base64(rgb_frame)
            try:
                response = requests.post(
                    f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                    json={
                        "client_id": CLIENT_ID,
                        "frame_number": int(frame_num),
                        "rgb_frame_base64": rgb_base64,
                    },
                    timeout=30,
                )

                if response.status_code != 200:
                    print(f"✗ Failed to send frame {frame_num}: {response.text}")
                    return False

            except Exception as e:
                print(f"✗ Error sending frame {frame_num}: {e}")
                return False

            # Stop after 10 frames to add prompt
            if i >= 9:
                break

            time.sleep(0.1)  # Rate limiting

        print(f"✓ Sent {len(initial_frames)} initial frames")

        # Phase 2: Add segmentation prompt
        print("\n[Phase 2] Adding segmentation prompt...")

        # Get center point of first frame
        first_frame = initial_frames[0][1]
        height, width = first_frame.shape[:2]
        center_x, center_y = width // 2, height // 2

        # Add just one point for simpler segmentation
        points = [[center_x, center_y]]
        labels = [1]  # Positive

        try:
            response = requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/prompt",
                json={
                    "client_id": CLIENT_ID,
                    "points": points,
                    "labels": labels,
                },
                timeout=60,  # Increased timeout for segmentation
            )

            if response.status_code != 200:
                print(f"✗ Failed to add prompt: {response.text}")
                return False

            result = response.json()
            print(f"✓ Segmentation prompt added, detected {result.get('num_objects', 0)} objects")

        except Exception as e:
            print(f"✗ Error adding prompt: {e}")
            return False

        # Wait for initial segmentation to complete
        print("  Waiting for segmentation to process...")
        time.sleep(5)

        # Phase 3: Continue sending frames and collect segmentation results
        print("\n[Phase 3] Processing remaining frames with segmentation...")

        # Prepare video writer
        first_height, first_width = initial_frames[0][1].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        video_writer = cv2.VideoWriter(
            OUTPUT_VIDEO, fourcc, FPS, (first_width, first_height)
        )

        # Write initial frames with segmentation
        frames_written = 0
        for frame_num, rgb_frame in initial_frames:
            # Get latest masks
            try:
                mask_response = requests.get(
                    f"{SEGMENTATION_SERVER_URL}/segment/masks/{CLIENT_ID}",
                    timeout=2,
                )

                if mask_response.status_code == 200:
                    mask_data = mask_response.json()
                    masks = mask_data.get("masks", {})

                    # Composite frame with masks
                    if masks:
                        composited = composite_frame_with_masks(rgb_frame, masks)
                    else:
                        composited = rgb_frame
                else:
                    composited = rgb_frame

            except Exception as e:
                print(f"  Warning: Failed to get masks for frame {frame_num}: {e}")
                composited = rgb_frame

            # Write to video (convert RGB to BGR for OpenCV)
            video_writer.write(cv2.cvtColor(composited, cv2.COLOR_RGB2BGR))
            frames_written += 1

        # Continue with remaining frames
        remaining_count = 0
        for frame_num, rgb_frame in frame_generator:
            remaining_count += 1

            # Send frame
            rgb_base64 = encode_frame_to_base64(rgb_frame)
            try:
                response = requests.post(
                    f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                    json={
                        "client_id": CLIENT_ID,
                        "frame_number": int(frame_num),
                        "rgb_frame_base64": rgb_base64,
                    },
                    timeout=5,
                )
            except Exception as e:
                print(f"  Warning: Failed to send frame {frame_num}: {e}")

            # Get segmentation masks every few frames
            if remaining_count % 3 == 0:
                time.sleep(0.5)  # Give time for propagation

            try:
                mask_response = requests.get(
                    f"{SEGMENTATION_SERVER_URL}/segment/masks/{CLIENT_ID}",
                    timeout=2,
                )

                if mask_response.status_code == 200:
                    mask_data = mask_response.json()
                    masks = mask_data.get("masks", {})

                    if masks:
                        composited = composite_frame_with_masks(rgb_frame, masks)
                    else:
                        composited = rgb_frame
                else:
                    composited = rgb_frame

            except Exception as e:
                composited = rgb_frame

            # Write to video
            video_writer.write(cv2.cvtColor(composited, cv2.COLOR_RGB2BGR))
            frames_written += 1

            if frames_written % 30 == 0:
                print(f"  Processed {frames_written} frames...")

            time.sleep(0.05)  # Rate limiting

        # Release video writer
        video_writer.release()
        print(f"✓ Wrote {frames_written} frames to {OUTPUT_VIDEO}")

        # Phase 4: Verify output
        print("\n[Phase 4] Verifying output video...")
        if os.path.exists(OUTPUT_VIDEO):
            file_size = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)  # MB
            print(f"✓ Output video created: {OUTPUT_VIDEO} ({file_size:.2f} MB)")

            # Try to open with OpenCV to verify it's valid
            cap = cv2.VideoCapture(OUTPUT_VIDEO)
            if cap.isOpened():
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                print(f"✓ Video is valid: {frame_count} frames at {FPS} FPS")
                cap.release()
                return True
            else:
                print("✗ Failed to open output video")
                return False
        else:
            print("✗ Output video file not created")
            return False

    except Exception as e:
        print(f"✗ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Clean up
        print("\n[Cleanup] Stopping segmentation server...")
        try:
            requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/clear",
                json={"client_id": CLIENT_ID},
                timeout=2,
            )
        except:
            pass

        server.stop()


if __name__ == "__main__":
    print(f"Python: {sys.version}")
    print(f"OpenCV: {cv2.__version__}")
    print(f"NumPy: {np.__version__}\n")

    success = test_segmentation_flow()

    print("\n" + "=" * 60)
    if success:
        print("✓ TEST PASSED")
        print("=" * 60)
        sys.exit(0)
    else:
        print("✗ TEST FAILED")
        print("=" * 60)
        sys.exit(1)
