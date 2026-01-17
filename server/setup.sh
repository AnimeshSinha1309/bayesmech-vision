#!/bin/bash

echo "========================================="
echo "AR Stream Server Setup"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version
if [ $? -ne 0 ]; then
    echo "ERROR: Python 3 is not installed!"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if protoc is installed
echo ""
echo "Checking for protoc..."
if ! command -v protoc &> /dev/null; then
    echo "WARNING: protoc not found. Installing protobuf-compiler..."

    # Try to install protoc based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y protobuf-compiler
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install protobuf
    else
        echo "Please install protoc manually: https://grpc.io/docs/protoc-installation/"
        exit 1
    fi
fi

# Generate protobuf code
echo ""
echo "Generating Protocol Buffer code..."
mkdir -p proto
cp ../proto/ar_stream.proto proto/
protoc --python_out=proto/ proto/ar_stream.proto

if [ -f "proto/ar_stream_pb2.py" ]; then
    echo "✓ Protocol Buffer code generated successfully"
else
    echo "ERROR: Failed to generate protobuf code"
    exit 1
fi

# Create data directory
echo ""
echo "Creating data directory..."
mkdir -p data
mkdir -p exports

# Get server IP
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""

# Display IP addresses
echo "Your server IP addresses:"
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  - " $2}'
else
    ipconfig | findstr IPv4
fi

echo ""
echo "To start the server, run:"
echo "  python main.py"
echo ""
echo "Server will be available at:"
echo "  ws://YOUR_IP:8080/ar-stream"
echo ""
echo "Don't forget to update the Android app with your server IP!"
echo "Edit: android/app/src/main/java/.../HelloArActivity.kt"
echo ""
