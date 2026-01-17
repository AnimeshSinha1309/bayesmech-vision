# Quick Start Guide

Get the AR streaming system up and running in 5 minutes!

## Prerequisites
- Python 3.8+ installed
- Android device with ARCore support
- Both devices on same WiFi network

## Step 1: Start Python Server (2 minutes)

```bash
# Terminal 1: Server setup
cd server
pip install -r requirements.txt

# Generate protobuf code
chmod +x generate_proto.sh
./generate_proto.sh

# Start server
python main.py
```

**Expected output:**
```
INFO: Server started on 0.0.0.0:8080
INFO: Processing pipeline started
```

**Note your server IP:**
```bash
# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Example: `192.168.1.100`

## Step 2: Configure Android App (1 minute)

Open `android/app/src/main/java/com/google/ar/core/examples/kotlin/helloar/HelloArActivity.kt`

Find this line (~line 100):
```kotlin
serverUrl = "ws://192.168.1.100:8080/ar-stream",
```

**Replace `192.168.1.100` with your server IP from Step 1.**

## Step 3: Build & Run Android App (2 minutes)

```bash
# Terminal 2: Android build
cd android
./gradlew installDebug

# Or open in Android Studio and click "Run"
```

## Step 4: Test the System

1. **On Android device:**
   - Open the HelloAR app
   - Grant camera permissions
   - Point camera at environment
   - Wait for plane detection
   - Streaming starts automatically!

2. **On server terminal:**
   You should see:
   ```
   INFO: Client 192.168.1.50:54321 connected
   INFO: Sent frame 30, quality: HIGH, bandwidth: 2.5 Mbps
   ```

3. **Check server status:**
   ```bash
   curl http://YOUR_SERVER_IP:8080/
   ```

## Verification

### Server is receiving frames:
```bash
# Terminal 3
curl http://localhost:8080/ | jq
```

Expected:
```json
{
  "status": "running",
  "active_connections": 1,
  "clients": [
    {
      "client_id": "192.168.1.50:54321",
      "frames_received": 150,
      "avg_fps_received": 20.5
    }
  ]
}
```

### Export tracked objects:
```bash
# Get client ID from status endpoint
curl http://localhost:8080/export/192.168.1.50:54321
```

Output: `./exports/192_168_1_50_54321_1234567890.json`

## Troubleshooting

### Server: Connection refused
```bash
# Check server is running
curl http://localhost:8080/health

# Check firewall
sudo ufw allow 8080  # Linux
```

### Android: WebSocket error
1. Verify server IP is correct
2. Both devices on same WiFi network
3. Server is running and accessible

Test from Android device browser: `http://YOUR_SERVER_IP:8080/`

### Slow streaming
Edit `HelloArActivity.kt`:
```kotlin
val streamConfig = StreamConfig(
    targetFps = 15,           // Lower FPS
    rgbJpegQuality = 60,      // Lower quality
    enableAdaptiveQuality = true
)
```

## Next Steps

- **View tracked objects:** `curl http://localhost:8080/tracks/YOUR_CLIENT_ID`
- **Adjust YOLO model:** Edit `server/config.yaml` → `segmentation_model: "yolov8m-seg.pt"`
- **Enable visualization:** Edit `config.yaml` → `visualization.enabled: true`
- **Export data:** `curl http://localhost:8080/export/YOUR_CLIENT_ID`

## Common Configuration Changes

### Reduce bandwidth usage:
```kotlin
// In HelloArActivity.kt
StreamConfig(
    targetFps = 10,
    rgbJpegQuality = 50,
    sendDepthFrames = false
)
```

### Better accuracy (slower):
```yaml
# In server/config.yaml
processing:
  segmentation_model: "yolov8m-seg.pt"  # or yolov8l-seg.pt
  confidence_threshold: 0.6
```

### Faster processing (less accurate):
```yaml
# In server/config.yaml
processing:
  segmentation_model: "yolov8n-seg.pt"  # Fastest
  confidence_threshold: 0.4
```

## Success Indicators

✅ **Server running:** `INFO: Server started on 0.0.0.0:8080`
✅ **Client connected:** `INFO: Client X.X.X.X:XXXXX connected`
✅ **Frames streaming:** Check server logs for frame counts
✅ **Object detection working:** Check database: `ls server/data/ar_inference.db`

## Need Help?

Check the full [README.md](README.md) for detailed documentation.
