
import asyncio
import websockets
import json
import numpy as np
import cv2
import base64
import sys
import os
import time
from typing import Optional

# Add proto directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "server"))
from proto import ar_stream_pb2

HOST = "localhost"
PORT = 8080
CLIENT_ID = "test_simulation_client"

def create_dummy_frame(frame_num: int, width=640, height=480):
    """Create a dummy RGB frame with a moving circle"""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Draw a moving circle
    x = int((frame_num * 5) % width)
    y = int(height // 2)
    cv2.circle(img, (x, y), 30, (0, 255, 0), -1)
    
    return img

def create_protobuf_frame(frame_num: int, img_np: np.ndarray, client_id: str):
    """Create ARFrame protobuf message"""
    frame = ar_stream_pb2.ARFrame()
    frame.frame_number = frame_num
    frame.timestamp_ns = int(time.time() * 1e9)
    frame.device_id = client_id
    
    # Add RGB frame
    rgb = frame.rgb_frame
    rgb.width = img_np.shape[1]
    rgb.height = img_np.shape[0]
    rgb.format = ar_stream_pb2.RGB_888
    rgb.data = img_np.tobytes()
    
    return frame

async def run_test():
    async with websockets.connect(f"ws://{HOST}:{PORT}/ar-stream") as stream_ws, \
               websockets.connect(f"ws://{HOST}:{PORT}/ws/segmentation") as seg_ws:
        
        print("Connected to server.")
        
        # 1. Send initial frames to fill buffer
        print("Sending initial frames...")
        for i in range(10):
            img = create_dummy_frame(i)
            frame = create_protobuf_frame(i, img, CLIENT_ID)
            await stream_ws.send(frame.SerializeToString())
            await asyncio.sleep(0.05)
            
        # 2. Send segmentation prompt (Point on the circle)
        print("Sending point prompt...")
        # Circle is at roughly (x=10*5=50, y=240)
        prompt = {
            "type": "add_point_prompt",
            "client_id": CLIENT_ID,
            "points": [[50, 240]],
            "labels": [1]
        }
        await seg_ws.send(json.dumps(prompt))
        
        # Wait for prompt response
        resp = await seg_ws.recv()
        resp_data = json.loads(resp)
        print(f"Prompt response type: {resp_data.get('type')}")
        if resp_data.get('type') == 'error':
            print(f"Error: {resp_data.get('message')}")
            return

        # 3. Send more frames and verify propagation
        print("Sending more frames to test propagation...")
        
        # We'll listen for segmentation updates in background
        async def listen_for_updates():
            try:
                while True:
                    msg = await asyncio.wait_for(seg_ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    if data.get('type') == 'segmentation_result': # Or whatever the broadcast type is
                        print(f"Received segmentation for frame/update.")
            except asyncio.TimeoutError:
                print("No segmentation update received in 1s.")
            except Exception as e:
                print(f"Listen error: {e}")

        # Start listening loop task? Or just check periodically?
        # For simplicity, we'll ping-pong or just check
        
        for i in range(10, 30):
            img = create_dummy_frame(i)
            frame = create_protobuf_frame(i, img, CLIENT_ID)
            await stream_ws.send(frame.SerializeToString())
            
            # Allow time for server to process
            await asyncio.sleep(0.1)
            
        print("Finished sending frames. If we saw no updates after prompt, propagation is broken.")

if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Test failed: {e}")
