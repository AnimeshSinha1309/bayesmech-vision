# Segmentation Server API Contract

**Version**: 2.0
**Last Updated**: 2026-02-04
**Protocol**: HTTP/REST + WebSocket Binary Protobuf

---

## Overview

The segmentation server provides real-time video object segmentation using SAM2 (Segment Anything Model 2). It maintains temporal coherence across frames for smooth object tracking.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Main Server (Web/AR Server)                        │
│                                                      │
│  1. HTTP: Create session                            │
│  2. WebSocket: Stream video frames                  │
│  3. HTTP: Send segmentation prompts                 │
│  4. WebSocket: Receive segmentation results         │
│  5. HTTP: Cleanup session                           │
└─────────────────────────────────────────────────────┘
           │                             ▲
           │ HTTP Control                │ WebSocket
           │ + WebSocket Stream          │ Segmentation
           ▼                             │ Results
┌─────────────────────────────────────────────────────┐
│  Segmentation Server (port 8081)                    │
│                                                      │
│  - SAM2 Model (GPU)                                 │
│  - Session Management                               │
│  - Frame Buffer (sliding window)                    │
│  - Temporal Tracking                                │
└─────────────────────────────────────────────────────┘
```

### Design Principles

1. **Async & Non-Blocking**: Frame processing never blocks the WebSocket receiver
2. **Binary Protobuf**: All video data uses binary protobuf for efficiency
3. **Session-Based**: Each client gets a unique session with isolated state
4. **Temporal Coherence**: SAM2 maintains object identity across frames
5. **Auto-Cleanup**: Sessions expire after 5 minutes of inactivity

---

## HTTP API (Control Plane)

### Base URL
```
http://localhost:8081
```

### 1. Start Session

Create a new segmentation session.

**Endpoint**: `POST /segment/session/start`

**Request**: Empty body

**Response**: `application/json`
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Session created successfully
- `500 Internal Server Error`: Server initialization failed

**Notes**:
- Session ID is a UUID v4
- Session is empty until frames are sent via WebSocket
- Session will auto-expire after 5 minutes of inactivity

---

### 2. Add Segmentation Prompt

Send a prompt to initialize object tracking.

**Endpoint**: `POST /segment/session/{session_id}/prompt`

**Request**: `application/json`
```json
{
  "points": [[640, 360], [700, 400]],  // Optional: (x, y) coordinates
  "labels": [1, 0],                     // Optional: 1=foreground, 0=background
  "text": "person"                      // Optional: text prompt (SAM3 only)
}
```

**Response**: `application/json`
```json
{
  "status": "ok",
  "num_objects": 2
}
```

**Status Codes**:
- `200 OK`: Prompt processed successfully
- `400 Bad Request`: Invalid prompt format or no frames in buffer
- `404 Not Found`: Session ID not found
- `500 Internal Server Error`: Segmentation failed

**Notes**:
- At least one of `points`, `labels`, or `text` must be provided
- Point coordinates are in image space (0,0 = top-left)
- Results are automatically broadcast via WebSocket
- Can be called multiple times to track additional objects

---

### 3. Delete Session

Cleanup a session and free resources.

**Endpoint**: `DELETE /segment/session/{session_id}`

**Request**: Empty body

**Response**: `application/json`
```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Session deleted
- `500 Internal Server Error`: Cleanup failed

**Notes**:
- Closes any open WebSocket connections
- Frees GPU memory for this session
- Always call this when done to prevent resource leaks

---

### 4. Get Server Status

Health check and server statistics.

**Endpoint**: `GET /segment/status`

**Request**: None

**Response**: `application/json`
```json
{
  "model_type": "sam2",
  "model_variant": "small",
  "model_loaded": true,
  "device": "cuda",
  "active_sessions": 2,
  "session_ids": ["550e8400-...", "660f9511-..."],
  "cuda_available": true,
  "vram_info": {
    "allocated": "0.45 GB",
    "reserved": "0.60 GB",
    "free": "5.40 GB"
  }
}
```

**Status Codes**:
- `200 OK`: Always succeeds

---

## WebSocket API (Data Plane)

### Endpoint
```
ws://localhost:8081/segment/stream?session_id={session_id}
```

### Query Parameters
- `session_id` (required): Session ID from `/segment/session/start`

### Connection Flow

1. Client creates session via HTTP
2. Client connects WebSocket with `?session_id=...`
3. Server validates session and accepts connection
4. Client sends `SegmentationRequest` (binary protobuf)
5. Server sends `SegmentationOutput` (binary protobuf) asynchronously
6. Connection stays open for duration of session

### Close Codes
- `1000`: Normal closure
- `1008`: Policy violation (missing/invalid session_id)

---

## Protobuf Messages

All messages are defined in `ar_stream.proto`.

### SegmentationRequest

**Sent by**: Client → Server
**Direction**: Client streams video frames

```protobuf
message SegmentationRequest {
  string session_id = 1;          // Session ID
  uint32 frame_number = 2;        // Sequential frame number
  ImageFrame image_frame = 3;     // RGB frame data
  uint64 timestamp_ms = 4;        // Client timestamp
}
```

**ImageFrame** (referenced from `ar_stream.proto`):
```protobuf
message ImageFrame {
  bytes data = 1;              // JPEG bytes or raw RGB888 bytes
  ImageFormat format = 2;      // JPEG=4 or RGB_888=1
  uint32 width = 3;            // Frame width
  uint32 height = 4;           // Frame height
  uint32 quality = 5;          // JPEG quality (0-100)
}
```

**Supported Formats**:
- `ImageFormat.JPEG` (4): Compressed JPEG bytes (recommended)
- `ImageFormat.RGB_888` (1): Raw RGB bytes (width × height × 3)

**Example (Python)**:
```python
import cv2
from server.proto import ar_stream_pb2

# Encode frame as JPEG
_, jpeg_bytes = cv2.imencode('.jpg', bgr_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

# Build request
request = ar_stream_pb2.SegmentationRequest()
request.session_id = session_id
request.frame_number = frame_num
request.timestamp_ms = int(time.time() * 1000)

request.image_frame.data = jpeg_bytes.tobytes()
request.image_frame.format = ar_stream_pb2.JPEG
request.image_frame.width = width
request.image_frame.height = height
request.image_frame.quality = 85

# Send binary
await websocket.send_bytes(request.SerializeToString())
```

---

### SegmentationOutput

**Sent by**: Server → Client
**Direction**: Server streams segmentation results

```protobuf
message SegmentationOutput {
  string session_id = 1;          // Session ID
  uint32 frame_number = 2;        // Frame number (may lag behind input)
  uint64 timestamp_ms = 3;        // Server timestamp
  repeated SegmentationMask masks = 4;  // Masks for all tracked objects
  string prompt_type = 5;         // "point", "text", "auto_grid", "propagation"
  uint32 num_objects = 6;         // Total objects tracked
}

message SegmentationMask {
  uint32 object_id = 1;           // Unique object ID (1, 2, 3...)
  bytes mask_data = 2;            // RGBA PNG, base64 encoded
  float confidence = 3;           // Confidence score (0.0-1.0)
  uint32 pixel_count = 4;         // Number of pixels in mask
}
```

**Example (Python)**:
```python
# Receive binary
data = await websocket.receive_bytes()

# Parse
output = ar_stream_pb2.SegmentationOutput()
output.ParseFromString(data)

print(f"Frame {output.frame_number}: {output.num_objects} objects")

for mask in output.masks:
    # Decode base64 PNG
    mask_png = base64.b64decode(mask.mask_data)
    mask_rgba = cv2.imdecode(
        np.frombuffer(mask_png, np.uint8),
        cv2.IMREAD_UNCHANGED
    )
    print(f"  Object {mask.object_id}: {mask.pixel_count} pixels, "
          f"confidence={mask.confidence:.2f}")
```

---

## Usage Flow

### Complete Example (Python)

```python
import asyncio
import websockets
import requests
import cv2
import time
from server.proto import ar_stream_pb2

# Configuration
HTTP_URL = "http://localhost:8081"
WS_URL = "ws://localhost:8081"

async def segment_video(video_path):
    # 1. Start session (HTTP)
    response = requests.post(f"{HTTP_URL}/segment/session/start")
    session_id = response.json()["session_id"]
    print(f"Session: {session_id}")

    # 2. Connect WebSocket
    ws_uri = f"{WS_URL}/segment/stream?session_id={session_id}"

    async with websockets.connect(ws_uri) as ws:

        # 3. Start receiving results (background task)
        async def receive_results():
            while True:
                try:
                    data = await ws.recv()
                    output = ar_stream_pb2.SegmentationOutput()
                    output.ParseFromString(data)
                    print(f"Received {output.num_objects} masks for frame {output.frame_number}")
                except websockets.ConnectionClosed:
                    break

        receive_task = asyncio.create_task(receive_results())

        # 4. Send frames
        cap = cv2.VideoCapture(video_path)
        frame_num = 0

        while cap.isOpened():
            ret, bgr_frame = cap.read()
            if not ret:
                break

            # Encode as JPEG
            _, jpeg_bytes = cv2.imencode('.jpg', bgr_frame,
                                        [cv2.IMWRITE_JPEG_QUALITY, 85])

            # Build protobuf request
            request = ar_stream_pb2.SegmentationRequest()
            request.session_id = session_id
            request.frame_number = frame_num
            request.timestamp_ms = int(time.time() * 1000)

            request.image_frame.data = jpeg_bytes.tobytes()
            request.image_frame.format = ar_stream_pb2.JPEG
            request.image_frame.width = bgr_frame.shape[1]
            request.image_frame.height = bgr_frame.shape[0]
            request.image_frame.quality = 85

            # Send
            await ws.send(request.SerializeToString())

            frame_num += 1
            await asyncio.sleep(0.033)  # 30 FPS

        cap.release()

        # 5. Add segmentation prompt (HTTP)
        requests.post(
            f"{HTTP_URL}/segment/session/{session_id}/prompt",
            json={
                "points": [[640, 360]],  # Center of 1280x720
                "labels": [1]
            }
        )

        # Wait for final results
        await asyncio.sleep(2)
        receive_task.cancel()

    # 6. Cleanup (HTTP)
    requests.delete(f"{HTTP_URL}/segment/session/{session_id}")
    print("Done")

# Run
asyncio.run(segment_video("video.mp4"))
```

---

## Session Lifecycle

### State Machine

```
   [Create]
      │
      ▼
   CREATED ──────┐
      │          │
   [Connect WS]  │
      │          │ [5min timeout]
      ▼          │
   ACTIVE ───────┤
      │          │
   [Disconnect]  │
      │          │
      ▼          │
   IDLE ─────────┘
      │
   [Delete]
      ▼
   DESTROYED
```

### States

1. **CREATED**: Session exists in service, no WebSocket
2. **ACTIVE**: WebSocket connected, frames being processed
3. **IDLE**: WebSocket disconnected, session kept for reconnection
4. **DESTROYED**: Session deleted, resources freed

### Timeouts

- **Session Timeout**: 5 minutes of inactivity
  - Measured from last frame received or last HTTP request
  - Automatically triggers cleanup and resource freeing

---

## Frame Buffer & Processing

### Sliding Window Buffer

- **Size**: 20 frames (configurable)
- **Strategy**: Circular buffer, auto-drop oldest
- **Processing**: Every 3rd frame (configurable)

### Behavior

```
Frame stream: ───1───2───3───4───5───6───7───8───9───10──▶

Buffer: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
         ▲                                                  ▲
         oldest                                          newest

Processing:     ✓       ✓       ✓       ✓       ✓
               (3)     (6)     (9)    (12)    (15)

When frame 21 arrives:
- Frame 1 dropped
- Frame 21 added
- Inference state re-initialized with frames 2-21
- Prompts re-applied
- Tracking continues
```

### Frame Dropping

If processing cannot keep up with input stream:
- Frames are added to buffer (oldest dropped)
- Processing skips frames to catch up
- Results may lag behind input by several frames
- **No blocking** - frame reception always continues

---

## SAM2 Tracking Mechanism

### What is Tracked?

SAM2 maintains an **"inference state"** per session containing:

1. **Frame Embeddings**: CNN features extracted from buffered frames
2. **Object Masks**: Binary masks for each tracked object
3. **Temporal Memory**: Cross-frame attention features for tracking
4. **Prompt Anchors**: Original prompts (points/boxes) for re-initialization

### Tracking Process

```
User adds prompt at frame N
         │
         ▼
SAM2 generates initial mask for object 1
         │
         ▼
For each new frame N+1, N+2, N+3...
  ├─ Extract frame features (CNN)
  ├─ Use previous mask as "memory"
  ├─ Apply temporal attention
  └─ Predict new mask position
         │
         ▼
Object ID maintained across frames (1, 2, 3...)
```

