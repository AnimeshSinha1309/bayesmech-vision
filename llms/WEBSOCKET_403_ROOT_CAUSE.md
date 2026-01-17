# WebSocket 403 Debugging - Root Cause Analysis

## Current Status

You're getting **403 Forbidden** on WebSocket connections even after adding CORS middleware.

## Root Causes Identified

### 1. **CORS Middleware Limitation** ❌
**Problem:** FastAPI's `CORSMiddleware` does NOT apply to WebSocket upgrade requests
- CORS middleware only handles HTTP requests
- WebSocket upgrade happens at a lower level
- The middleware never sees the upgrade request

### 2. **Protobuf Not Initialized** ❌
**Problem:** The server was checking `if ar_stream_pb2 is None` BEFORE accepting the connection
- This causes the WebSocket to be rejected with code 403
- Protobuf file is in `proto/proto/ar_stream_pb2.py` but import was looking in `proto/`

### 3. **Connection Rejection Sequence** ❌
**Wrong Order:**
```python
# OLD CODE (causes 403):
if ar_stream_pb2 is None:
    await websocket.close(...)  # ← Rejects BEFORE accepting
    return

await websocket.accept()  # ← Never reached!
```

**Correct Order:**
```python
# NEW CODE (works):
await websocket.accept()  # ← Accept FIRST

if ar_stream_pb2 is None:  # ← Then check and close gracefully
    await websocket.send_text("ERROR: ...")
    await websocket.close(...)
```

## Fixes Applied

### ✅ Fix 1: Accept WebSocket First
Changed the order to **accept the connection BEFORE any validation checks**.

This prevents 403 errors because:
- Connection is upgraded to WebSocket protocol (101 response sent)
- THEN we can send error messages and close gracefully
- Client gets proper feedback instead of HTTP 403

### ✅ Fix 2: Fixed Protobuf Import Path
Updated import to check both possible locations:
```python
proto_path = Path(__file__).parent / 'proto' / 'proto'
if not proto_path.exists():
    proto_path = Path(__file__).parent / 'proto'
```

### ✅ Fix 3: Better Error Messages
- Client now receives: "ERROR: Protobuf not initialized on server"
- Server logs show detailed import errors
- Clear indication of what went wrong

## Why CORS Middleware Isn't Enough

```
HTTP Request Flow:
┌─────────────────────┐
│  HTTP GET /health   │ ← CORS middleware WORKS here
│  200 OK             │
└─────────────────────┘

WebSocket Upgrade Flow:
┌─────────────────────────┐
│  GET /ar-stream         │
│  Upgrade: websocket     │ ← CORS middleware does NOT apply!
│  Connection: Upgrade    │
├─────────────────────────┤
│  [Internal upgrade]     │ ← Happens at TCP/protocol level
│  101 or 403             │ ← Decided by accept() call
└─────────────────────────┘
```

**Key Point:** WebSocket upgrade bypasses CORS middleware entirely!

## Solution: Always Accept First

**The Rule for WebSocket Endpoints:**
1. **Always** call `await websocket.accept()` first
2. **Then** validate requirements (auth, protobuf, etc.)
3. **Then** send error message and close if invalid

This ensures:
- ✓ Client gets 101 Switching Protocols (not 403)
- ✓ Connection is established properly
- ✓ Error messages can be sent over WebSocket
- ✓ Graceful closure with reason codes

## Testing the Fixes

### Before Restart:
```bash
$ wscat -c ws://192.168.1.2:8080/ar-stream
error: Unexpected server response: 403  # ← OLD BEHAVIOR
```

### After Restart:
```bash
$ wscat -c ws://192.168.1.2:8080/ar-stream
Connected  # ← NEW BEHAVIOR
< ERROR: Protobuf not initialized on server. Run generate_proto.sh
Disconnected (code: 1011, reason: "Protobuf not initialized")
```

If protobuf IS initialized:
```bash
$ wscat -c ws://192.168.1.2:8080/ar-stream
Connected
< Connected to AR Stream Server - Client ID: 192.168.1.2:12345
```

