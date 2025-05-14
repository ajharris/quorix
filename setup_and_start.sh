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

# Only install backend dependencies if requirements.txt has changed since last install
cd backend
REQUIREMENTS_HASH=.requirements.hash
if [ ! -f "$REQUIREMENTS_HASH" ] || ! cmp -s requirements.txt $REQUIREMENTS_HASH; then
  echo "Installing backend dependencies..."
  pip install -r requirements.txt
  cp requirements.txt $REQUIREMENTS_HASH
else
  echo "Backend dependencies are up to date."
fi

# Only install PyTorch if not already installed
if ! python -c "import torch" 2>/dev/null; then
  echo "Installing PyTorch (CPU version)..."
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
else
  echo "PyTorch is already installed."
fi

# Build frontend if any file in frontend/ is newer than any file in backend/
cd ../frontend
FRONTEND_NEWEST=$(find . -type f -printf '%T@\n' | sort -n | tail -1)
cd ../backend
BACKEND_NEWEST=$(find . -type f -printf '%T@\n' | sort -n | tail -1)
cd ../frontend
SENTINEL=.last_build_sentinel
if (( $(echo "$FRONTEND_NEWEST > $BACKEND_NEWEST" | bc -l) )); then
  if [ ! -f "$SENTINEL" ] || (( $(echo "$FRONTEND_NEWEST > $(cat $SENTINEL)" | bc -l) )); then
    echo "Frontend is newer than backend or last build. Building frontend..."
    npm install
    npm run build
    echo "$FRONTEND_NEWEST" > $SENTINEL
  else
    echo "No frontend changes since last build. Skipping build."
  fi
else
  echo "Frontend build is up to date."
fi
cd ..

# Start backend server from project root for correct imports
python -m backend.app