### Re-anchoring (Sliding Window)

When buffer slides (oldest frame dropped):
1. Create new inference state with remaining frames
2. Re-apply all prompts at their original frame positions
3. Re-run propagation to continue tracking
4. Send updated masks via WebSocket

This prevents unbounded memory growth while maintaining tracking continuity.

---

## Performance Characteristics

### Latency

- **Frame to mask**: 100-300ms (depends on resolution & GPU)
- **WebSocket roundtrip**: <10ms
- **Total latency**: ~150-350ms

### Throughput

- **Input**: 30 FPS (limited by client)
- **Processing**: ~3-10 FPS (every 3rd frame)
- **Output**: ~3-10 FPS (matches processing)

### Memory Usage

- **Per session**: ~55 MB (20 frames × 1280×720×3 bytes)
- **GPU memory**: ~300 MB base + ~100 MB per session
- **Max sessions**: 4-6 on 6GB GPU

### Scalability

- Sessions are independent (no shared state)
- Can scale horizontally with load balancer
- GPU is the bottleneck (not CPU or network)

---

## Error Handling

### Client-Side Errors

| Error | HTTP Code | WebSocket Code | Cause |
|-------|-----------|----------------|-------|
| Missing session_id | - | 1008 | WebSocket query param missing |
| Session not found | 404 | 1008 | Invalid or expired session_id |
| Invalid prompt | 400 | - | Malformed prompt data |
| No frames in buffer | 400 | - | Prompt sent before frames |
| Unsupported format | - | (logged, ignored) | ImageFormat not JPEG/RGB_888 |

### Server-Side Errors

| Error | HTTP Code | Cause |
|-------|-----------|-------|
| Model load failed | 500 | Missing checkpoint or GPU OOM |
| Segmentation failed | 500 | SAM2 inference error |
| Out of memory | 500 | Too many sessions or large frames |

### Retry Strategy

**Recommended client behavior**:
1. If WebSocket closes unexpectedly: Reconnect with same session_id
2. If session not found: Create new session, restart from beginning
3. If prompt fails: Check buffer has frames, retry after 1 second
4. If server returns 500: Exponential backoff, max 3 retries

---

## Configuration

### Server Config (`segmentation_config.yaml`)

```yaml
model:
  type: "sam2"  # "sam2" or "sam3"

streaming:
  frame_buffer_size: 20
  segmentation_interval: 3
  max_tracked_objects: 10
  session_timeout_minutes: 5

memory:
  pytorch_cuda_alloc_conf: "expandable_segments:True"
```

---

## Testing

### Manual Testing with curl

```bash
# 1. Start session
SESSION_ID=$(curl -X POST http://localhost:8081/segment/session/start | jq -r .session_id)

# 2. Check status
curl http://localhost:8081/segment/status | jq

# 3. Add prompt (after connecting WebSocket and sending frames)
curl -X POST http://localhost:8081/segment/session/$SESSION_ID/prompt \
  -H "Content-Type: application/json" \
  -d '{"points": [[640, 360]], "labels": [1]}'

# 4. Delete session
curl -X DELETE http://localhost:8081/segment/session/$SESSION_ID
```

### Automated Testing

See `test_segmentation_working.py` for complete integration test using protobuf WebSocket.

---

## Changelog

### v2.0.0 (2026-02-04)
- **Breaking**: Switched to binary protobuf over WebSocket
- **Breaking**: Added session management with UUIDs
- **Breaking**: Removed JSON endpoints for frames
- Added `SegmentationRequest` and `SegmentationOutput` protobuf messages
- Added automatic session timeout (5 minutes)
- Increased max_tracked_objects to 10
- Fully async, non-blocking frame processing
- Improved error handling and logging

### v1.0.0 (2026-01-27)
- Initial release with JSON over HTTP
- WebSocket for result streaming only

---

## Support

For issues or questions:
- Check logs: Server logs all errors with stack traces
- Verify protobuf versions match
- Ensure session created before WebSocket connection
- Monitor GPU memory with `/segment/status`

**Common Issues**:
1. **"Session not found"**: Create session via HTTP first
2. **"No frames in buffer"**: Wait for frames before sending prompt
3. **WebSocket closes immediately**: Check session_id query param
4. **OOM error**: Reduce frame resolution or max_tracked_objects
