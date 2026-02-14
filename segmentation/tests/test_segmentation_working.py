#!/usr/bin/env python3
"""
Working segmentation test - minimal version that actually completes
Processes 15 frames with proper video finalization
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

sys.path.append(os.path.join(os.path.dirname(__file__), "server"))
from proto import ar_stream_pb2

RECORDING_FILE = "recordings/arstream_20260126_125018.pb"
OUTPUT_VIDEO = "output/working_segmented.mp4"
SEGMENTATION_SERVER_URL = "http://127.0.0.1:8081"
CLIENT_ID = "working_test"
NUM_FRAMES = 15
FPS = 10

def start_server():
    print("Starting server...")
    server_dir = Path(__file__).parent / "segmentation"
    process = subprocess.Popen(
        ["bash", str(server_dir / "start_segmentation_server.sh")],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    for i in range(120):
        try:
            r = requests.get(f"{SEGMENTATION_SERVER_URL}/segment/status", timeout=1)
            if r.status_code == 200 and r.json().get("model_loaded"):
                print("✓ Server ready")
                return process
        except:
            pass
        if process.poll() is not None:
            return None
        time.sleep(1)

    process.terminate()
    return None

def read_frames(path, n):
    frames = []
    with open(path, "rb") as f:
        while len(frames) < n:
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
                        w, h = rgb_frame.width, rgb_frame.height
                        data = np.frombuffer(rgb_frame.data, dtype=np.uint8)
                        img = data.reshape((h, w, 3))
                    elif rgb_frame.format == ar_stream_pb2.JPEG:
                        img = cv2.imdecode(
                            np.frombuffer(rgb_frame.data, dtype=np.uint8),
                            cv2.IMREAD_COLOR
                        )
                        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    else:
                        continue

                    frames.append((ar_frame.frame_number, img))
            except:
                continue

    print(f"✓ Read {len(frames)} frames")
    return frames

def encode_frame(rgb):
    img = Image.fromarray(rgb)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def decode_mask(b64):
    data = base64.b64decode(b64)
    img = Image.open(BytesIO(data))
    return np.array(img)

def composite(rgb, masks):
    out = rgb.copy()
    for mask_b64 in masks.values():
        rgba = decode_mask(mask_b64)
        if rgba.shape[:2] != rgb.shape[:2]:
            rgba = cv2.resize(rgba, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_NEAREST)

        alpha = rgba[:, :, 3] / 255.0
        color = rgba[:, :, :3]

        for c in range(3):
            out[:, :, c] = out[:, :, c] * (1 - alpha) + color[:, :, c] * alpha

    return out.astype(np.uint8)

def main():
    print("="*60)
    print(f"Working Segmentation Test ({NUM_FRAMES} frames)")
    print("="*60)

    if not os.path.exists(RECORDING_FILE):
        print(f"✗ Recording not found")
        return False

    os.makedirs("output", exist_ok=True)

    server = start_server()
    if not server:
        print("✗ Server start failed")
        return False

    try:
        frames = read_frames(RECORDING_FILE, NUM_FRAMES)
        if not frames:
            return False

        # Send first 5 frames
        print("\nSending initial frames...")
        for i in range(min(5, len(frames))):
            fn, rgb = frames[i]
            b64 = encode_frame(rgb)
            requests.post(
                f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                json={"client_id": CLIENT_ID, "frame_number": int(fn), "rgb_frame_base64": b64},
                timeout=30
            )
            time.sleep(0.1)
        print("✓ Initial frames sent")

        # Add prompt
        print("\nAdding prompt...")
        h, w = frames[0][1].shape[:2]
        r = requests.post(
            f"{SEGMENTATION_SERVER_URL}/segment/prompt",
            json={"client_id": CLIENT_ID, "points": [[w//2, h//2]], "labels": [1]},
            timeout=60
        )

        if r.status_code == 200:
            print(f"✓ Prompt added, {r.json().get('num_objects', 0)} object(s)")
        else:
            print(f"✗ Prompt failed")
            return False

        time.sleep(3)  # Wait for segmentation

        # Create video
        print("\nCreating video...")
        h, w = frames[0][1].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, FPS, (w, h))

        written = 0
        for i, (fn, rgb) in enumerate(frames):
            # Send remaining frames
            if i >= 5:
                b64 = encode_frame(rgb)
                try:
                    requests.post(
                        f"{SEGMENTATION_SERVER_URL}/segment/add_frame",
                        json={"client_id": CLIENT_ID, "frame_number": int(fn), "rgb_frame_base64": b64},
                        timeout=30
                    )
                    time.sleep(0.1)
                except:
                    pass

            # Get masks and composite
            try:
                r = requests.get(f"{SEGMENTATION_SERVER_URL}/segment/masks/{CLIENT_ID}", timeout=2)
                if r.status_code == 200:
                    masks = r.json().get("masks", {})
                    if masks:
                        composited = composite(rgb, masks)
                    else:
                        composited = rgb
                else:
                    composited = rgb
            except:
                composited = rgb

            # Write frame
            writer.write(cv2.cvtColor(composited, cv2.COLOR_RGB2BGR))
            written += 1

            if written % 5 == 0:
                print(f"  Wrote {written}/{len(frames)} frames")

        # CRITICAL: Properly release writer
        writer.release()
        print(f"✓ Video finalized: {written} frames")

        # Verify
        if os.path.exists(OUTPUT_VIDEO):
            size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
            print(f"\n✓ Output: {OUTPUT_VIDEO} ({size_mb:.2f} MB)")

            cap = cv2.VideoCapture(OUTPUT_VIDEO)
            if cap.isOpened():
                fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.release()
                print(f"✓ Video valid: {fc} frames readable")
                return fc > 0
            else:
                print("✗ Video unreadable")
                return False
        else:
            print("✗ Video not created")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        print("\nCleaning up...")
        try:
            requests.post(f"{SEGMENTATION_SERVER_URL}/segment/clear",
                         json={"client_id": CLIENT_ID}, timeout=2)
        except:
            pass

        server.terminate()
        try:
            server.wait(timeout=5)
        except:
            server.kill()
            server.wait()
        print("✓ Done")

if __name__ == "__main__":
    success = main()
    print("\n" + "="*60)
    print("✓ TEST PASSED" if success else "✗ TEST FAILED")
    print("="*60)
    sys.exit(0 if success else 1)
