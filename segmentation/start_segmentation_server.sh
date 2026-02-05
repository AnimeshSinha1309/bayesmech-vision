#!/bin/bash
# Start only the segmentation server (for debugging)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PATH="${SCRIPT_DIR}/../server/.venv"

if [ -d "$VENV_PATH" ]; then
    echo "Using virtual environment: $VENV_PATH"
    cd "$SCRIPT_DIR" && "${VENV_PATH}/bin/python" segmentation_server.py
else
    echo "Virtual environment not found, using system Python"
    cd "$SCRIPT_DIR" && python segmentation_server.py
fi
