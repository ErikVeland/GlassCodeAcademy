#!/usr/bin/env bash
set -euo pipefail

### Load configuration from .env file ###
# Use relative path instead of hardcoded absolute path
ENV_FILE="./.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo "Loaded configuration from $ENV_FILE"
else
    echo "WARNING: Configuration file $ENV_FILE not found, using defaults"
    
    APP_NAME="glasscode"
    DEPLOY_USER="deploy"
    APP_DIR="/srv/academy"
    DOMAIN="glasscode.academy"
fi

echo "=== Update Script for $APP_NAME ==="

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

is_service_running() {
    systemctl is-active --quiet "$1"
}

wait_for_service() {
    local service_name=$1
    local max_attempts=15
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if is_service_running "$service_name"; then
            log "$service_name is running"
            return 0
        fi
        log "Attempt $attempt/$max_attempts: waiting 5s..."
        sleep 5
        attempt=$((attempt + 1))
    done
    log "ERROR: $service_name failed to start"
    return 1
}

update_global_json() {
    local dotnet_version=$1
    local global_json_path="$APP_DIR/global.json"
    log "Updating global.json with .NET SDK version: $dotnet_version"
    cat > "$global_json_path" <<EOF
{
  "sdk": {
    "version": "$dotnet_version",
    "rollForward": "latestFeature"
  }
}
EOF
}

rollback() {
    log "⚠️  Rolling back to previous version..."
    if [ -n "${BACKUP_DIR:-}" ] && [ -d "$BACKUP_DIR" ]; then
        rm -rf "$APP_DIR"
        mv "$BACKUP_DIR" "$APP_DIR"
        chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
        systemctl daemon-reload
        systemctl restart ${APP_NAME}-dotnet ${APP_NAME}-frontend || true
        log "Rollback complete. Services restarted from backup."
    else
        log "No valid backup found — rollback not possible!"
    fi
    exit 1
}

trap rollback ERR

### 1. Preconditions
if [ ! -d "$APP_DIR" ]; then
    log "ERROR: App dir $APP_DIR missing"
    exit 1
fi
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "ERROR: Deploy user $DEPLOY_USER missing"
    exit 1
fi

### 2. Stop services
log "Stopping services..."
systemctl stop ${APP_NAME}-frontend ${APP_NAME}-dotnet 2>/dev/null || true

### 3. Backup
BACKUP_DIR="/srv/academy-backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$APP_DIR" "$BACKUP_DIR"
log "Backup created at $BACKUP_DIR"

### 4. Update repo
cd "$APP_DIR"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: $CURRENT_BRANCH"
sudo -u "$DEPLOY_USER" git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)
if [ "$LOCAL" != "$REMOTE" ]; then
    log "Updating code..."
    sudo -u "$DEPLOY_USER" git reset --hard origin/$CURRENT_BRANCH
else
    log "Repo already up to date"
fi

### 5. Sync .NET SDK version
if command -v dotnet >/dev/null; then
    DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
    update_global_json "$DOTNET_SDK_VERSION"
fi

### 6. Build Backend
log "Updating .NET backend..."
cd "$APP_DIR/glasscode/backend"

if ! sudo -u "$DEPLOY_USER" dotnet restore; then
    log "ERROR: Failed to restore .NET dependencies"
    exit 1
fi

log "Publishing .NET backend..."
if ! sudo -u "$DEPLOY_USER" dotnet publish -c Release -o "$APP_DIR/glasscode/backend/out"; then
    log "ERROR: Failed to publish .NET backend"
    exit 1
fi

### 7. Build Frontend
log "Building Next.js frontend..."
cd "$APP_DIR/glasscode/frontend"
sudo -u "$DEPLOY_USER" npm ci
cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
NODE_ENV=production
EOF
sudo -u "$DEPLOY_USER" npm run build

### 8. Restart services
systemctl daemon-reload
systemctl restart ${APP_NAME}-dotnet
wait_for_service "${APP_NAME}-dotnet"
systemctl restart ${APP_NAME}-frontend
wait_for_service "${APP_NAME}-frontend"

### 9. Health checks
log "Checking backend..."
if curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
    log "Backend health check: PASSED"
else
    log "WARNING: Backend health check failed"
    rollback
fi

log "Checking frontend..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "Frontend health check: PASSED"
else
    log "WARNING: Frontend health check failed"
    rollback
fi

nginx -t && systemctl reload nginx

trap - ERR

log "=== Update Complete! ==="
log "Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "Frontend: $(systemctl is-active ${APP_NAME}-frontend)"
log "Application updated successfully!"