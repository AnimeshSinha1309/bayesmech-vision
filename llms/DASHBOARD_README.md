# AR Stream Dashboard

A beautiful, real-time web dashboard for monitoring AR data streams from connected Android devices.

## Features

### 🎨 Modern UI
- Dark theme with glassmorphism effects
- Smooth animations and transitions
- Responsive grid layout
- Real-time status indicators

### 📱 Client Management
- View all connected AR clients
- Click to select a client for detailed viewing
- See connection statistics (FPS, frame count, buffer status)
- Auto-refresh client list

### 📹 Live Video Streams
- **RGB Camera Feed**: Real-time camera view from the AR device
- **Depth Map**: Colorized depth visualization
- Automatic aspect ratio preservation
- Base64-encoded JPEG/PNG streaming

### 📊 Camera Data Visualization
- **Pose Matrix (4×4)**: Camera position and orientation in world space
- **View Matrix (4×4)**: Camera-to-world transformation
- **Projection Matrix (4×4)**: 3D-to-2D projection parameters
- **Intrinsic Matrix (3×3)**: Camera calibration parameters
- Formatted with precision for easy debugging

### 📈 Real-time Metrics
- Frame count
- Current FPS (averaged)
- Stream resolution
- ARCore tracking state (STOPPED/PAUSED/TRACKING)

## Usage

### 1. Start the Server

```bash
cd server
source .venv/bin/activate  # If using virtual environment
python main.py
```

The dashboard will be available at: `http://localhost:8080/`

### 2. Connect Android Devices

Your Android app should connect to the server as usual:
```kotlin
val streamConfig = StreamConfig(
    serverUrl = "ws://YOUR_SERVER_IP:8080/ar-stream",
    // ... other config
)
```

### 3. View the Dashboard

1. Open `http://YOUR_SERVER_IP:8080/` in any modern web browser
2. Connected clients will appear as cards
3. Click on a client card to view its live stream
4. RGB, depth, and camera data will update in real-time

## Technical Details

### Architecture

```
Android Device  →  AR Stream WS (/ar-stream)  →  Server (main.py)
                                                      ↓
                                                 Broadcast
                                                      ↓
                                            Dashboard WS (/ws/dashboard)
                                                      ↓
Web Browser  ←  Live Updates (RGB, Depth, Matrices)
```

### WebSocket Endpoints

- **`/ar-stream`**: Android devices connect here to stream AR data
- **`/ws/dashboard`**: Dashboard connects here for real-time updates

### HTTP Endpoints

- **`GET /`**: Serves the dashboard HTML
- **`GET /api/clients`**: Returns list of connected clients with stats
- **`GET /api/status`**: Server status and metrics
- **`GET /health`**: Health check
- **`GET /diagnostics`**: Diagnostic information

### Data Flow

1. Android device sends AR frame (protobuf binary) → `/ar-stream`
2. Server deserializes and extracts:
   - RGB image (JPEG decoded to numpy array)
   - Depth map (uint16 array)
   - Camera matrices (4x4 and 3x3 numpy arrays)
   - Metadata (timestamp, frame number, tracking state)

3. Server encodes for dashboard:
   - RGB → JPEG → Base64 string
   - Depth → Colorized PNG → Base64 string
   - Matrices → Flattened float arrays (JSON)

4. Dashboard receives JSON via WebSocket:
   ```json
   {
     "type": "frame_update",
     "client_id": "192.168.1.100:54321",
     "rgb_frame": "base64_encoded_jpeg...",
     "depth_frame": "base64_encoded_png...",
     "camera": {
       "pose_matrix": [16 floats],
       "view_matrix": [16 floats],
       " projection_matrix": [16 floats],
       "intrinsic_matrix": [9 floats]
     },
     "resolution": {"width": 1280, "height": 720},
     "tracking_state": 2,
     "fps": 28.5
   }
   ```

5. Dashboard updates UI in real-time

### Performance

- **Frame encoding**: JPEG compression for RGB, PNG for depth
- **Non-blocking**: Dashboard broadcast runs as async task
- **Efficient**: Only encodes when dashboards are connected
- **Caching**: Latest frame cached per client for instant display

### Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- WebSocket support
- ES6 JavaScript
- CSS Grid and Flexbox

## Customization

### Changing Update Rate

In `dashboard.html`, line ~470:
```javascript
setInterval(refreshClients, 5000); // Refresh every 5 seconds
```

### Styling

All styles are in `<style>` tag in `dashboard.html`. CSS variables at the top:
```css
:root {
    --bg-dark: #0a0e27;
    --bg-card: #151933;
    --accent: #00d4ff;
    /* ... more variables */
}
```

### Matrix Display Format

In `dashboard.html`, `formatMatrix()` function (line ~525):
```javascript
const val = arr[i * cols + j];
result += val.toFixed(4).padStart(10, ' ') + ' ';  // 4 decimal places
```

## Troubleshooting

### Dashboard shows "No AR Clients Connected"
- Check if Android device is connected to server
- Verify WebSocket connection in browser console (F12)
- Check server logs for connection attempts

### Video not updating
- Verify RGB/depth frames are being sent from Android
- Check browser console for errors
- Ensure WebSocket connection is established

### Matrix displays "Invalid matrix"
- Check if camera data is being sent
- Verify array lengths (9 for 3x3, 16 for 4x4)
- Check server logs for parsing errors

### Poor FPS
- Reduce image quality in Android StreamConfig
- Check network bandwidth
- Monitor server CPU usage

## Development

### Adding New Data Fields

1. **Server** (`main.py`, `broadcast_frame_to_dashboards()`):
   ```python
   dashboard_msg['new_field'] = frame_data.get('new_field')
   ```

2. **Dashboard** (`dashboard.html`, `updateFrameDisplay()`):
   ```javascript
   if (data.new_field) {
       document.getElementById('new-field-display').textContent = data.new_field;
   }
   ```

3. **HTML** (add display element):
   ```html
   <div id="new-field-display"></div>
   ```

## Screenshots

### Dashboard Overview
- Grid of connected clients
- Live RGB and depth streams side-by-side
- Camera matrices displayed below
- Real-time metrics

### Empty State
- Clean message when no clients connected
- Instructions for connecting devices

---

**Note**: This dashboard is designed for local network use during development. For production deployment, add authentication and use HTTPS/WSS.
