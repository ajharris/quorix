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

# Only run db migrate/upgrade if models have changed since last migration
MODELS_HASH=.models.hash
MIGRATIONS_DIR=migrations
MODELS_CHANGED=false

# Hash all model files (now in backend/models, but we are already in backend)
find models -type f -name '*.py' -exec cat {} + | md5sum | awk '{print $1}' > .models.hash.new
if [ ! -f "$MODELS_HASH" ] || ! cmp -s .models.hash.new $MODELS_HASH; then
  MODELS_CHANGED=true
  echo "Detected model changes. Running db migrate and upgrade..."
  export FLASK_APP=app.py
  flask db migrate -m "Auto migration from setup_and_start.sh"
  flask db upgrade
  mv .models.hash.new $MODELS_HASH
else
  echo "No model changes detected. Skipping db migrate/upgrade."
  rm .models.hash.new
fi

# --- FRONTEND BUILD CHECK/BUILD LOGIC ---
cd ../frontend
BUILD_DIR=build
BUILD_INDEX=$BUILD_DIR/index.html
SRC_DIR=src
PUBLIC_DIR=public
SENTINEL=.last_build_sentinel

NEED_BUILD=false

# 1. If build dir or index.html missing, must build
if [ ! -d "$BUILD_DIR" ] || [ ! -f "$BUILD_INDEX" ]; then
  echo "Frontend build directory or index.html missing. Building frontend..."
  NEED_BUILD=true
else
  # 2. If any src/ or public/ file is newer than build/index.html, must build
  NEWEST_SRC=$(find $SRC_DIR $PUBLIC_DIR -type f -printf '%T@\n' | sort -n | tail -1)
  BUILD_INDEX_TIME=$(stat -c %Y "$BUILD_INDEX")
  if (( $(echo "$NEWEST_SRC > $BUILD_INDEX_TIME" | bc -l) )); then
    echo "Frontend source/public newer than build. Building frontend..."
    NEED_BUILD=true
  fi
fi

if [ "$NEED_BUILD" = true ]; then
  npm install
  npm run build
  # Update sentinel for future use
  date +%s > $SENTINEL
else
  echo "Frontend build is up to date."
fi
cd ..

# Check that frontend build exists before starting backend
if [ ! -f "frontend/build/index.html" ]; then
  echo "ERROR: Frontend build not found (frontend/build/index.html missing). Aborting backend start."
  echo "Please run 'npm run build' in the frontend directory."
  exit 1
fi

# Start backend server from project root for correct imports
python -m backend.app
