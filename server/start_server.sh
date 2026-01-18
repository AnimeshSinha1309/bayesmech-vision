#!/bin/bash
# Restart the AR Stream server
# This script will stop the current server and restart it with visible logs

echo "============================================"
echo "Starting AR Stream Server"
echo "============================================"
echo ""

# Find and kill existing server process
SERVER_PID=$(ps aux | grep "python main.py" | grep -v grep | awk '{print $2}')

if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping existing server (PID: $SERVER_PID)..."
    kill $SERVER_PID
    sleep 2
    
    # Force kill if still running
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "Force killing server..."
        kill -9 $SERVER_PID
        sleep 1
    fi
    echo "✓ Server stopped"
else
    echo "No existing server found"
fi

echo ""
echo "Starting server..."
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo ""

# Start the server
python main.py
