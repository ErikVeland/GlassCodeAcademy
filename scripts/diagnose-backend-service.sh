#!/usr/bin/env bash

# Diagnostic script for backend service startup issues

set -euo pipefail

# Load environment
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

echo "🔍 Diagnostic: Backend Service Startup Issues"
echo "============================================"

echo "1. Checking required files..."
if [ -f "$APP_DIR/apps/api/server.js" ]; then
    echo "✅ server.js exists"
else
    echo "❌ server.js not found at $APP_DIR/apps/api/server.js"
    exit 1
fi

if [ -f "$APP_DIR/apps/api/.env.production" ]; then
    echo "✅ .env.production exists"
else
    echo "❌ .env.production not found at $APP_DIR/apps/api/.env.production"
    exit 1
fi

echo ""
echo "2. Checking environment variables..."
echo "   APP_DIR: $APP_DIR"
echo "   DEPLOY_USER: $DEPLOY_USER"
echo "   BACKEND_PORT: ${BACKEND_PORT:-8080}"

echo ""
echo "3. Checking port availability..."
if command -v ss >/dev/null 2>&1; then
    if ss -tulpn 2>/dev/null | grep -q ":${BACKEND_PORT:-8080}"; then
        echo "⚠️  Port ${BACKEND_PORT:-8080} is in use"
        PORT_PIDS=$(ss -tulpn 2>/dev/null | sed -n "s/.*:${BACKEND_PORT:-8080}.*pid=\([0-9]\+\).*/\1/p" | sort -u | tr '\n' ' ')
        echo "   PIDs using port: $PORT_PIDS"
    else
        echo "✅ Port ${BACKEND_PORT:-8080} is free"
    fi
else
    echo "⚠️  ss command not available"
fi

echo ""
echo "4. Testing manual startup..."
cd "$APP_DIR/apps/api"
echo "   Current directory: $(pwd)"
echo "   Environment file contents:"
grep -E "^(PORT|NODE_ENV|DATABASE_URL)=" .env.production || echo "   No matching env vars found"

echo ""
echo "   Attempting to start server manually..."
timeout 10 sudo -u "$DEPLOY_USER" PORT=${BACKEND_PORT:-8080} NODE_ENV=production /usr/bin/node server.js 2>&1 &
MANUAL_PID=$!
sleep 5

if kill -0 $MANUAL_PID 2>/dev/null; then
    echo "✅ Manual start successful - service is running with PID $MANUAL_PID"
    kill $MANUAL_PID 2>/dev/null || true
else
    echo "❌ Manual start failed"
    # Check exit code
    wait $MANUAL_PID 2>/dev/null
    EXIT_CODE=$?
    echo "   Exit code: $EXIT_CODE"
fi

echo ""
echo "5. Checking systemd service status..."
systemctl status glasscode-backend --no-pager || true

echo ""
echo "6. Checking systemd service logs..."
journalctl -u glasscode-backend -n 20 --no-pager || true

echo ""
echo "7. Validating service file..."
if command -v systemd-analyze >/dev/null 2>&1; then
    systemd-analyze verify /etc/systemd/system/glasscode-backend.service || true
else
    echo "⚠️  systemd-analyze not available"
fi

echo ""
echo "✅ Diagnostic complete"