#!/bin/bash

# Generate Python protobuf code from .proto file

# Copy proto file from parent directory
cp ../proto/ar_stream.proto proto/

# Generate Python code
protoc --python_out=proto/ proto/ar_stream.proto

echo "Protobuf Python code generated in proto/ar_stream_pb2.py"
