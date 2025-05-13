#!/bin/bash
# Script to set up Python 3.12 venv, install dependencies, and start the backend server

set -e

# Check for python3.12
if ! command -v python3.12 &> /dev/null; then
  echo "Python 3.12 not found. Installing with Homebrew..."
  brew install python@3.12
fi

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python 3.12 virtual environment..."
  python3.12 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install PyTorch (CPU version)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Start backend server
python app.py
