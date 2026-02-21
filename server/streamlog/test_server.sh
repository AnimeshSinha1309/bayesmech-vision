#!/bin/bash
# AR Stream Server Test Script
# Tests connectivity and WebSocket streaming
#
# Usage:
#   ./test_server.sh                    # Test local server (localhost:8080)
#   ./test_server.sh 192.168.1.2        # Test remote server
#   ./test_server.sh 192.168.1.2 8080   # Test with custom port

SERVER_IP="${1:-localhost}"
SERVER_PORT="${2:-8080}"

echo "==========================================="
echo "AR Stream Server Test Suite"
echo "==========================================="
echo ""
echo "Testing server at: $SERVER_IP:$SERVER_PORT"
echo ""

# ============================================
# PART 1: CONNECTIVITY TESTS
# ============================================

echo "==========================================="
echo "CONNECTIVITY TESTS"
echo "==========================================="
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

# ============================================
# PART 2: HTTP ENDPOINT TESTS
# ============================================

echo "==========================================="
echo "HTTP ENDPOINT TESTS"
echo "==========================================="
echo ""

# Determine base URL
if [ "$SERVER_IP" == "localhost" ] || [ "$SERVER_IP" == "127.0.0.1" ]; then
    BASE_URL="http://localhost:$SERVER_PORT"
else
    BASE_URL="http://$SERVER_IP:$SERVER_PORT"
fi

# Test 3: Dashboard endpoint
echo "3. DASHBOARD ENDPOINT TEST"
echo "   GET $BASE_URL/"
if command -v curl > /dev/null 2>&1; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✓ Dashboard endpoint responding (200 OK)"
        echo "   Dashboard is accessible in browser"
    else
        echo "   ✗ Dashboard endpoint returned: $HTTP_CODE"
    fi
else
    echo "   ✗ curl not found"
fi
echo ""
echo ""

# ============================================
# PART 3: WEBSOCKET TEST
# ============================================

echo "4. WEBSOCKET CONNECTION TEST (AR Stream)"
if command -v wscat > /dev/null 2>&1; then
    echo "   Testing WebSocket connection..."
    # Determine WebSocket URL
    if [ "$SERVER_IP" == "localhost" ] || [ "$SERVER_IP" == "127.0.0.1" ]; then
        WS_URL="ws://localhost:$SERVER_PORT/ar-stream"
    else
        WS_URL="ws://$SERVER_IP:$SERVER_PORT/ar-stream"
    fi
    
    # Run wscat with timeout and capture output
    WS_OUTPUT=$(timeout 3 wscat -c "$WS_URL" 2>&1)
    if echo "$WS_OUTPUT" | grep -qi "connected"; then
        echo "   ✓ WebSocket connection successful"
        echo "   Server is ready to accept AR data streams"
    else
        echo "   ✗ WebSocket connection failed"
        echo "   Output: $WS_OUTPUT"
    fi
else
    echo "   ⚠ wscat not found, skipping WebSocket test"
    echo "   Install with: npm install -g wscat"
fi
echo ""

# ============================================
# SUMMARY
# ============================================

echo "==========================================="
echo "Test Summary"
echo "==========================================="
if [ "$SERVER_IP" == "localhost" ] || [ "$SERVER_IP" == "127.0.0.1" ]; then
    WS_ENDPOINT="ws://localhost:$SERVER_PORT/ar-stream"
    DASHBOARD_URL="http://localhost:$SERVER_PORT/"
else
    WS_ENDPOINT="ws://$SERVER_IP:$SERVER_PORT/ar-stream"
    DASHBOARD_URL="http://$SERVER_IP:$SERVER_PORT/"
fi

echo "AR Stream WebSocket: $WS_ENDPOINT"
echo "Dashboard URL:       $DASHBOARD_URL"
echo ""
echo "All tests completed:"
echo "  • Ping connectivity"
echo "  • Port connectivity"
echo "  • Dashboard endpoint"
echo "  • WebSocket connection"
echo ""
echo "If all tests pass, your Android app should connect successfully."
echo "If tests fail, check:"
echo "  1. Both devices on same WiFi network"
echo "  2. Server is running (./start_server.sh)"
echo "  3. Firewall not blocking port $SERVER_PORT"
echo "  4. Correct IP address"
echo ""
echo "To use in your Android app, use this WebSocket URL:"
echo "  $WS_ENDPOINT"
echo ""
