#!/bin/bash
# Script to set up and run the backend server (which also serves the frontend)

set -e

# Step 1: Install backend dependencies
cd "$(dirname "$0")/backend"
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Step 2: Install PyTorch manually (CPU version for macOS)
echo "Installing PyTorch (CPU version)..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Step 3: Start the backend server
# (You can change this to 'flask run' if you use Flask CLI)
echo "Starting backend server..."
python app.py
