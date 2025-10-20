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

# Progress bar helper
draw_progress() {
    local current=$1
    local max=$2
    local label="$3"
    local width=30
    local filled=$(( current * width / max ))
    local empty=$(( width - filled ))
    printf "\r["
    for ((i=0; i<filled; i++)); do printf "#"; done
    for ((i=0; i<empty; i++)); do printf "-"; done
    printf "] %s (%d/%d)" "$label" "$current" "$max"
}

# Function to stop any existing processes on specific ports
stop_existing_services() {
    echo "🔄 Stopping any existing services on ports 8080 and 3000..."
    
    # Kill processes using port 8080 (backend)
    PORT_8080_PIDS=$(lsof -ti:8080 2>/dev/null)
    if [[ -n "$PORT_8080_PIDS" ]]; then
        echo "🛑 Stopping processes on port 8080 (PIDs: $PORT_8080_PIDS)"
        kill -9 $PORT_8080_PIDS 2>/dev/null || true
        sleep 2
    fi
    
    # Kill processes using port 3000 (frontend)
    PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
    if [[ -n "$PORT_3000_PIDS" ]]; then
        echo "🛑 Stopping processes on port 3000 (PIDs: $PORT_3000_PIDS)"
        kill -9 $PORT_3000_PIDS 2>/dev/null || true
        sleep 2
    fi
    
    # Additional cleanup for any remaining dotnet or node processes
    DOTNET_PIDS=$(pgrep -f "dotnet.*backend" 2>/dev/null)
    if [[ -n "$DOTNET_PIDS" ]]; then
        echo "🛑 Stopping dotnet backend processes (PIDs: $DOTNET_PIDS)"
        kill -9 $DOTNET_PIDS 2>/dev/null || true
    fi
    
    NODE_PIDS=$(pgrep -f "node.*next" 2>/dev/null)
    if [[ -n "$NODE_PIDS" ]]; then
        echo "🛑 Stopping node frontend processes (PIDs: $NODE_PIDS)"
        kill -9 $NODE_PIDS 2>/dev/null || true
    fi
    
    echo "✅ Existing services stopped"
}

# Stop any existing services before starting new ones
stop_existing_services

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
echo "⏳ Waiting for backend to be fully loaded and healthy..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=2
LAST_STATUS=""
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
        BACKEND_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [[ "$BACKEND_STATUS" == "healthy" ]]; then
            printf "\n"  # Clear progress line
-            echo "✅ Backend health check passed: System is healthy"
+            echo "✅ Backend health check passed: System is healthy (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        else
            # Only log status change if it's different from last time
            if [[ "$BACKEND_STATUS" != "$LAST_STATUS" ]]; then
                printf "\n"  # Clear progress line
                # Parse dataStats to show what's missing
                MISSING_DATA=$(echo "$HEALTH_RESPONSE" | grep -o '"[^"]*":0' | cut -d'"' -f2 | tr '\n' ',' | sed 's/,$//')
                if [[ -n "$MISSING_DATA" ]]; then
                    echo "⚠️  Backend responding but status is $BACKEND_STATUS (missing data: $MISSING_DATA)"
                else
                    echo "⚠️  Backend responding but status is $BACKEND_STATUS (reason unknown)"
                fi
                LAST_STATUS="$BACKEND_STATUS"
            fi
        fi
        break
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "Checking backend health"
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    echo "❌ Backend failed to start properly within the expected time."
    echo "🧪 Diagnostic: backend service status"
    ps -ef | grep -E "dotnet.*backend" | grep -v grep || true
    echo "🧪 Diagnostic: listening ports (expect :8080)"
    ss -tulpn | grep :8080 || true
    echo "🧪 Diagnostic: health endpoint verbose output"
    curl -v http://localhost:8080/api/health || true
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
        printf "\n"  # Clear progress line
-        echo "✅ Frontend is fully loaded and ready!"
+        echo "✅ Frontend is fully loaded and ready! (attempt $FE_ATTEMPT/$MAX_FE_ATTEMPTS)"
        break
    fi
    draw_progress "$FE_ATTEMPT" "$MAX_FE_ATTEMPTS" "Checking frontend"
    FE_ATTEMPT=$((FE_ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $FE_ATTEMPT -gt $MAX_FE_ATTEMPTS ]]; then
    echo "❌ Frontend failed to start properly within the expected time."
    echo "🧪 Diagnostic: frontend dev server status"
    ps -ef | grep -E "node.*next" | grep -v grep || true
    echo "🧪 Diagnostic: listening ports (expect :3000)"
    ss -tulpn | grep :3000 || true
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