#!/bin/bash

# Script to start both backend and frontend services for GlassCode Academy

echo "🚀 Starting GlassCode Academy Services..."

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up cleanup function to run on script exit
trap cleanup EXIT INT TERM

# Kill any existing processes on our ports
echo "🔄 Stopping any existing services on ports 8080 and 3000..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be released
sleep 2

# Start backend service
echo "🔧 Starting backend service..."
cd /Users/veland/GlassCodeAcademy/backend-node
npm run dev &
BACKEND_PID=$!

# Start frontend service
echo "🎨 Starting frontend service..."
cd /Users/veland/GlassCodeAcademy/glasscode/frontend
# Ensure we use port 3000
PORT=3000 npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started successfully!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8080"
echo "🔗 Backend Health: http://localhost:8080/health"
echo ""
echo "⏹️  Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID