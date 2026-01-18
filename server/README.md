# AR Stream Server

Simple Python server for receiving and displaying AR data streams from Android ARCore devices.

## What It Does

This server receives RGB camera frames and depth maps from an Android ARCore application via WebSocket and displays them in a web-based dashboard for real-time monitoring.

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. Install Protobuf Compiler

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y protobuf-compiler
protoc --version
```

**macOS:**
```bash
brew install protobuf
protoc --version
```

**Windows:**
Download from [protobuf releases](https://github.com/protocolbuffers/protobuf/releases)

### 3. Generate Protobuf Code

```bash
# Copy the proto schema
cp ../proto/ar_stream.proto proto/

# Generate Python code
protoc --python_out=proto/ proto/ar_stream.proto
```

You should now see `proto/ar_stream_pb2.py`

### 4. Start the Server

```bash
./start_server.sh
```

Or manually:
```bash
source .venv/bin/activate
python main.py
```

The server will start at `ws://0.0.0.0:8080/ar-stream`

### 5. Find Your Server IP

```bash
# Linux/Mac
hostname -I

# Or use the test script
./test_server.sh
```

Note the `websocket_endpoint` from the diagnostics output - this is what you'll use in your Android app.

## Testing

Run the comprehensive test suite:

```bash
./test_server.sh              # Test local server
./test_server.sh 192.168.1.5  # Test remote server
```

Tests include:
1. Ping connectivity
2. Port availability
3. Health endpoint
4. Diagnostics endpoint  
5. Status endpoint
6. WebSocket connection

## Configuration

Edit `config.yaml` to adjust:
- Server host/port
- Buffer size (number of frames to keep in memory)
- Max simultaneous connections

## API Endpoints

The server has only 4 essential endpoints:

- **`GET /`** - Dashboard web interface (opens in browser)
- **`GET /api/clients`** - List connected clients with stats (used by dashboard)
- **`WS /ar-stream`** - WebSocket endpoint for AR data streaming from Android app
- **`WS /ws/dashboard`** - WebSocket endpoint for real-time dashboard updates


## Project Structure

```
server/
├── main.py                   # FastAPI application
├── config.yaml               # Configuration
├── requirements.txt          # Python dependencies
├── start_server.sh           # Server startup script
├── test_server.sh            # Comprehensive test script
├── proto/
│   └── ar_stream_pb2.py      # Generated protobuf code
├── buffer/
│   ├── frame_buffer.py       # Frame buffering per client
│   └── client_manager.py     # Multi-client management
└── templates/
    └── dashboard.html        # Web dashboard UI
```

## Dashboard

Once the server is running, open a web browser and navigate to:

```
http://localhost:8080
```

Or from another device on the same network:

```
http://YOUR_SERVER_IP:8080  
```

The dashboard shows:
- Live RGB camera feed
- Live depth map visualization
- Camera pose matrices (intrinsic, projection, view, pose)
- Frame count and FPS
- Tracking state
- Client connection status

## Troubleshooting

### Connection Issues

If the Android app can't connect:

1. **Check both devices are on same WiFi**
2. **Run the test script:**
   ```bash
   ./test_server.sh YOUR_SERVER_IP
   ```
3. **Check firewall** - ensure port 8080 is open
4. **Verify IP address** - use the IP from `/diagnostics` endpoint

### Protobuf Errors

If you see protobuf import errors:

```bash
# Regenerate protobuf code
cp ../proto/ar_stream.proto proto/
protoc --python_out=proto/ proto/ar_stream.proto
```

### Dashboard Not Updating

1. Open browser console (F12) to check for WebSocket errors
2. Verify the Android app is sending frames (check server logs)
3. Refresh the dashboard page

## Development

The server is designed to be simple and focused on streaming only. It:
- Accepts WebSocket connections from Android ARCore apps
- Decodes protobuf messages containing RGB/depth data
- Buffers frames in memory (last 60 frames per client)
- Broadcasts frames to connected dashboard clients via WebSocket
- Provides diagnostic endpoints for troubleshooting

**No processing is performed** - this is purely a streaming and visualization server.

## Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- Protocol Buffers
- NumPy
- Pillow
- PyYAML

See `requirements.txt` for complete list.
