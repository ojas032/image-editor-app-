#!/bin/bash

# Start the Python image processing HTTP server
echo "Starting Python image processing HTTP server on port 5001..."

cd "$(dirname "$0")/python_scripts"

python3 image_server_http.py 5001

