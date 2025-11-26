#!/usr/bin/env bash

# Recovery script for backend service issues

set -euo pipefail

echo "🔄 Recovery: Backend Service Issues"
echo "==================================="

# Stop any running services
echo "⏹️  Stopping any running services..."
systemctl stop glasscode-backend glasscode-frontend 2>/dev/null || true

# Kill any processes using the backend port
echo "🧹 Cleaning up port usage..."
if command -v ss >/dev/null 2>&1; then
    PORT_PIDS=$(ss -tulpn 2>/dev/null | sed -n "s/.*:8080.*pid=\([0-9]\+\).*/\1/p" | sort -u | tr '\n' ' ')
    if [ -n "$PORT_PIDS" ]; then
        echo "🛑 Killing processes using port 8080 (PIDs: $PORT_PIDS)"
        kill -TERM $PORT_PIDS 2>/dev/null || true
        sleep 2
        # Force kill if still running
        kill -KILL $PORT_PIDS 2>/dev/null || true
    fi
fi

# Validate environment files
echo "🔍 Validating environment files..."
ENV_FILE="./.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo "✅ Loaded production configuration from $ENV_FILE"
else
    echo "❌ ERROR: Production configuration file $ENV_FILE not found."
    exit 1
fi

APP_DIR="${APP_DIR:-/srv/academy}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

# Check required files
if [ ! -f "$APP_DIR/apps/api/server.js" ]; then
    echo "❌ ERROR: server.js not found at $APP_DIR/apps/api/server.js"
    exit 1
fi

if [ ! -f "$APP_DIR/apps/api/.env.production" ]; then
    echo "❌ ERROR: .env.production not found at $APP_DIR/apps/api/.env.production"
    exit 1
fi

# Recreate the systemd service file with corrected configuration
echo "🔧 Recreating systemd service file..."
cat >/etc/systemd/system/glasscode-backend.service <<EOF
[Unit]
Description=glasscode Node Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/apps/api
EnvironmentFile=$APP_DIR/apps/api/.env.production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=PORT=8080
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "✅ Enabling backend service..."
systemctl enable glasscode-backend

# Start the service
echo "🚀 Starting backend service..."
if systemctl start glasscode-backend; then
    echo "✅ Backend service started successfully"
else
    echo "❌ Failed to start backend service"
    echo "🧪 Diagnostic information:"
    systemctl status glasscode-backend --no-pager || true
    journalctl -u glasscode-backend -n 50 --no-pager || true
    exit 1
fi

# Wait for service to be active
echo "⏳ Waiting for service to become active..."
MAX_ATTEMPTS=30
ATTEMPT=1
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if systemctl is-active --quiet glasscode-backend; then
        echo "✅ Backend service is active"
        break
    fi
    echo "⏰ Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for service to become active..."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    echo "❌ Backend service failed to become active within timeout"
    exit 1
fi

echo "✅ Recovery complete - backend service is running"