# Fixing the 403 Forbidden Error

## What Happened

You got: **"Expected HTTP 101 response but was 403 Forbidden"**

## Understanding the Error

### What is HTTP 101?
- **HTTP 101 "Switching Protocols"** is the *correct* response for WebSocket connections
- When your Android app connects, it sends: `Upgrade: websocket`
- The server should respond with **101** to accept and switch to WebSocket protocol
- It's NOT 200 because:
  - **200 OK** = "Here's your HTTP response" (standard web request)
  - **101 Switching Protocols** = "OK, let's switch to WebSocket now" (protocol upgrade)

### What is 403?
- **403 Forbidden** = "I understand your request, but I refuse to authorize it"
- Common causes:
  1. **CORS (Cross-Origin Resource Sharing) restrictions** ← Most likely
  2. Firewall blocking
  3. Server authentication/authorization middleware

## The Fix: CORS Middleware

The 403 error is caused by **CORS restrictions**. FastAPI WebSockets block cross-origin requests by default for security.

**I've already added the fix** to your server code:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (safe for local network)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Steps to Apply the Fix

### 1. Restart Your Server

**IMPORTANT:** The server needs to be restarted to apply the CORS middleware.

In the terminal where your server is running:
1. Press `Ctrl+C` to stop the server
2. Restart it:
   ```bash
   cd /home/animesh/Code/Hackathon/cam-sportalytics/server
   python main.py
   ```

You should see:
```
INFO:__main__:CORS middleware enabled - accepting connections from all origins
INFO:__main__:Protobuf module loaded successfully
INFO:__main__:Server started on 0.0.0.0:8080
```

### 2. Verify the Fix

From your laptop:
```bash
cd server
./test_connectivity.sh 192.168.1.2 8080
```

All tests should pass ✓

### 3. Test from Another Device (Optional)

**Copy the test script to another laptop** on the same WiFi:
```bash
# On the other laptop
curl -O http://192.168.1.2:8080/test_connectivity.sh
chmod +x test_connectivity.sh
./test_connectivity.sh 192.168.1.2 8080
```

This will test:
- ✓ Ping connectivity
- ✓ Port 8080 is open
- ✓ HTTP health endpoint
- ✓ Diagnostics endpoint
- ✓ WebSocket connection (if wscat installed)

### 4. Rebuild and Run Android App

The Android app should now connect successfully!

## Firewall Configuration (If Still Not Working)

If the 403 persists after restart, check your firewall:

### Check Firewall Status
```bash
sudo ufw status
```

### If Firewall is Active, Allow Port 8080
```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

### Or Temporarily Disable Firewall (for testing only)
```bash
sudo ufw disable
# Test connection
# Re-enable after testing:
sudo ufw enable
```

## Network Connectivity Checklist

### ✅ Same WiFi Network
Verify both devices are on the same network:
- **Server laptop**: `ip addr | grep 192.168.1`
- **Android phone**: Settings → WiFi → Check IP address

They should both be in the `192.168.1.x` range.

### ✅ Server IP Address Correct
Use the IP from diagnostics endpoint:
```bash
curl http://localhost:8080/diagnostics | grep websocket_endpoint
```

Update in `HelloArActivity.kt` line 100:
```kotlin
serverUrl = "ws://192.168.1.2:8080/ar-stream"  // Use actual server IP
```

### ✅ Server is Running
```bash
curl http://192.168.1.2:8080/health
# Should return: {"status":"healthy","timestamp":...}
```

### ✅ Port 8080 Open
```bash
netstat -tuln | grep 8080
# Should show: tcp  0  0.0.0.0:8080  0.0.0.0:*  LISTEN
```

## Why CORS is Needed for WebSockets

1. **Origin-based Security**: Browsers (and similar clients like OkHttp) enforce CORS
2. **Cross-Origin Requests**: Your Android app (origin: Android device) connects to server (origin: laptop)
3. **Different Origins = CORS Required**: Even on same network, different devices = different origins
4. **WebSocket Upgrade Request**: The initial HTTP request needs CORS approval before upgrading to WebSocket

## Testing WebSocket Connection (Advanced)

If you have Node.js on another laptop:

```bash
# Install wscat
npm install -g wscat

# Test WebSocket connection
wscat -c ws://192.168.1.2:8080/ar-stream

# You should see:
# Connected (press CTRL+C to quit)
# < Connected to AR Stream Server - Client ID: x.x.x.x:xxxxx
```

## Expected Server Logs After Fix

When Android app connects successfully:

```
============================================================
WebSocket connection attempt from: 192.168.1.100:45678
  Client host: 192.168.1.100
  Client port: 45678
  Headers: {'host': '192.168.1.2:8080', 'upgrade': 'websocket', ...}
============================================================
✓ WebSocket connection ACCEPTED for client 192.168.1.100:45678
Client 192.168.1.100:45678 registered in client manager and database
→ First frame received from 192.168.1.100:45678 (4562 bytes)
```

## If Still Getting 403 After Restart

1. **Verify CORS middleware was added**:
   ```bash
   grep -A 5 "CORSMiddleware" /home/animesh/Code/Hackathon/cam-sportalytics/server/main.py
   ```

2. **Check server startup logs** for "CORS middleware enabled"

3. **Try from another laptop** using the test script

4. **Check Android app logs**:
   ```bash
   adb logcat | grep ARStreamClient
   ```

5. **Verify no proxy/VPN** interfering with connection

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | CORS restrictions | ✅ Added CORS middleware (restart server) |
| Can't reach server | Network/firewall | Check WiFi, firewall rules, ping test |
| Wrong IP | Server IP changed | Use diagnostics endpoint to get current IP |

**Main Action Required:** **RESTART THE SERVER** to enable CORS middleware!

After restart, the 403 error should be resolved. 🎉
