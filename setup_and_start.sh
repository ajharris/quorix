#!/bin/bash
# Script to set up Python 3.12 venv, install dependencies, and start the backend server

set -e

DEMO_MODE=true

# Check for python3.12, install if missing (Linux only)
if ! command -v python3.12 &> /dev/null; then
  if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 11 ] && [ "$PYTHON_MINOR" -le 12 ]; then
      echo "python3.12 not found, but python3 version $PYTHON_VERSION is available. Using python3."
      PYTHON_CMD=python3
    else
      echo "ERROR: Python 3.11 or 3.12 is required. Found python3 version $PYTHON_VERSION. Please install Python 3.11 or 3.12."
      exit 1
    fi
  else
    echo "ERROR: Python 3.11 or 3.12 is required but not found. Please install Python 3.11 or 3.12 and try again."
    exit 1
  fi
else
  PYTHON_CMD=python3.12
fi

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  $PYTHON_CMD -m venv venv
fi

# Activate venv
source "$(dirname "$0")/venv/bin/activate"

# Only install backend dependencies if requirements.txt has changed since last install
cd backend
source ../venv/bin/activate
REQUIREMENTS_HASH=.requirements.hash
# Always install if Flask is missing, even if hash matches
if [ ! -f "$REQUIREMENTS_HASH" ] || ! cmp -s requirements.txt $REQUIREMENTS_HASH || ! python -c "import flask" 2>/dev/null; then
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

# Check for DEMO_MODE
if [ "${DEMO_MODE,,}" = "1" ] || [ "${DEMO_MODE,,}" = "true" ]; then
  echo
  echo "==============================="
  echo "  DEMO MODE ENABLED"
  echo "  Seeding demo database with sample data."
  echo "==============================="
  echo
  python seed_demo_data.py
else
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
fi

# --- FRONTEND BUILD CHECK/BUILD LOGIC ---
cd ../frontend
BUILD_DIR=build
BUILD_INDEX=$BUILD_DIR/index.html
SRC_DIR=src
PUBLIC_DIR=public
SENTINEL=.last_build_sentinel

NEED_BUILD=false

# Ensure 'bc' is installed for frontend build checks
if ! command -v bc &> /dev/null; then
  echo "Installing 'bc' utility for build checks..."
  sudo apt-get update && sudo apt-get install -y bc
fi

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
export DEMO_MODE=1
python -m backend.app
