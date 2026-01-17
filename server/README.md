# AR Stream Server

Python server for receiving and processing AR data streams from Android ARCore devices.

## Features

- WebSocket-based real-time streaming
- YOLOv8 object segmentation
- Multi-object tracking
- 3D position reconstruction
- Motion analysis and collision detection
- SQLite database for inference results

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy the protobuf schema:
```bash
cp ../proto/ar_stream.proto proto/
```

3. Generate Python protobuf code:
```bash
protoc --python_out=proto/ proto/ar_stream.proto
```

4. Start the server:
```bash
python main.py
```

The server will run at `ws://0.0.0.0:8080/ar-stream`

## Configuration

Edit `config.yaml` to adjust:
- Server host/port
- YOLO model (yolov8n-seg for speed, yolov8m-seg for accuracy)
- Tracking parameters
- Database location

## API Endpoints

- `GET /` - Server status
- `GET /export/{client_id}` - Export inference results to JSON
- `WS /ar-stream` - WebSocket endpoint for AR data streaming

## Directory Structure

```
server/
├── main.py                    # FastAPI entry point
├── config.yaml                # Configuration
├── requirements.txt           # Python dependencies
├── proto/
│   └── ar_stream_pb2.py       # Generated protobuf (run protoc)
├── buffer/
│   ├── frame_buffer.py        # Frame buffering
│   └── client_manager.py      # Multi-client management
├── processing/
│   ├── segmentation.py        # YOLOv8 segmentation
│   ├── tracking.py            # Object tracking
│   ├── reconstruction_3d.py   # 3D reconstruction
│   ├── motion_analysis.py     # Motion/collision analysis
│   └── pipeline.py            # Processing orchestration
├── storage/
│   ├── database.py            # SQLite interface
│   ├── schema.sql             # Database schema
│   └── export.py              # JSON export
└── utils/
    ├── camera_utils.py        # Camera math utilities
    ├── geometry_utils.py      # 3D geometry helpers
    └── visualization.py       # OpenCV visualization
```