## Next Steps

### 1. Restart the Server

**REQUIRED:** The server must be restarted for fixes to take effect.

In a NEW terminal (to see logs):
```bash
cd /home/animesh/Code/Hackathon/cam-sportalytics/server
./restart_server.sh
```

Or manually:
```bash
# In the terminal where server is running:
Ctrl+C  # Stop
python main.py  # Start
```

### 2. Verify Protobuf Loaded

Look for this in server startup:
```
✓ Protobuf module loaded successfully from /path/to/proto/proto
INFO:__main__:CORS middleware enabled - accepting connections from all origins
INFO:__main__:Server started on 0.0.0.0:8080
```

### 3. Test WebSocket Connection

```bash
cd server
wscat -c ws://192.168.1.2:8080/ar-stream
```

**Expected:**
- ✓ "Connected" message
- ✓ Welcome message from server
- OR error message if protobuf missing (but connection succeeds)

### 4. Test from Android

The Android app should now connect successfully!

## Server Logs to Watch For

### Successful Connection:
```
============================================================
WebSocket connection attempt from: 192.168.1.100:45678
  Client host: 192.168.1.100
  Client port: 45678
  Headers: {...}
============================================================
✓ WebSocket connection ACCEPTED for client 192.168.1.100:45678
Client 192.168.1.100:45678 registered in client manager and database
→ First frame received from 192.168.1.100:45678 (4562 bytes)
```

### If Protobuf Missing (graceful close):
```
============================================================
WebSocket connection attempt from: 192.168.1.2:54321
============================================================
✓ WebSocket connection ACCEPTED for client 192.168.1.2:54321
✗ Protobuf not initialized - closing connection for 192.168.1.2:54321
```

## Understanding the Connection Sequence

```
Android App                 Server
     │                         │
     │  WS Upgrade Request     │
     ├────────────────────────>│
     │                         │ [NEW: Always accept first]
     │  101 Switching          │ await websocket.accept()
     │<────────────────────────┤
     │                         │
     ║  WebSocket Connected    ║
     ╞═════════════════════════╡
     │                         │
     │                         │ Check protobuf
     │                         ├─[OK]──> Continue
     │                         │
     │                         ├─[FAIL]> Send error
     │  < Error message        │         Close gracefully
     │<────────────────────────┤
     │                         │
     │  Connection Close       │
     │<────────────────────────┤
     │                         │
```

## Common Mistakes

### ❌ Wrong: Check before accept
```python
if not_ready:
    await websocket.close()  # Returns 403!
    return
await websocket.accept()  # Never reached
```

### ✅ Right: Accept first, then validate
```python
await websocket.accept()  # Always do this first!

if not_ready:
    await websocket.send_text("ERROR: ...")
    await websocket.close()  # Graceful close
    return
```

## Files Modified

1. **`server/main.py`**:
   - Fixed WebSocket accept order
   - Fixed protobuf import path
   - Added better error messages

2. **`server/restart_server.sh`** (new):
   - Helper script to restart server cleanly

## Checklist

- ☐ Server restarted with new code
- ☐ See "Protobuf module loaded successfully" in logs
- ☐ See "CORS middleware enabled" in logs
- ☐ `wscat` test shows "Connected"
- ☐ Android app connects without 403 error

## If Still Getting 403

1. **Verify server restart**: Check process ID changed
   ```bash
   ps aux | grep "python main.py"
   ```

2. **Check server logs**: Look for startup messages

3. **Test with curl** (should still work):
   ```bash
   curl http://192.168.1.2:8080/health
   ```

4. **Test WebSocket with wscat**:
   ```bash
   wscat -c ws://192.168.1.2:8080/ar-stream
   ```

## Summary

The 403 error was caused by:
1. ❌ Trying to close WebSocket before accepting it
2. ❌ Wrong protobuf import path
3. ✓ CORS middleware (helpfulbut not the main issue for WebSockets)

**Fix:** Always accept WebSocket connections first, then validate!

**Action:** Restart the server and test again! 🚀
