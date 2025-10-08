#!/bin/bash

# Development script to start both frontend and backend services
# This script starts both services in the background and provides a single interface to manage them

echo "🚀 Starting GlassCode Academy (Development Mode)..."

# Check if required tools are installed
if ! command -v npm &> /dev/null
then
    echo "❌ ERROR: npm is not installed. Please install Node.js and npm."
    exit 1
fi

if ! command -v dotnet &> /dev/null
then
    echo "❌ ERROR: .NET is not installed. Please install .NET 8.0 or later."
    exit 1
fi

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

# Start backend service
echo "🔧 Starting backend service..."
cd glasscode/backend
./start-dev.sh &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Start frontend service
echo "🎨 Starting frontend service..."
cd glasscode/frontend
./start-dev.sh &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Services started!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend GraphQL: http://localhost:8080/graphql"
echo "🔗 Backend GraphQL UI: http://localhost:8080/graphql-ui"
echo "🔗 Backend Health Check: http://localhost:8080/api/health"
echo ""
echo "⏹️  Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID