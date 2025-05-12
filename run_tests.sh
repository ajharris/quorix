#!/bin/bash

# Run backend tests
cd backend
pytest

# Run frontend tests
cd ../frontend
npm test
