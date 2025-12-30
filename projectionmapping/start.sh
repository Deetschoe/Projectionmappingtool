#!/bin/bash

# Simple HTTP server to start the projection mapping tool
# This ensures webcam, microphone, and cross-window communication work properly

echo "Starting Projection Mapping Tool..."
echo ""
echo "The app will be available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "Error: Python is not installed."
    echo "Please install Python or use another method to serve the files."
    exit 1
fi

