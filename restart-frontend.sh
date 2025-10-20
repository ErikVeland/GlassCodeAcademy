#!/usr/bin/env bash
# restart-frontend.sh - Robust frontend restart script
# This script addresses common Next.js stability issues and provides a clean restart

set -euo pipefail

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "❌ ERROR: $1"
    exit 1
}

# Configuration
FRONTEND_DIR="/Users/veland/GlassCodeAcademy/glasscode/frontend"
APP_NAME="glasscode"
FRONTEND_PORT="${PORT:-3000}"

log "🔄 Starting robust frontend restart process..."

# Step 1: Kill any existing Next.js processes
log "🛑 Stopping existing Next.js processes..."
pkill -f "next-server\|next dev\|node.*3000" || true
sleep 2

# Step 2: Navigate to frontend directory
cd "$FRONTEND_DIR" || error_exit "Cannot access frontend directory: $FRONTEND_DIR"

# Step 3: Clean build artifacts
log "🧹 Cleaning build artifacts..."
rm -rf .next/cache || true
rm -rf .next/server/chunks/*.js || true
rm -rf .next/standalone/.next/cache || true

# Step 4: Verify and reinstall dependencies if needed
log "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    log "📦 Reinstalling dependencies..."
    rm -rf node_modules package-lock.json || true
    npm install
else
    log "📦 Dependencies are up to date"
fi

# Step 5: Clean rebuild
log "🔨 Performing clean build..."
npm run build || error_exit "Build failed"

# Step 6: Verify build artifacts
log "🔍 Verifying build artifacts..."
if [ ! -f ".next/BUILD_ID" ]; then
    error_exit "Build verification failed: BUILD_ID missing"
fi

if [ ! -d ".next/server" ]; then
    error_exit "Build verification failed: server directory missing"
fi

if [ ! -d ".next/standalone" ]; then
    error_exit "Build verification failed: standalone directory missing"
fi

# Step 7: Start the application
log "🚀 Starting frontend application..."

# Check if we're in a systemd environment (Linux) or development (macOS)
if command -v systemctl >/dev/null 2>&1; then
    # Production environment with systemd
    log "🔧 Using systemd service management..."
    
    # Stop service if running
    systemctl stop "${APP_NAME}-frontend" 2>/dev/null || true
    
    # Unmask if needed
    systemctl unmask "${APP_NAME}-frontend" 2>/dev/null || true
    
    # Start service
    systemctl start "${APP_NAME}-frontend" || error_exit "Failed to start systemd service"
    
    # Wait for service to be ready
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if systemctl is-active --quiet "${APP_NAME}-frontend"; then
            log "✅ Frontend service is running at attempt $attempt/$max_attempts"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            error_exit "Service failed to start within timeout"
        fi
        log "⏰ Waiting for service to start (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # Show service status
    systemctl status "${APP_NAME}-frontend" --no-pager || true
    
else
    # Development environment
    log "🔧 Using development server..."
    
    # Start in standalone mode for better stability
    cd .next/standalone
    
    # Start the server in background
    nohup node server.js -p "$FRONTEND_PORT" > ../frontend.log 2>&1 &
    server_pid=$!
    
    log "🚀 Started frontend server with PID: $server_pid"
    
    # Wait for server to be ready
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            log "✅ Frontend server is responding on port $FRONTEND_PORT at attempt $attempt/$max_attempts"
            break
        fi
        if [ $attempt -eq $max_attempts ]; then
            log "⚠️  Server may not be fully ready yet, but process is running"
            break
        fi
        log "⏰ Waiting for server to respond (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "📋 Server PID: $server_pid"
    log "📋 Log file: $FRONTEND_DIR/.next/frontend.log"
    log "📋 URL: http://localhost:$FRONTEND_PORT"
fi

log "✅ Frontend restart completed successfully!"