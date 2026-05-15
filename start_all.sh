#!/bin/bash

# Kill all background jobs on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "Starting Backend..."
(cd backend && npx nodemon src/index.js) &
BACKEND_PID=$!

echo "Starting AI Service..."
# Adjust path to python if needed, assuming .venv in root
(cd ai_service && "../.venv/bin/python" app.py) &
AI_PID=$!

echo "Starting Frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Wait for all processes
wait $BACKEND_PID $AI_PID $FRONTEND_PID
