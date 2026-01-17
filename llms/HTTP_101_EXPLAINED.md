# HTTP 101 vs HTTP 403 - Visual Explanation

## Normal HTTP Request/Response (200 OK)

```
Client (Android)                Server (Python)
      │                              │
      │  GET /health HTTP/1.1         │
      │ ────────────────────────────> │
      │                              │
      │  HTTP/1.1 200 OK             │
      │ <──────────────────────────── │
      │  {"status": "healthy"}        │
      │                              │
      └──────────────────────────────┘
           Connection closes
```

**200 OK** = Standard HTTP response, connection ends after response.

---

## WebSocket Upgrade (101 Switching Protocols) ✅ CORRECT

```
Client (Android)                Server (Python)
      │                              │
      │  GET /ar-stream HTTP/1.1      │
      │  Upgrade: websocket           │
      │  Connection: Upgrade          │
      │ ────────────────────────────> │
      │                              │
      │  HTTP/1.1 101 Switching      │
      │  Protocols                    │
      │ <──────────────────────────── │
      │                              │
      ╞══════════════════════════════╡
      ║  WebSocket Connection Open   ║
      ╞══════════════════════════════╡
      │                              │
      │  Binary Frame (AR data)      │
      │ ══════════════════════════>  │
      │                              │
      │  Text Message (status)       │
      │ <════════════════════════════ │
      │                              │
      │  Binary Frame (AR data)      │
      │ ══════════════════════════>  │
      │                              │
      ║  Connection stays open!      ║
      ╞══════════════════════════════╡
```

**101 Switching Protocols** = "OK, let's switch to WebSocket!"
- Connection stays open
- Bidirectional communication
- Can send frames continuously

---

## What You're Getting Now (403 Forbidden) ✗ ERROR

```
Client (Android)                Server (Python)
      │                              │
      │  GET /ar-stream HTTP/1.1      │
      │  Upgrade: websocket           │
      │  Origin: Android device       │
      │ ────────────────────────────> │
      │                              │
      │                              │ ⚠ CORS check fails!
      │                              │ ⚠ Origin not allowed!
      │                              │
      │  HTTP/1.1 403 Forbidden      │
      │ <──────────────────────────── │
      │                              │
      └──────────────────────────────┘
           Connection rejected!
```

**403 Forbidden** = "I refuse to allow this connection"
- CORS (Cross-Origin Resource Sharing) blocked it
- Connection never upgrades to WebSocket
- No data transmission possible

---

## After Adding CORS Middleware ✅ FIXED

```
Client (Android)                Server (Python)
      │                              │
      │  GET /ar-stream HTTP/1.1      │
      │  Upgrade: websocket           │
      │  Origin: Android device       │
      │ ────────────────────────────> │
      │                              │
      │                              │ ✓ CORS middleware
      │                              │ ✓ Origin allowed!
      │                              │
      │  HTTP/1.1 101 Switching      │
      │  Protocols                    │
      │ <──────────────────────────── │
      │                              │
      ╞══════════════════════════════╡
      ║  WebSocket Connection Open   ║
      ║  ✓ CORS headers included     ║
      ╞══════════════════════════════╡
      │                              │
      │  AR Frame Data →→→→→→→→→→   │
      │  AR Frame Data →→→→→→→→→→   │
      │  AR Frame Data →→→→→→→→→→   │
      │                              │
```

---

## HTTP Status Code Meanings

| Code | Name | Usage | Connection |
|------|------|-------|-----------|
| **200** | OK | Normal HTTP responses | Closes after response |
| **101** | Switching Protocols | WebSocket upgrade success | **Stays open** |
| **403** | Forbidden | Authorization denied | Closes immediately |
| **404** | Not Found | Endpoint doesn't exist | Closes immediately |
| **500** | Internal Server Error | Server crashed | Closes immediately |

---

## Why Not 200 for WebSocket?

```
❌ Can't use 200 OK for WebSocket because:

1. 200 means "here's your HTTP response, we're done"
2. WebSocket needs connection to STAY OPEN
3. 101 means "OK, switching protocols now, keep connection alive"

It's like:
  200 = "Here's your pizza, goodbye" 🍕 [door closes]
  101 = "Come in, let's chat over pizza" 🍕 [door stays open]
```

---

## The CORS Problem Explained

```
┌─────────────────────────────────────────────────────┐
│  WHY CORS?                                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Origin 1: Android device (192.168.1.100)           │
│     ↓                                                │
│     └──> Tries to connect to...                     │
│                                                      │
│  Origin 2: Laptop server (192.168.1.2)              │
│                                                      │
│  Different origins = Cross-Origin Request           │
│  Security: Block by default (prevent attacks)       │
│  Solution: CORS middleware says "it's okay"         │
│                                                      │
└─────────────────────────────────────────────────────┘

WITHOUT CORS Middleware:
  Server: "Different origin? DENIED! 403 Forbidden"

WITH CORS Middleware:
  Server: "CORS allows all origins. WELCOME! 101 Switching Protocols"
```

---

## Quick Fix Summary

1. **Problem**: 403 Forbidden (CORS blocking WebSocket)
2. **Solution**: Added CORS middleware to server
3. **Action Required**: RESTART SERVER
4. **Expected Result**: 101 Switching Protocols ✓

```bash
# In server terminal:
Ctrl+C  # Stop server
python main.py  # Start server

# You should see:
INFO:__main__:CORS middleware enabled - accepting connections from all origins
```

Then your Android app will connect successfully! 🎉
