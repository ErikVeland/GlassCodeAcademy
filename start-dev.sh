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

# Kill any existing processes on the ports we'll use
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Copy latest registry.json to frontend public directory
echo "🔄 Syncing frontend configuration..."
cp ../content/registry.json glasscode/frontend/public/registry.json 2>/dev/null || echo "⚠️  Warning: Could not sync registry.json"

# Start backend service
echo "🔧 Starting backend service..."
cd glasscode/backend
./start-dev.sh &
BACKEND_PID=$!
cd ../..

# Wait for backend to be fully ready by polling the health check endpoint
echo "⏳ Waiting for backend to be fully loaded..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=2
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        echo "✅ Backend is fully loaded and ready!"
        # Get backend health details
        HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
        BACKEND_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [[ "$BACKEND_STATUS" == "healthy" ]]; then
            echo "✅ Backend health check passed: System is healthy"
        else
            echo "⚠️  Backend health check shows degraded status, but service is responding"
        fi
        break
    fi
    echo "⏳ Waiting for backend... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    echo "❌ Backend failed to start properly within the expected time."
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Small additional delay to ensure backend is completely ready
sleep 2

# Start frontend service
echo "🎨 Starting frontend service..."
cd glasscode/frontend
./start-dev.sh &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to be fully ready by polling
echo "⏳ Waiting for frontend to be fully loaded..."
MAX_FE_ATTEMPTS=30
FE_ATTEMPT=1
while [[ $FE_ATTEMPT -le $MAX_FE_ATTEMPTS ]]; do
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend is fully loaded and ready!"
        break
    fi
    echo "⏳ Waiting for frontend... (attempt $FE_ATTEMPT/$MAX_FE_ATTEMPTS)"
    FE_ATTEMPT=$((FE_ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $FE_ATTEMPT -gt $MAX_FE_ATTEMPTS ]]; then
    echo "❌ Frontend failed to start properly within the expected time."
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Final health checks
echo "📋 Performing final health checks..."
echo "🔍 Checking backend content availability..."
BACKEND_CONTENT_CHECK=$(curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -c '__typename')

if [[ $BACKEND_CONTENT_CHECK -gt 0 ]]; then
    echo "✅ Backend content is accessible"
else
    echo "⚠️  Warning: Backend content check failed"
fi

echo "🔍 Checking frontend content..."
FRONTEND_CONTENT_CHECK=$(curl -s http://localhost:3000/registry.json | grep -c 'modules')

if [[ $FRONTEND_CONTENT_CHECK -gt 0 ]]; then
    echo "✅ Frontend content is accessible"
else
    echo "⚠️  Warning: Frontend content check failed"
fi

echo ""
echo "✅ Services started and health checked!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend GraphQL: http://localhost:8080/graphql"
echo "🔗 Backend GraphQL UI: http://localhost:8080/graphql-ui"
echo "🔗 Backend Health Check: http://localhost:8080/api/health"
echo ""
echo "⏹️  Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID