#!/usr/bin/env python3
"""
Quick segmentation test - processes just 30 frames to verify end-to-end functionality
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
OUTPUT_VIDEO = "output/test_segmented.mp4"
SEGMENTATION_SERVER_URL = "http://127.0.0.1:8081"
CLIENT_ID = "quick_test_client"
MAX_FRAMES = 30
FPS = 10

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

    print("Waiting for server...")
    for i in range(120):
        try:
            response = requests.get(f"{SEGMENTATION_SERVER_URL}/segment/status", timeout=1)
            if response.status_code == 200 and response.json().get("model_loaded"):
                print(f"✓ Server ready")
                return process
        except:
            pass
        if process.poll() is not None:
            return None
        time.sleep(1)

    process.terminate()
    return None

def read_frames(recording_path, max_frames):
    """Read frames from protobuf file"""
    print(f"Reading {max_frames} frames...")
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

def decode_mask_from_base64(base64_str):
    """Decode base64 PNG mask to numpy array"""
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))
    rgba = np.array(img)
    return rgba

def composite_frame(rgb_frame, masks_dict):
    """Composite RGB frame with masks"""
    output = rgb_frame.copy()

    for obj_id, mask_base64 in masks_dict.items():
        rgba_mask = decode_mask_from_base64(mask_base64)

        if rgba_mask.shape[:2] != rgb_frame.shape[:2]:
            rgba_mask = cv2.resize(
                rgba_mask,
                (rgb_frame.shape[1], rgb_frame.shape[0]),
                interpolation=cv2.INTER_NEAREST,
            )

        alpha = rgba_mask[:, :, 3] / 255.0
        color = rgba_mask[:, :, :3]

        for c in range(3):
            output[:, :, c] = output[:, :, c] * (1 - alpha) + color[:, :, c] * alpha

    return output.astype(np.uint8)

def main():
    print("="*60)
    print("Quick Video Segmentation Test (30 frames)")
    print("="*60)

    if not os.path.exists(RECORDING_FILE):
        print(f"✗ Recording not found: {RECORDING_FILE}")
        return False

    os.makedirs("output", exist_ok=True)

    server = start_server()
    if not server:
        print("✗ Server failed to start")
        return False

    try:
        # Read all frames
        frames = read_frames(RECORDING_FILE, MAX_FRAMES)
        if not frames:
            print("✗ No frames loaded")
            return False

        # Send first 10 frames
        print("\nSending initial frames...")
        for i in range(min(10, len(frames))):
            frame_num, rgb_frame = frames[i]
            rgb_base64 = encode_frame_to_base64(rgb_frame)
            requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                json={
                    "client_id": CLIENT_ID,
                    "frame_number": int(frame_num),
                    "rgb_frame_base64": rgb_base64,
                },
                timeout=30,
            )
            time.sleep(0.1)

        print("✓ Initial frames sent")

        # Add prompt
        print("\nAdding segmentation prompt...")
        first_frame = frames[0][1]
        height, width = first_frame.shape[:2]

        response = requests.post(
            f"{SEGMENTATION_SERVER_URL}/segment/prompt",
            json={
                "client_id": CLIENT_ID,
                "points": [[width // 2, height // 2]],
                "labels": [1],
            },
            timeout=60,
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✓ Segmentation started, detected {result.get('num_objects', 0)} object(s)")
        else:
            print(f"✗ Segmentation failed: {response.text}")
            return False

        time.sleep(5)  # Wait for initial segmentation

        # Create video writer
        first_height, first_width = frames[0][1].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, FPS, (first_width, first_height))

        print("\nProcessing and writing video...")
        frames_written = 0

        for i, (frame_num, rgb_frame) in enumerate(frames):
            # Send frame if not already sent
            if i >= 10:
                rgb_base64 = encode_frame_to_base64(rgb_frame)
                try:
                    requests.post(
                        f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                        json={
                            "client_id": CLIENT_ID,
                            "frame_number": int(frame_num),
                            "rgb_frame_base64": rgb_base64,
                        },
                        timeout=30,
                    )
                except:
                    pass

                time.sleep(0.1)

            # Get masks
            try:
                mask_response = requests.get(
                    f"{SEGMENTATION_SERVER_URL}/segment/masks/{CLIENT_ID}",
                    timeout=2,
                )

                if mask_response.status_code == 200:
                    mask_data = mask_response.json()
                    masks = mask_data.get("masks", {})
                    if masks:
                        composited = composite_frame(rgb_frame, masks)
                    else:
                        composited = rgb_frame
                else:
                    composited = rgb_frame
            except:
                composited = rgb_frame

            writer.write(cv2.cvtColor(composited, cv2.COLOR_RGB2BGR))
            frames_written += 1

            if frames_written % 10 == 0:
                print(f"  Wrote {frames_written}/{len(frames)} frames")

        writer.release()
        print(f"✓ Wrote {frames_written} frames to {OUTPUT_VIDEO}")

        # Verify output
        if os.path.exists(OUTPUT_VIDEO):
            file_size = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
            print(f"\n✓ Output video: {OUTPUT_VIDEO} ({file_size:.2f} MB)")

            cap = cv2.VideoCapture(OUTPUT_VIDEO)
            if cap.isOpened():
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.release()
                print(f"✓ Video valid: {frame_count} frames")
                return True
            else:
                print("✗ Video file corrupted")
                return False
        else:
            print("✗ Video file not created")
            return False

    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        print("\nCleaning up...")
        try:
            requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/clear",
                json={"client_id": CLIENT_ID},
                timeout=2,
            )
        except:
            pass

        server.terminate()
        try:
            server.wait(timeout=5)
        except:
            server.kill()
            server.wait()
        print("✓ Server stopped")

if __name__ == "__main__":
    success = main()
    print("\n" + "="*60)
    if success:
        print("✓ TEST PASSED")
    else:
        print("✗ TEST FAILED")
    print("="*60)
    sys.exit(0 if success else 1)
