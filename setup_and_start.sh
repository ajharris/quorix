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
SENTINEL=.last_build_sentinel
HASH_CMD="find src public package.json package-lock.json 2>/dev/null | sort | xargs cat 2>/dev/null | sha256sum | cut -d' ' -f1"
CURRENT_HASH=$(eval $HASH_CMD)
LAST_HASH=""
if [ -f "$SENTINEL" ]; then
  LAST_HASH=$(cat $SENTINEL)
fi
if [ "$CURRENT_HASH" != "$LAST_HASH" ]; then
  echo "Frontend source changed or not built. Building frontend..."
  npm install
  npm run build && echo "$CURRENT_HASH" > $SENTINEL
else
  echo "No frontend changes since last build. Skipping build."
fi
cd ..

# Start backend server from project root for correct imports
python -m backend.app
