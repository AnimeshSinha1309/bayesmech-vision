#!/bin/bash
# Network Connectivity Test Script
# Run this from another device on the same WiFi to test connectivity

SERVER_IP="${1:-192.168.1.2}"
SERVER_PORT="${2:-8080}"

echo "==========================================="
echo "AR Stream Server Connectivity Test"
echo "==========================================="
echo ""
echo "Testing connectivity to: $SERVER_IP:$SERVER_PORT"
echo ""

# Test 1: Ping test
echo "1. PING TEST"
echo "   Testing if device is reachable..."
if ping -c 3 -W 2 "$SERVER_IP" > /dev/null 2>&1; then
    echo "   ✓ Server is reachable via ping"
else
    echo "   ✗ Server is NOT reachable via ping"
    echo "   → Check if both devices are on the same network"
    echo "   → Check if server's firewall blocks ICMP"
fi
echo ""

# Test 2: Port connectivity
echo "2. PORT CONNECTIVITY TEST"
echo "   Testing if port $SERVER_PORT is open..."
if command -v nc > /dev/null 2>&1; then
    if nc -zv -w 2 "$SERVER_IP" "$SERVER_PORT" 2>&1 | grep -q succeeded; then
        echo "   ✓ Port $SERVER_PORT is OPEN"
    else
        echo "   ✗ Port $SERVER_PORT is CLOSED or FILTERED"
        echo "   → Check if server is running"
        echo "   → Check firewall rules"
    fi
elif command -v telnet > /dev/null 2>&1; then
    timeout 2 telnet "$SERVER_IP" "$SERVER_PORT" 2>&1 | grep -q Connected && \
        echo "   ✓ Port $SERVER_PORT is OPEN" || \
        echo "   ✗ Port $SERVER_PORT is CLOSED or FILTERED"
else
    echo "   ⚠ nc or telnet not found, skipping port test"
fi
echo ""

# Test 3: HTTP health check
echo "3. HTTP HEALTH CHECK"
echo "   Testing HTTP endpoint..."
if command -v curl > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "http://$SERVER_IP:$SERVER_PORT/health" 2>&1)
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
    RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✓ HTTP endpoint responding (200 OK)"
        echo "   Response: $RESPONSE_BODY"
    else
        echo "   ✗ HTTP endpoint returned: $HTTP_CODE"
        echo "   Response: $RESPONSE_BODY"
    fi
else
    echo "   ⚠ curl not found, skipping HTTP test"
fi
echo ""

# Test 4: Get diagnostics
echo "4. SERVER DIAGNOSTICS"
echo "   Fetching server diagnostics..."
if command -v curl > /dev/null 2>&1; then
    DIAG_RESPONSE=$(curl -s "http://$SERVER_IP:$SERVER_PORT/diagnostics" 2>&1)
    if echo "$DIAG_RESPONSE" | grep -q "server_status"; then
        echo "   ✓ Diagnostics endpoint working"
        echo ""
        echo "$DIAG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DIAG_RESPONSE"
    else
        echo "   ⚠ Diagnostics endpoint not available (may need server restart)"
        echo "   Response: $DIAG_RESPONSE"
    fi
else
    echo "   ⚠ curl not found, skipping diagnostics test"
fi
echo ""

# Test 5: WebSocket test (if wscat is available)
echo "5. WEBSOCKET CONNECTION TEST"
if command -v wscat > /dev/null 2>&1; then
    echo "   Testing WebSocket connection..."
    # Run wscat with timeout and capture output
    WS_OUTPUT=$(timeout 3 wscat -c "ws://$SERVER_IP:$SERVER_PORT/ar-stream" 2>&1)
    if echo "$WS_OUTPUT" | grep -qi "connected"; then
        echo "   ✓ WebSocket connection successful"
        echo "   Connection established and server accepted upgrade"
    else
        echo "   ✗ WebSocket connection failed"
        echo "   Output: $WS_OUTPUT"
    fi
else
    echo "   ⚠ wscat not found, skipping WebSocket test"
    echo "   Install with: npm install -g wscat"
fi
echo ""

echo "==========================================="
echo "Test Summary"
echo "==========================================="
echo "Server Address: ws://$SERVER_IP:$SERVER_PORT/ar-stream"
echo ""
echo "If all tests pass, your Android app should connect."
echo "If tests fail, check:"
echo "  1. Both devices on same WiFi network"
echo "  2. Server is running (python main.py)"
echo "  3. Firewall not blocking port $SERVER_PORT"
echo "  4. Correct IP address"
echo ""
