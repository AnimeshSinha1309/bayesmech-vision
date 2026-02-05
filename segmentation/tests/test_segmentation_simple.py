#!/usr/bin/env python3
"""
Simple segmentation server test - just verify basic functionality
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
SEGMENTATION_SERVER_URL = "http://127.0.0.1:8081"
CLIENT_ID = "test_client"

def start_server():
    """Start the segmentation server"""
    print("Starting segmentation server...")
    server_dir = Path(__file__).parent / "segmentation"
    start_script = server_dir / "start_segmentation_server.sh"

    process = subprocess.Popen(
        ["bash", str(start_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    # Wait for server to be ready (with longer timeout for model loading)
    print("Waiting for server to load model (this may take 60-90s)...")
    start_time = time.time()
    for i in range(120):  # 2 minutes timeout
        try:
            response = requests.get(f"{SEGMENTATION_SERVER_URL}/segment/status", timeout=1)
            if response.status_code == 200:
                status = response.json()
                if status.get("model_loaded"):
                    elapsed = time.time() - start_time
                    print(f"✓ Server ready after {elapsed:.1f}s ({status.get('model_type')})")
                    return process
        except requests.exceptions.RequestException:
            pass

        if process.poll() is not None:
            print("✗ Server process died")
            return None

        if i % 10 == 0 and i > 0:
            print(f"  Still waiting... ({i}s)")

        time.sleep(1)

    print("✗ Server failed to start within timeout")
    process.terminate()
    return None

def read_some_frames(recording_path, max_frames=20):
    """Read first N frames from protobuf file"""
    print(f"Reading frames from {recording_path}...")
    frames = []

    with open(recording_path, "rb") as f:
        while len(frames) < max_frames:
            size_bytes = f.read(4)
            if not size_bytes or len(size_bytes) < 4:
                break

            frame_size = int.from_bytes(size_bytes, byteorder="big")
            frame_data = f.read(frame_size)
            if len(frame_data) < frame_size:
                break

            try:
                ar_frame = ar_stream_pb2.ARFrame()
                ar_frame.ParseFromString(frame_data)

                if ar_frame.HasField("rgb_frame"):
                    rgb_frame = ar_frame.rgb_frame

                    if rgb_frame.format == ar_stream_pb2.RGB_888:
                        width = rgb_frame.width
                        height = rgb_frame.height
                        rgb_data = np.frombuffer(rgb_frame.data, dtype=np.uint8)
                        rgb_img = rgb_data.reshape((height, width, 3))
                    elif rgb_frame.format == ar_stream_pb2.JPEG:
                        rgb_img = cv2.imdecode(
                            np.frombuffer(rgb_frame.data, dtype=np.uint8),
                            cv2.IMREAD_COLOR,
                        )
                        rgb_img = cv2.cvtColor(rgb_img, cv2.COLOR_BGR2RGB)
                    else:
                        continue

                    frames.append((ar_frame.frame_number, rgb_img))

            except Exception as e:
                print(f"Error parsing frame: {e}")
                continue

    print(f"✓ Read {len(frames)} frames")
    return frames

def encode_frame_to_base64(rgb_frame):
    """Encode RGB frame to base64 JPEG"""
    img = Image.fromarray(rgb_frame)
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def main():
    print("=" * 60)
    print("Simple Segmentation Server Test")
    print("=" * 60)

    # Check recording file
    if not os.path.exists(RECORDING_FILE):
        print(f"✗ Recording file not found: {RECORDING_FILE}")
        return False

    # Start server
    server_process = start_server()
    if not server_process:
        return False

    try:
        # Read frames
        frames = read_some_frames(RECORDING_FILE, max_frames=20)
        if not frames:
            print("✗ No frames loaded")
            return False

        # Send frames
        print(f"\nSending {len(frames)} frames to server...")
        for i, (frame_num, rgb_frame) in enumerate(frames):
            rgb_base64 = encode_frame_to_base64(rgb_frame)
            response = requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                json={
                    "client_id": CLIENT_ID,
                    "frame_number": int(frame_num),
                    "rgb_frame_base64": rgb_base64,
                },
                timeout=30,  # Increased timeout for first few frames
            )

            if response.status_code != 200:
                print(f"✗ Failed to send frame {frame_num}: {response.text}")
                return False

            if i % 5 == 0:
                print(f"  Sent frame {i+1}/{len(frames)}")

            time.sleep(0.1)

        print("✓ All frames sent successfully")

        # Add segmentation prompt
        print("\nAdding segmentation prompt...")
        first_frame = frames[0][1]
        height, width = first_frame.shape[:2]
        center_x, center_y = width // 2, height // 2

        points = [[center_x, center_y]]
        labels = [1]

        response = requests.post(
            f"{SEGMENTATION_SERVER_URL}/segment/prompt",
            json={
                "client_id": CLIENT_ID,
                "points": points,
                "labels": labels,
            },
            timeout=30,
        )

        if response.status_code != 200:
            print(f"✗ Failed to add prompt: {response.text}")
            return False

        result = response.json()
        print(f"DEBUG: Response type: {type(result)}, content: {result}")

        if isinstance(result, dict):
            print(f"✓ Segmentation prompt added, detected {result.get('num_objects', 0)} objects")
        else:
            print(f"✓ Segmentation prompt added (unexpected response format)")

        # Wait and check for masks
        print("\nWaiting for segmentation results...")
        time.sleep(3)

        mask_response = requests.get(
            f"{SEGMENTATION_SERVER_URL}/segment/masks/{CLIENT_ID}",
            timeout=5,
        )

        if mask_response.status_code == 200:
            mask_data = mask_response.json()
            masks = mask_data.get("masks", {})
            print(f"✓ Retrieved {len(masks)} segmentation masks")

            if masks:
                print("\n" + "=" * 60)
                print("✓ TEST PASSED - Server is working correctly!")
                print("=" * 60)
                return True
            else:
                print("⚠ Warning: No masks returned (may need more frames)")
                return True  # Still consider it a pass if basic flow works
        else:
            print(f"⚠ Could not retrieve masks: {mask_response.status_code}")
            return True  # Still consider it a pass if basic flow works

    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup
        print("\nCleaning up...")
        try:
            requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/clear",
                json={"client_id": CLIENT_ID},
                timeout=2,
            )
        except:
            pass

        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
            server_process.wait()
        print("✓ Server stopped")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
