#!/usr/bin/env bash
set -euo pipefail

### Load configuration from .env file ###
# Use relative path instead of hardcoded absolute path
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

echo "🔄 Update Script for $APP_NAME"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

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
    local max_attempts=30  # Increased from 15 to 30 for more patience
    local attempt=1
    
    log "⏳ Waiting for $service_name to start..."
    while [ $attempt -le $max_attempts ]; do
        if is_service_running "$service_name"; then
            log "✅ $service_name is running"
            return 0
        fi
        log "⏰ Attempt $attempt/$max_attempts: $service_name not ready yet, waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    log "❌ ERROR: $service_name failed to start within timeout"
    return 1
}

update_global_json() {
    local dotnet_version=$1
    local global_json_path="$APP_DIR/global.json"
    log "📝 Updating global.json with .NET SDK version: $dotnet_version"
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
    log "⏪ Rolling back to previous version..."
    if [ -n "${BACKUP_DIR:-}" ] && [ -d "$BACKUP_DIR" ]; then
        # Stop services before rollback
        log "⏹️  Stopping services..."
        systemctl stop ${APP_NAME}-frontend ${APP_NAME}-dotnet 2>/dev/null || true
        
        # Remove current application content but preserve the directory structure
        log "🗑️  Removing current application content..."
        if [ -d "$APP_DIR" ]; then
            # Remove all contents but keep the directory
            rm -rf "$APP_DIR"/*
        else
            # Recreate the directory if it doesn't exist
            mkdir -p "$APP_DIR"
        fi
        
        # Restore from backup
        log "🔄 Restoring from backup..."
        if cp -r "$BACKUP_DIR"/* "$APP_DIR"/; then
            # Restore ownership
            chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
            
            # Restart services
            log "🚀 Restarting services from backup..."
            systemctl daemon-reload
            systemctl restart ${APP_NAME}-dotnet ${APP_NAME}-frontend 2>/dev/null || true
            
            log "✅ Rollback complete. Services restarted from backup."
        else
            log "❌ ERROR: Failed to restore from backup!"
        fi
    else
        log "❌ No valid backup found — rollback not possible!"
    fi
    exit 1
}

trap 'rollback' ERR INT TERM

### 1. Preconditions
if [ ! -d "$APP_DIR" ]; then
    log "❌ ERROR: App dir $APP_DIR missing"
    exit 1
fi
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "❌ ERROR: Deploy user $DEPLOY_USER missing"
    exit 1
fi

### 2. Stop services
log "⏹️  Stopping services..."
systemctl stop ${APP_NAME}-frontend ${APP_NAME}-dotnet 2>/dev/null || true
log "✅ Services stopped"

### 3. Backup
BACKUP_DIR="/srv/academy-backup-$(date +%Y%m%d-%H%M%S)"
# Ensure backup directory parent exists
mkdir -p "$(dirname "$BACKUP_DIR")"
cp -r "$APP_DIR" "$BACKUP_DIR"
log "💾 Backup created at $BACKUP_DIR"

### 4. Update repo
cd "$APP_DIR"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "🔍 Current branch: $CURRENT_BRANCH"
sudo -u "$DEPLOY_USER" git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)
if [ "$LOCAL" != "$REMOTE" ]; then
    log "📥 Updating code..."
    sudo -u "$DEPLOY_USER" git reset --hard origin/$CURRENT_BRANCH
    log "✅ Code updated"
else
    log "✅ Repo already up to date"
fi

### 5. Sync .NET SDK version
if command -v dotnet >/dev/null; then
    DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
    update_global_json "$DOTNET_SDK_VERSION"
    log "✅ .NET SDK version synced"
fi

### 6. Validate Content
log "🔍 Validating content..."
cd "$APP_DIR"
if [ -f "scripts/validate-content.js" ]; then
    if node scripts/validate-content.js; then
        log "✅ Content validation passed"
    else
        log "❌ ERROR: Content validation failed"
        rollback
    fi
else
    log "⚠️  Validation script not found, skipping content validation"
fi

### 7. Build Backend
log "🏗️  Updating .NET backend..."
cd "$APP_DIR/glasscode/backend"

if ! sudo -u "$DEPLOY_USER" dotnet restore; then
    log "❌ ERROR: Failed to restore .NET dependencies"
    exit 1
fi
log "✅ .NET dependencies restored"

log "📦 Publishing .NET backend..."
if ! sudo -u "$DEPLOY_USER" dotnet publish -c Release -o "$APP_DIR/glasscode/backend/out"; then
    log "❌ ERROR: Failed to publish .NET backend"
    exit 1
fi
log "✅ .NET backend published"

### 8. Start Backend BEFORE Frontend Build
log "🚀 Starting backend service (pre-build)..."
systemctl restart ${APP_NAME}-dotnet
if ! wait_for_service "${APP_NAME}-dotnet"; then
    log "❌ Backend failed to start before frontend build"
    rollback
fi

log "⏳ Verifying backend health before frontend build..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=5
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
        BACKEND_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [[ "$BACKEND_STATUS" == "healthy" ]]; then
            draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  "
            printf "\n"
            log "✅ Backend healthy. Proceeding to build frontend."
            break
        else
            draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  "
            printf "\n"
            log "⚠️  Backend responding but status is $BACKEND_STATUS"
            break
        fi
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Backend health: "
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done
printf "\n" 2>/dev/null || true

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    log "❌ Backend failed to become healthy before frontend build."
    log "🧪 Diagnostic: systemd status"
    systemctl status ${APP_NAME}-dotnet --no-pager || true
    log "🧪 Diagnostic: recent logs"
    journalctl -u ${APP_NAME}-dotnet -n 100 --no-pager || true
    log "🧪 Diagnostic: port check"
    ss -tulpn | grep :8080 || true
    log "🧪 Diagnostic: health curl"
    curl -v http://localhost:8080/api/health || true
    rollback
fi

### 9. Build Frontend
log "🎨 Building Next.js frontend..."
cd "$APP_DIR/glasscode/frontend"

# Use npm ci if package-lock.json exists, otherwise use npm install
if [ -f "package-lock.json" ]; then
    log "📦 Using npm ci (package-lock.json found)"
    sudo -u "$DEPLOY_USER" npm ci
else
    log "⚠️  package-lock.json not found, using npm install"
    sudo -u "$DEPLOY_USER" npm install
fi

cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
NODE_ENV=production
EOF
sudo -u "$DEPLOY_USER" npm run build
log "✅ Frontend built"

### 10. Restart services in proper order
log "🔄 Restarting services..."
systemctl daemon-reload

# Start backend first and wait for it to be ready
log "🚀 Starting backend service..."
systemctl restart ${APP_NAME}-dotnet
if ! wait_for_service "${APP_NAME}-dotnet"; then
    log "❌ Backend failed to start, rolling back..."
    rollback
fi

# Wait for backend to be fully ready by polling the health check endpoint
log "⏳ Waiting for backend to be fully loaded and healthy..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=5
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
        BACKEND_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [[ "$BACKEND_STATUS" == "healthy" ]]; then
            # Finish progress bar line
            draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  "
            printf "\n"
            log "✅ Backend is fully loaded and healthy!"
            break
        else
            draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  "
            printf "\n"
            log "⚠️  Backend is responding but status is $BACKEND_STATUS"
            break
        fi
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Backend health: "
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

# Ensure the progress line is terminated
printf "\n" 2>/dev/null || true

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    log "❌ Backend failed to become healthy within the expected time."

    # Verbose diagnostics before rollback
    log "🧪 Diagnostic: Checking backend service status"
    systemctl status ${APP_NAME}-dotnet --no-pager || true

    log "🧪 Diagnostic: Recent backend logs"
    journalctl -u ${APP_NAME}-dotnet -n 100 --no-pager || true

    log "🧪 Diagnostic: Listening ports (expect 0.0.0.0:8080)"
    ss -tulpn | grep :8080 || true

    log "🧪 Diagnostic: Health endpoint verbose curl"
    curl -v http://localhost:8080/api/health || true

    log "❌ Rolling back due to backend health check failure..."
    rollback
fi

# Small additional delay to ensure backend is completely ready
log "⏰ Waiting for backend to fully initialize..."
sleep 10

# Now start frontend
log "🚀 Starting frontend service..."
systemctl restart ${APP_NAME}-frontend
if ! wait_for_service "${APP_NAME}-frontend"; then
    log "❌ Frontend failed to start, rolling back..."
    rollback
fi

log "✅ Services restarted"

### 10. Health checks
log "🩺 Performing comprehensive health checks..."

# Check backend GraphQL endpoint
log "🔍 Checking backend GraphQL endpoint..."
if curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
    log "✅ Backend GraphQL endpoint: PASSED"
else
    log "❌ Backend GraphQL endpoint: FAILED"
    rollback
fi

# Check backend health endpoint details
log "🔍 Checking backend health details..."
BACKEND_HEALTH_CHECK=$(curl -s http://localhost:8080/api/health)
BACKEND_STATUS=$(echo "$BACKEND_HEALTH_CHECK" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [[ "$BACKEND_STATUS" == "healthy" ]]; then
    log "✅ Backend health status: HEALTHY"
else
    log "⚠️  Backend health status: $BACKEND_STATUS"
    # Only rollback if status is not healthy
    if [[ "$BACKEND_STATUS" != "healthy" ]]; then
        log "❌ Rolling back due to backend health status..."
        rollback
    fi
fi

# Check frontend availability
log "🔍 Checking frontend availability..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "✅ Frontend availability: PASSED"
else
    log "❌ Frontend availability: FAILED"
    rollback
fi

# Check frontend content (registry.json)
log "🔍 Checking frontend content..."
if curl -s http://localhost:3000/registry.json | grep -q 'modules'; then
    log "✅ Frontend content availability: PASSED"
else
    log "❌ Frontend content availability: FAILED"
    rollback
fi

nginx -t && systemctl reload nginx

trap - ERR

log "🎉 Update Complete!"
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend)"
log "✅ Application updated successfully!"