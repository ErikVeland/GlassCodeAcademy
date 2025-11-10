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
    
    # Additional cleanup for any remaining node processes
    NODE_BACKEND_PIDS=$(pgrep -f "node.*backend" 2>/dev/null)
    if [[ -n "$NODE_BACKEND_PIDS" ]]; then
        echo "🛑 Stopping node backend processes (PIDs: $NODE_BACKEND_PIDS)"
        kill -9 $NODE_BACKEND_PIDS 2>/dev/null || true
    fi
    
    NODE_FRONTEND_PIDS=$(pgrep -f "node.*next" 2>/dev/null)
    if [[ -n "$NODE_FRONTEND_PIDS" ]]; then
        echo "🛑 Stopping node frontend processes (PIDs: $NODE_FRONTEND_PIDS)"
        kill -9 $NODE_FRONTEND_PIDS 2>/dev/null || true
    fi
    
    echo "✅ Existing services stopped"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    cd backend-node
    # Check if database is accessible before running migrations
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        if timeout 5 npm run health >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            npm run migrate
            if [ $? -ne 0 ]; then
                echo "❌ Database migrations failed"
                cd ..
                return 1
            fi
            echo "✅ Database migrations completed"
            cd ..
            return 0
        fi
        echo "⚠️  Database not accessible, waiting... (attempt $DB_CHECK/$MAX_DB_CHECKS)"
        draw_progress "$DB_CHECK" "$MAX_DB_CHECKS" "Waiting for database"
        DB_CHECK=$((DB_CHECK + 1))
        sleep 2
    done
    echo "❌ Database not accessible after $MAX_DB_CHECKS attempts, skipping migrations"
    cd ..
    return 1
}

# Function to run database seeding
run_seeding() {
    echo "🌱 Running database seeding..."
    cd backend-node
    # Check if database is accessible before running seeding
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        if timeout 5 npm run health >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            # Run basic seeding
            npm run seed
            if [ $? -ne 0 ]; then
                echo "❌ Database basic seeding failed"
                cd ..
                return 1
            fi
            echo "✅ Database basic seeding completed"
            
            # Run content seeding
            npm run seed:content
            if [ $? -ne 0 ]; then
                echo "❌ Database content seeding failed"
                cd ..
                return 1
            fi
            echo "✅ Database content seeding completed"
            cd ..
            return 0
        fi
        echo "⚠️  Database not accessible, waiting... (attempt $DB_CHECK/$MAX_DB_CHECKS)"
        draw_progress "$DB_CHECK" "$MAX_DB_CHECKS" "Waiting for database"
        DB_CHECK=$((DB_CHECK + 1))
        sleep 2
    done
    echo "❌ Database not accessible after $MAX_DB_CHECKS attempts, skipping seeding"
    cd ..
    return 1
}

# Add a flag to skip migrations
SKIP_MIGRATIONS=0
for arg in "$@"; do
    if [ "$arg" = "--skip-migrations" ]; then
        SKIP_MIGRATIONS=1
    fi
done

# Run migrations unless skipped
if [ $SKIP_MIGRATIONS -eq 0 ]; then
    run_migrations
    if [ $? -ne 0 ]; then
        echo "❌ Failed to run migrations, exiting"
        exit 1
    fi
else
    echo "⏭️  Skipping database migrations"
fi

# Stop any existing services before starting new ones
stop_existing_services

# Copy latest registry.json to frontend public directory
echo "🔄 Syncing frontend configuration..."
cp content/registry.json glasscode/frontend/public/registry.json 2>/dev/null || echo "⚠️  Warning: Could not sync registry.json"

# Start Node.js backend service
echo "🔧 Starting Node.js backend service..."
if [ ! -d "backend-node" ]; then
    echo "❌ ERROR: Node.js backend directory 'backend-node' not found."
    echo "Please ensure the Node.js backend has been set up correctly."
    exit 1
fi

cd backend-node
if [ -x "./scripts/start-dev.sh" ]; then
    ./scripts/start-dev.sh &
else
    echo "ℹ️  No start-dev.sh found in backend-node, running npm directly..."
    npm run dev &
fi
BACKEND_PID=$!
cd ..

# Wait for backend to be fully ready by polling the health check endpoint
echo "⏳ Waiting for backend to be fully loaded and healthy..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=2
LAST_STATUS=""
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8080/health >/dev/null 2>&1; then
        printf "\n"  # Clear progress line
        echo "✅ Backend health check passed: System is healthy (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        break
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "Checking backend health"
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    echo "❌ Backend failed to start properly within the expected time."
    echo "🧪 Diagnostic: backend service status"
    ps -ef | grep -E "node.*backend" | grep -v grep || true
    echo "🧪 Diagnostic: listening ports (expect :8080)"
    ss -tulpn | grep :8080 || true
    echo "🧪 Diagnostic: health endpoint verbose output"
    curl -v http://localhost:8080/health || true
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Run seeding after backend is ready
run_seeding
if [ $? -ne 0 ]; then
    echo "❌ Failed to run database seeding"
    exit 1
fi

# Small additional delay to ensure backend is completely ready
sleep 2

# Start frontend service
echo "🎨 Starting frontend service..."
cd glasscode/frontend
# Explicitly set PORT to 3000 to avoid conflicts
PORT=3000 npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to be fully ready by polling
echo "⏳ Waiting for frontend to be fully loaded..."
MAX_FE_ATTEMPTS=30
FE_ATTEMPT=1
while [[ $FE_ATTEMPT -le $MAX_FE_ATTEMPTS ]]; do
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        printf "\n"  # Clear progress line
        echo "✅ Frontend is fully loaded and ready! (attempt $FE_ATTEMPT/$MAX_FE_ATTEMPTS)"
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
BACKEND_CONTENT_CHECK=$(curl -s http://localhost:8080/health | grep -c 'healthy')

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
echo "🔗 Backend Health Check: http://localhost:8080/health"
echo ""
echo "⏹️  Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID