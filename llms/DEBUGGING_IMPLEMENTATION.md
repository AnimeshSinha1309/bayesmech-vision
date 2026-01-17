# WebSocket Connection Debugging - Implementation Summary

## Overview
Added comprehensive debugging capabilities to help diagnose WebSocket connection issues between the Android AR app and the Python server.

## Changes Made

### 1. Android Client Side

#### A. Enhanced ARStreamClient (`ARStreamClient.kt`)
- **ConnectionStatus Data Class**: Created a new data class to track detailed connection state
  - Connection status (connected/disconnected)
  - Last error message
  - Error timestamp
  - Connection attempts counter
  - Server URL
  - Response codes
  - Network error types

- **Improved Connection Handling**:
  - Better timeout configuration (10s connect, 30s read/write)
  - Ping/pong keepalive every 20 seconds
  - Detailed error categorization:
    - Connection refused
    - Unknown host
    - Timeout
    - SSL/TLS errors
  - Enhanced logging with visual indicators (✓, ✗, ⚠)

- **Status Callback Mechanism**:
  - `setStatusCallback()` method to notify UI of connection changes
  - Real-time updates whenever connection state changes

#### B. Connection Status View (`ConnectionStatusView.kt`)
- **New Custom View**: Created a CardView-based status indicator
  - Positioned at bottom of screen
  - Semi-transparent dark background
  - Colored status indicator (green/red/yellow)
  - Two-line text display:
    - Main status line
    - Detailed error information

- **Behavior**:
  - Shows persistently when connection fails
  - Auto-hides after 3 seconds when successfully connected
  - Displays error messages, timestamps, and connection attempts
  - Updates in real-time via callback

#### C. UI Integration
- **Updated Layout** (`activity_main.xml`):
  - Added ConnectionStatusView at bottom with margins

- **Updated HelloArView** (`HelloArView.kt`):
  - Added reference to connectionStatusView

- **Updated HelloArRenderer** (`HelloArRenderer.kt`):
  - Wired up status callback in `startStreaming()`
  - Pushes status updates to UI thread

### 2. Server Side

#### A. Enhanced WebSocket Endpoint (`main.py`)
- **Connection Logging**:
  - Logs connection attempts with visual separators
  - Shows client details (host, port, headers)
  - Confirms connection acceptance
  - Sends welcome message to client
  
- **Frame Reception Tracking**:
  - Logs first frame received from each client
  - Periodic logging every 100 frames
  - Frame size tracking

- **Error Handling**:
  - Try-catch around protobuf parsing
  - Detailed exception logging with stack traces
  - Error type and details logged separately
  - Proper cleanup in finally block

#### B. New Diagnostics Endpoint
- **`GET /diagnostics`**: Returns server configuration info
  - Server hostname and local IP
  - Listening host and port
  - WebSocket endpoint URL
  - Protobuf initialization status
  - Active connection count
  - Processing queue size
  - Configuration instructions for Android client

## How to Use

### Testing the Connection

1. **Check Server Status**:
   ```bash
   # From your development machine
   curl http://localhost:8080/diagnostics
   ```
   This will show:
   - The correct WebSocket URL to use
   - Server IP address
   - Current connection count

2. **Update Android Configuration**:
   In `HelloArActivity.kt`, update the server URL:
   ```kotlin
   val streamConfig = StreamConfig(
       serverUrl = "ws://<SERVER_IP>:8080/ar-stream",  // Use IP from diagnostics
       // ... other config
   )
   ```

3. **Run the App**:
   - The connection status will appear at the bottom of the AR view
   - If connection fails, you'll see:
     - Error message (e.g., "Cannot reach server")
     - Connection attempt number
     - Timestamp
   - If connection succeeds, you'll see:
     - "✓ Connected to Server" message
     - The view will auto-hide after 3 seconds

4. **Check Server Logs**:
   The server will log:
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

### Common Issues and Solutions

1. **"Cannot reach server (Connection refused)"**
   - Server may not be running
   - Check firewall settings
   - Verify IP address is correct
   - Ensure devices are on same network

2. **"Cannot resolve hostname"**
   - DNS issue
   - Use IP address instead of hostname
   - Check `/diagnostics` endpoint for correct IP

3. **"Connection timeout"**
   - Network latency too high
   - Server may be overloaded
   - Check network connectivity

4. **Connection accepted but no frames**
   - Check if AR data capture is working
   - Verify protobuf serialization
   - Check server logs for parsing errors

### Monitoring

- **Android Logcat**: Filter for "ARStreamClient" tag
  ```bash
  adb logcat | grep ARStreamClient
  ```

- **Server Logs**: Already configured to show connection details

- **Connection Stats**: Available via `ARStreamClient.getStats()`
  - Frames sent/dropped
  - Bytes sent
  - Connection attempts
  - Last error

## Benefits

1. **Immediate Visual Feedback**: Users see connection status without checking logs
2. **Detailed Error Info**: Specific error messages help diagnose issues quickly
3. **Persistent Display**: Failed connections stay visible until resolved
4. **Server-Side Visibility**: Comprehensive logging helps debug from server end
5. **Diagnostic Tools**: `/diagnostics` endpoint provides configuration info
6. **Non-Intrusive**: Auto-hides when working correctly

## Files Modified

### Android
- `ARStreamClient.kt` - Enhanced with connection tracking
- `ConnectionStatusView.kt` - New custom view (created)
- `activity_main.xml` - Added status view to layout
- `HelloArView.kt` - Added reference to status view
- `HelloArRenderer.kt` - Wired up status callback

### Server
- `main.py` - Enhanced logging and added diagnostics endpoint

## Next Steps

To extend this debugging capability:
1. Add retry logic with exponential backoff
2. Add a "Reconnect" button in the status view
3. Log connection stats to a file for later analysis
4. Add network quality indicators (latency, bandwidth)
5. Create a settings screen to change server URL at runtime
