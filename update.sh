#!/usr/bin/env bash
# update.sh - Update GlassCode Academy to the latest version (Node.js version)
# This script updates the application by pulling the latest code and rebuilding components

set -euo pipefail

### Load configuration from .env file ###
ENV_FILE="./.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo "✅ Loaded configuration from $ENV_FILE"
else
    echo "⚠️  WARNING: Configuration file $ENV_FILE not found, using defaults"
    
    APP_NAME="glasscode"
    DEPLOY_USER="deploy"
    APP_DIR="/srv/academy"
    DOMAIN="glasscode.academy"
fi

echo "🔄 Update Script for $APP_NAME (Node.js version)"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Determine frontend port from env, unit file, or default
# Prefer PORT from .env; otherwise extract from existing unit; fallback to 3000
UNIT_FILE_PATH="/etc/systemd/system/${APP_NAME}-frontend.service"
FRONTEND_PORT="${PORT:-}"
if [ -z "$FRONTEND_PORT" ] && [ -f "$UNIT_FILE_PATH" ]; then
    FRONTEND_PORT=$(sed -n 's/^ExecStart=.*-p \([0-9]\+\).*/\1/p' "$UNIT_FILE_PATH" | head -n1 || true)
fi
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=3000
fi

# CLI flags parsing
FAST_MODE=0
SKIP_CONTENT_VALIDATION=0
SKIP_LINT=0
SKIP_TYPECHECK=0
SKIP_BACKEND_HEALTH=0
FRONTEND_ONLY=0
VALIDATE_JSON_CONTENT=0
# Allow overriding port via CLI
while [[ $# -gt 0 ]]; do
    case "$1" in
        --fast) FAST_MODE=1; SKIP_CONTENT_VALIDATION=1; SKIP_LINT=1; SKIP_TYPECHECK=1; SKIP_BACKEND_HEALTH=1; shift;;
        --frontend-only) FRONTEND_ONLY=1; shift;;
        --skip-content-validation) SKIP_CONTENT_VALIDATION=1; shift;;
        --validate-json-content) VALIDATE_JSON_CONTENT=1; shift;;
        --skip-lint) SKIP_LINT=1; shift;;
        --skip-typecheck) SKIP_TYPECHECK=1; shift;;
        --skip-backend-health) SKIP_BACKEND_HEALTH=1; shift;;
        --port) FRONTEND_PORT="${2:-$FRONTEND_PORT}"; shift 2;;
        *) log "⚠️  WARNING: Unknown argument: $1"; shift;;
    esac
done
export FAST_MODE SKIP_CONTENT_VALIDATION SKIP_LINT SKIP_TYPECHECK SKIP_BACKEND_HEALTH FRONTEND_ONLY FRONTEND_PORT VALIDATE_JSON_CONTENT
log "🌐 Frontend port: $FRONTEND_PORT"
log "⚙️  Flags: FAST=$FAST_MODE FRONTEND_ONLY=$FRONTEND_ONLY SKIP_VALIDATION=$SKIP_CONTENT_VALIDATION VALIDATE_JSON=$VALIDATE_JSON_CONTENT SKIP_LINT=$SKIP_LINT SKIP_TS=$SKIP_TYPECHECK SKIP_BACKEND_HEALTH=$SKIP_BACKEND_HEALTH"

draw_progress() {
    # Usage: draw_progress current total [prefix]
    local current=$1
    local total=$2
    local prefix=${3:-""}
    local width=30
    local percent=$(( current * 100 / total ))
    local filled=$(( percent * width / 100 ))
    local bar_filled=$(printf '%*s' "$filled" | tr ' ' '#')
    local bar_empty=$(printf '%*s' $(( width - filled )) | tr ' ' '-')
    printf "\r%s[%s%s] %3d%% (attempt %d/%d)" "$prefix" "$bar_filled" "$bar_empty" "$percent" "$current" "$total"
}

is_service_running() {
    systemctl is-active --quiet "$1"
}

wait_for_service() {
    local service_name=$1
    local max_attempts=120
    local attempt=1
    local sleep_time=2
    local service_failed=false
    if [ "${FAST_MODE:-0}" -eq 1 ]; then
        max_attempts=60
        sleep_time=2
    fi
    
    log "⏳ Waiting for $service_name to start..."
    while [ $attempt -le $max_attempts ]; do
        # Check if service failed
        if systemctl is-failed --quiet "$service_name"; then
            log "❌ $service_name has failed"
            service_failed=true
            break
        fi
        
        if is_service_running "$service_name"; then
            log "✅ $service_name is running (detected in $((attempt * sleep_time)) seconds)"
            # Additional health check for frontend service
            if [ "$service_name" = "${APP_NAME}-frontend" ]; then
                log "🔍 Performing frontend health check..."
                sleep 5  # Give it a moment to fully initialize
                if timeout 10 curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
                    log "✅ Frontend health check passed"
                    return 0
                else
                    log "⚠️  Frontend service running but not responding on port $FRONTEND_PORT, continuing to wait..."
                fi
            else
                return 0
            fi
        fi
        # Only log every 10th attempt to reduce noise
        if [ $((attempt % 10)) -eq 0 ] || [ $attempt -eq 1 ]; then
            log "⏰ Attempt $attempt/$max_attempts: $service_name not ready yet, waiting ${sleep_time}s..."
        fi
        sleep $sleep_time
        attempt=$((attempt + 1))
    done
    
    if [ "$service_failed" = "true" ]; then
        log "❌ $service_name failed during startup"
        systemctl status "$service_name" --no-pager || true
        journalctl -u "$service_name" -n 20 --no-pager || true
    else
        log "❌ ERROR: $service_name failed to start within timeout ($((max_attempts * sleep_time)) seconds)"
    fi
    return 1
}

