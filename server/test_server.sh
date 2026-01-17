#!/bin/bash
# Test script for AR Stream Server endpoints

echo "========================================="
echo "AR Stream Server Connection Test"
echo "========================================="
echo ""

SERVER_URL="http://localhost:8080"

echo "1. Testing Health Endpoint..."
echo "   GET $SERVER_URL/health"
curl -s "$SERVER_URL/health" | python3 -m json.tool
echo ""
echo ""

echo "2. Testing Diagnostics Endpoint..."
echo "   GET $SERVER_URL/diagnostics"
curl -s "$SERVER_URL/diagnostics" | python3 -m json.tool
echo ""
echo ""

echo "3. Testing Status Endpoint..."
echo "   GET $SERVER_URL/"
curl -s "$SERVER_URL/" | python3 -m json.tool
echo ""
echo ""

echo "========================================="
echo "Test Complete!"
echo "========================================="
echo ""
echo "To update Android app with correct server IP:"
echo "1. Note the 'websocket_endpoint' from diagnostics above"
echo "2. Update HelloArActivity.kt line 100 with that URL"
echo ""
