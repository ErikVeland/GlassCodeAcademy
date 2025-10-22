#!/usr/bin/env bash
# staging-update.sh - Update GlassCode Academy Node.js backend in staging environment

set -euo pipefail

# Configuration
APP_NAME="glasscode-node"
DEPLOY_USER="deploy"
APP_DIR="/srv/academy-node"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if running as root
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    log "❌ ERROR: This script must be run as root (use sudo)"
    exit 1
fi

log "🔄 Starting staging update for $APP_NAME"

# Pull latest changes
log "📥 Pulling latest changes..."
if [ -d "$APP_DIR/.git" ]; then
    sudo -u "$DEPLOY_USER" git -C "$APP_DIR" pull
else
    log "❌ ERROR: Application directory not found or not a git repository"
    exit 1
fi

# Install/update backend dependencies
log "📦 Updating backend dependencies..."
cd "$APP_DIR/backend-node"
sudo -u "$DEPLOY_USER" npm ci --production

# Run database migrations
log "🔄 Running database migrations..."
sudo -u "$DEPLOY_USER" npm run migrate

# Restart backend service
log "🔄 Restarting backend service..."
systemctl restart "$APP_NAME"-backend.service

# Wait for service to restart
log "⏳ Waiting for backend service to restart..."
sleep 5

# Check backend health
if curl -s http://localhost:8080/health | grep -q '"success":true'; then
    log "✅ Backend health check passed"
else
    log "❌ Backend health check failed"
    systemctl status "$APP_NAME"-backend.service --no-pager || true
    journalctl -u "$APP_NAME"-backend.service -n 20 --no-pager || true
    exit 1
fi

log "🎉 Staging update completed successfully!"