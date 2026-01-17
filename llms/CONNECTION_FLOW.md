# WebSocket Connection Flow with Debugging

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANDROID APP                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HelloArActivity.onCreate()                                          │
│           │                                                          │
│           ├──> renderer.startStreaming(config)                       │
│           │                                                          │
│           │    HelloArRenderer.startStreaming()                      │
│           │           │                                              │
│           │           ├──> streamClient = ARStreamClient(url)        │
│           │           │                                              │
│           │           ├──> streamClient.setStatusCallback { status -> │
│           │           │         activity.runOnUiThread {            │
│           │           │             connectionStatusView              │
│           │           │                 .updateStatus(status)        │
│           │           │         }                                    │
│           │           │     }                                        │
│           │           │                                              │
│           │           └──> streamClient.connect()                    │
│           │                        │                                 │
│           │                        │ OkHttp WebSocket Client         │
│           │                        │                                 │
│           ▼                        ▼                                 │
│  ┌─────────────────────────────────────────────┐                    │
│  │  ConnectionStatusView (at bottom)            │                    │
│  │  ┌──────┐                                    │                    │
│  │  │ 🔴  │ ✗ Connection Failed                │                    │
│  │  └──────┘ Cannot reach server • Attempt #3  │                    │
│  │            16:30:45                          │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                      │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
                         │ ws://192.168.1.123:8080/ar-stream
                         │
                         │ WebSocket Connection Attempt
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PYTHON SERVER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FastAPI WebSocket Endpoint: /ar-stream                             │
│           │                                                          │
│           ├──> Log connection attempt                                │
│           │    ============================================           │
│           │    WebSocket connection from: 192.168.1.100:45678        │
│           │      Client host: 192.168.1.100                          │
│           │      Client port: 45678                                  │
│           │      Headers: {...}                                      │
│           │    ============================================           │
│           │                                                          │
│           ├──> Check protobuf initialized?                           │
│           │         │                                                │
│           │         ├─[NO]──> Close(1011, "Protobuf not init")       │
│           │         │                                                │
│           │         └─[YES]──> await websocket.accept()              │
│           │                         │                                │
│           │                         ├──> Log: ✓ ACCEPTED             │
│           │                         │                                │
│           │                         └──> Send welcome message        │
│           │                                   │                      │
│           ▼                                   │                      │
│  ┌────────────────────────────────────────────┘                      │
│  │                                                                   │
│  │  Register client in ClientManager + Database                     │
│  │                                                                   │
│  │  Start frame reception loop:                                     │
│  │    while True:                                                   │
│  │      ├──> Receive frame data                                     │
│  │      │                                                            │
│  │      ├──> Log first frame / every 100th                           │
│  │      │    → First frame from client (1234 bytes)                  │
│  │      │                                                            │
│  │      ├──> Parse protobuf                                          │
│  │      │    ├─[ERROR]──> Log error, continue                        │
│  │      │    └─[OK]────> Extract frame data                          │
│  │      │                                                            │
│  │      ├──> Add to buffer                                           │
│  │      │                                                            │
│  │      └──> Submit to processing pipeline                           │
│  │                                                                   │
│  └───────────────────────────────────────────────────────────────────┘
│                                                                      │
│  Diagnostic Endpoints:                                               │
│    GET /health         → {"status": "healthy"}                       │
│    GET /diagnostics    → {server_ip, websocket_url, ...}            │
│    GET /               → {active_connections, clients, ...}          │
│    GET /clients        → {clients: [...], count: N}                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


CONNECTION STATE FLOW
═════════════════════

                    ┌──────────────┐
                    │  CONNECTING  │ ← Initial state
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
          [SUCCESS]              [FAILURE]
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │  CONNECTED   │      │    FAILED    │
        │ (Auto-hide   │      │  (Persistent │
        │  after 3s)   │      │   display)   │
        └──────────────┘      └──────┬───────┘
                                     │
                              ┌──────┴────────┐
                              │               │
                         [RETRY]         [GIVE UP]
                              │               │
                              └───────────────┘


ERROR MESSAGE EXAMPLES
══════════════════════

🔴 Connection Failed
   Cannot reach server (Connection refused) • Attempt #1 • 16:30:45

🔴 Connection Failed
   Cannot resolve hostname: 192.168.1.xyz • Attempt #2 • 16:31:12

🔴 Connection Failed
   Connection timeout • Attempt #3 • 16:31:45

🟢 Connected to Server
   Streaming AR data • ws://192.168.1.123:8080/ar-stream


SERVER LOG EXAMPLES
═══════════════════

✓ Good Connection:
  ============================================================
  WebSocket connection attempt from: 192.168.1.100:45678
    Client host: 192.168.1.100
    Client port: 45678
    Headers: {'host': '192.168.1.123:8080', ...}
  ============================================================
  ✓ WebSocket connection ACCEPTED for client 192.168.1.100:45678
  Client 192.168.1.100:45678 registered in client manager and database
  → First frame received from 192.168.1.100:45678 (4562 bytes)

✗ Failed Connection:
  ============================================================
  WebSocket connection attempt from: 192.168.1.100:45679
    Client host: 192.168.1.100
    Client port: 45679
    Headers: {'host': '192.168.1.123:8080', ...}
  ============================================================
  ✗ Failed to accept WebSocket connection from 192.168.1.100:45679: [Error details]
```

## Key Components

### Android Side
1. **ARStreamClient** - WebSocket client with enhanced error tracking
2. **ConnectionStatus** - Data class holding connection state
3. **ConnectionStatusView** - UI component showing status
4. **Callback Mechanism** - Real-time UI updates

### Server Side
1. **Enhanced WebSocket Endpoint** - Detailed logging at every step
2. **Connection Tracking** - Client registration and frame counting
3. **Error Handling** - Comprehensive exception catching and logging
4. **Diagnostics API** - New endpoint for server configuration info

## Debug Information Flow

```
ARStreamClient.connect()
    ↓
OkHttp WebSocketListener callbacks
    ↓
ConnectionStatus object updated
    ↓
statusCallback invoked
    ↓
UI thread update
    ↓
ConnectionStatusView.updateStatus()
    ↓
Visual indicator updated
```

## Logging Hierarchy

```
Android (ARStreamClient)
├── Connection attempt (INFO)
├── Connection accepted (INFO) ✓
├── Connection failed (ERROR) ✗
├── Frame send success (DEBUG)
└── Frame send failed (WARN)

Server (main.py)
├── Connection attempt (INFO) with details
├── Connection accepted (INFO) ✓
├── Welcome message sent (INFO)
├── Client registered (INFO)
├── First frame received (INFO) →
├── Periodic frame log (DEBUG)
├── Protobuf parse error (ERROR)
└── Client disconnected (INFO)
```