# Function to install npm dependencies efficiently
install_npm_deps_workspace() {
    local dir="$1"
    local name="$2"
    
    if [ ! -f "$dir/package.json" ]; then
        log "⚠️  No package.json found in $dir, skipping..."
        return 0
    fi
    
    log "📦 Installing $name dependencies..."
    cd "$dir"
    
    # Check if lockfile exists and is newer than package.json
    if [ -f "package-lock.json" ] && [ "package-lock.json" -nt "package.json" ]; then
        log "📋 Using existing lockfile for $name (up to date)"
        sudo -u "$DEPLOY_USER" npm ci || sudo -u "$DEPLOY_USER" npm install
    else
        log "📋 Regenerating lockfile for $name..."
        sudo -u "$DEPLOY_USER" rm -f package-lock.json || true
        sudo -u "$DEPLOY_USER" npm install --package-lock-only
        sudo -u "$DEPLOY_USER" npm ci || sudo -u "$DEPLOY_USER" npm install
    fi
    
    log "✅ $name dependencies installed"
}

install_npm_deps() {
    log "📦 Installing Node.js dependencies for all workspaces..."
    
    # Install dependencies for all workspaces
    install_npm_deps_workspace "$APP_DIR" "root"

    if [ -d "$APP_DIR/scripts" ]; then
        install_npm_deps_workspace "$APP_DIR/scripts" "scripts"
    fi

    install_npm_deps_workspace "$APP_DIR/glasscode/frontend" "frontend"
    install_npm_deps_workspace "$APP_DIR/backend-node" "backend"
    
    log "✅ All Node.js dependencies installed"
}

rollback() {
    log "⏪ Rolling back to previous version..."
    if [ -n "${BACKUP_DIR:-}" ] && [ -d "$BACKUP_DIR" ]; then
        # Restore the previous version
        rsync -a "$BACKUP_DIR/" "$APP_DIR/"
        log "✅ Rollback completed"
    else
        log "❌ No backup found, cannot rollback"
        exit 1
    fi
}

# Create backup of current version
create_backup() {
    BACKUP_DIR="/tmp/${APP_NAME}_backup_$(date +%s)"
    log "📦 Creating backup of current version to $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    rsync -a "$APP_DIR/" "$BACKUP_DIR/"
    log "✅ Backup created"
}

# Main update process
main() {
    log "🔄 Starting update process..."
    
    # Create backup
    create_backup
    
    # Stop services
    log "⏹️  Stopping services..."
    systemctl stop ${APP_NAME}-frontend ${APP_NAME}-backend 2>/dev/null || true
    
    # Pull latest code
    log "📥 Pulling latest code..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
    
    # Install dependencies
    install_npm_deps
    
    # Run database migrations if needed
    if [ -d "$APP_DIR/backend-node" ] && [ "$FRONTEND_ONLY" -eq 0 ]; then
        log "📊 Running database migrations..."
        cd "$APP_DIR/backend-node"
        sudo -u "$DEPLOY_USER" npm run migrate || true
    fi
    
    # Build frontend
    if [ -d "$APP_DIR/glasscode/frontend" ]; then
        log "🏗️  Building frontend..."
        cd "$APP_DIR/glasscode/frontend"
        if [ "$SKIP_LINT" -eq 0 ]; then
            log "🔍 Running lint checks..."
            sudo -u "$DEPLOY_USER" npm run lint || true
        fi
        if [ "$SKIP_TYPECHECK" -eq 0 ]; then
            log "🔍 Running TypeScript checks..."
            sudo -u "$DEPLOY_USER" npm run typecheck || true
        fi
        log "🏗️  Building frontend application..."
        sudo -u "$DEPLOY_USER" npm run build
    fi
    
    # Restart services
    log "🔄 Restarting services..."
    systemctl restart ${APP_NAME}-backend ${APP_NAME}-frontend 2>/dev/null || true
    
    # Wait for services to start
    if [ "$FRONTEND_ONLY" -eq 0 ]; then
        if ! wait_for_service "${APP_NAME}-backend"; then
            log "❌ Backend failed to start, rolling back..."
            rollback
            exit 1
        fi
    fi
    
    if ! wait_for_service "${APP_NAME}-frontend"; then
        log "❌ Frontend failed to start, rolling back..."
        rollback
        exit 1
    fi
    
    # Run health checks
    if [ "$SKIP_BACKEND_HEALTH" -eq 0 ] && [ "$FRONTEND_ONLY" -eq 0 ]; then
        log "🩺 Running backend health checks..."
        sleep 5  # Give backend time to fully initialize
        if ! timeout 30 curl -s http://localhost:8080/health | grep -q '"success":true'; then
            log "❌ Backend health check failed, rolling back..."
            rollback
            exit 1
        fi
        log "✅ Backend health check passed"
    fi
    
    log "🔍 Running frontend health checks..."
    sleep 5  # Give frontend time to fully initialize
    if ! timeout 30 curl -s http://localhost:$FRONTEND_PORT | grep -q '<html'; then
        log "❌ Frontend health check failed, rolling back..."
        rollback
        exit 1
    fi
    log "✅ Frontend health check passed"
    
    log "✅ Update completed successfully!"
}

# Run main function
main "$@"