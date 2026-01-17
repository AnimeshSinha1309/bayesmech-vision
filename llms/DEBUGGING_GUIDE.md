# WebSocket Connection Debugging Guide

## Quick Start

### 1. Server Setup
Your server is already running. To test the new diagnostics features after restarting:

```bash
cd server
./test_server.sh
```

This will show you:
- Server health status
- **Diagnostics info** (includes the exact WebSocket URL to use)
- Current connection status

### 2. Find Your Server IP

After restarting the server, run:
```bash
curl http://localhost:8080/diagnostics
```

Look for the `websocket_endpoint` field. It will show something like:
```json
{
  "websocket_endpoint": "ws://192.168.1.123:8080/ar-stream"
}
```

### 3. Update Android App

In `android/app/src/main/java/com/google/ar/core/examples/kotlin/helloar/HelloArActivity.kt`:

```kotlin
val streamConfig = StreamConfig(
    serverUrl = "ws://192.168.1.123:8080/ar-stream",  // ← Use IP from diagnostics
    targetFps = 20,
    sendRgbFrames = true,
    sendDepthFrames = false,
    rgbJpegQuality = 80,
    enableAdaptiveQuality = true
)
```

### 4. Build and Run Android App

The app will now show a connection status indicator at the bottom of the screen.

## What You'll See

### On Successful Connection
- **Android App**: A toast-like message at the bottom saying "✓ Connected to Server"
  - Auto-hides after 3 seconds
  - Shows the server URL

- **Server Logs**:
  ```
  ============================================================
  WebSocket connection attempt from: 192.168.1.100:45678
    Client host: 192.168.1.100
    Client port: 45678
    Headers: {...}
  ============================================================
  ✓ WebSocket connection ACCEPTED for client 192.168.1.100:45678
  Client 192.168.1.100:45678 registered in client manager and database
  → First frame received from 192.168.1.100:45678 (1234 bytes)
  ```

### On Connection Failure
- **Android App**: Persistent message at bottom showing:
  - "✗ Connection Failed"
  - Specific error (e.g., "Cannot reach server (Connection refused)")
  - How many connection attempts
  - Timestamp of last failure

- **Android Logcat** (filter for `ARStreamClient`):
  ```
  ARStreamClient: Attempting to connect to ws://192.168.1.123:8080/ar-stream (attempt #1)
  ARStreamClient: ✗ WebSocket connection failed: Cannot reach server (Connection refused)
  ARStreamClient:   Server URL: ws://192.168.1.123:8080/ar-stream
  ARStreamClient:   Response: null
  ```

## Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Cannot reach server (Connection refused)" | Server not running or wrong IP | Check server is running; verify IP address |
| "Cannot resolve hostname" | DNS/network issue | Use IP address instead of hostname |
| "Connection timeout" | Network latency/firewall | Check network connectivity; verify firewall rules |
| "Connection closing" | Server rejected connection | Check server logs for reason |

## Troubleshooting Steps

### 1. Verify Server is Running
```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy","timestamp":...}
```

### 2. Check Server IP
```bash
curl http://localhost:8080/diagnostics
# Note the "local_ip" and "websocket_endpoint" fields
```

### 3. Test Server from Another Device
From your Android device's network:
```bash
# Replace <SERVER_IP> with IP from diagnostics
curl http://<SERVER_IP>:8080/health
```

If this fails, check:
- Both devices on same network?
- Firewall blocking port 8080?
- Server listening on 0.0.0.0 (not 127.0.0.1)?

### 4. Monitor Android Logs
```bash
adb logcat | grep -E "ARStreamClient|ConnectionStatus"
```

### 5. Monitor Server Logs
The server automatically logs all connection attempts and errors with detailed information.

## Connection Status Indicators

The Android app shows a status card at the bottom with:

### Color Indicators
- 🟢 **Green**: Successfully connected
- 🔴 **Red**: Connection failed
- 🟡 **Yellow**: Connecting...

### Status Messages
- **While Connecting**: "Connecting to Server..." + URL
- **On Success**: "✓ Connected to Server" + streaming status
- **On Failure**: "✗ Connection Failed" + specific error + timestamp + attempt count

## API Endpoints for Debugging

### GET /health
Basic health check
```bash
curl http://localhost:8080/health
```

### GET /diagnostics
**NEW!** Comprehensive server diagnostics
```bash
curl http://localhost:8080/diagnostics
```

Returns:
- Server hostname and local IP
- WebSocket endpoint URL
- Protobuf initialization status
- Active connection count
- Processing queue size
- Configuration instructions

### GET /
Server status with client information
```bash
curl http://localhost:8080/
```

### GET /clients
List of connected clients
```bash
curl http://localhost:8080/clients
```

## Advanced Debugging

### Enable Verbose Logging on Android
In `ARStreamClient.kt`, all connection attempts and failures are already logged with detailed information.

To see all logs:
```bash
adb logcat -s ARStreamClient:V
```

### Server-Side Debugging
The server logs:
- Every connection attempt with full headers
- Connection acceptance/rejection
- First frame from each client
- Every 100th frame (to avoid log spam)
- All errors with full stack traces

### Network Debugging
Use `tcpdump` or Wireshark to inspect WebSocket traffic:
```bash
sudo tcpdump -i any -A 'tcp port 8080'
```

## Restart Server with New Features

To use the new `/diagnostics` endpoint:

1. Stop the current server (Ctrl+C in the terminal where it's running)
2. Restart it:
   ```bash
   cd server
   python main.py
   ```
3. Test the new endpoint:
   ```bash
   ./test_server.sh
   ```

## Files Modified

### Android
- `ARStreamClient.kt` - Enhanced connection tracking and error reporting
- `ConnectionStatusView.kt` - **NEW** - Custom UI for status display
- `activity_main.xml` - Added status view to layout
- `HelloArView.kt` - Wired up status view
- `HelloArRenderer.kt` - Connected status callback

### Server
- `main.py` - Enhanced logging + new `/diagnostics` endpoint

## What's Next?

After confirming the connection works:
1. The status view will auto-hide when connected
2. Monitor server logs to see frame reception
3. If issues persist, the persistent error display will help diagnose

For detailed implementation notes, see `DEBUGGING_IMPLEMENTATION.md`.
