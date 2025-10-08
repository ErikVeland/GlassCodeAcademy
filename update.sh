#!/usr/bin/env bash
set -euo pipefail

### Load configuration from .env file ###
ENV_FILE="/Users/veland/GlassCodeAcademy/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo "Loaded configuration from $ENV_FILE"
else
    echo "WARNING: Configuration file $ENV_FILE not found, using defaults"
    
    # Default configuration
    APP_NAME="glasscode"
    DEPLOY_USER="deploy"
    APP_DIR="/srv/academy"
    DOMAIN="glasscode.academy"
fi

echo "=== Update Script for $APP_NAME ==="

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if service is running
is_service_running() {
    systemctl is-active --quiet "$1"
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local max_attempts=15
    local attempt=1
    
    log "Waiting for $service_name to start..."
    while [ $attempt -le $max_attempts ]; do
        if is_service_running "$service_name"; then
            log "$service_name is running"
            return 0
        fi
        log "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log "ERROR: $service_name failed to start within timeout"
    return 1
}

# Function to update global.json with current .NET SDK version
update_global_json() {
    local dotnet_version=$1
    local global_json_path="$APP_DIR/global.json"
    
    log "Updating global.json with .NET SDK version: $dotnet_version"
    
    # Create or update global.json with the current .NET SDK version
    cat > "$global_json_path" <<EOF
{
  "sdk": {
    "version": "$dotnet_version",
    "rollForward": "latestFeature"
  }
}
EOF
    
    log "global.json updated successfully"
}

### 1. Validate prerequisites
log "Validating prerequisites..."
if [ ! -d "$APP_DIR" ]; then
    log "ERROR: Application directory $APP_DIR does not exist"
    exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
    log "ERROR: Deploy user $DEPLOY_USER does not exist"
    exit 1
fi

### 2. Stop services
log "Stopping services..."
systemctl stop ${APP_NAME}-frontend ${APP_NAME}-dotnet 2>/dev/null || true

### 3. Backup current version
log "Creating backup..."
BACKUP_DIR="/srv/academy-backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$APP_DIR" "$BACKUP_DIR"
log "Backup created at $BACKUP_DIR"

### 4. Update repository
log "Updating repository..."
cd "$APP_DIR"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: $CURRENT_BRANCH"

# Fetch latest changes
sudo -u "$DEPLOY_USER" git fetch origin

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)

if [ $LOCAL = $REMOTE ]; then
    log "Repository is already up-to-date"
else
    log "Updating repository..."
    sudo -u "$DEPLOY_USER" git reset --hard origin/$CURRENT_BRANCH
fi

### 5. Update .NET SDK version in global.json
log "Checking .NET SDK version..."
if command_exists dotnet; then
    DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
    log "Current .NET SDK version: $DOTNET_SDK_VERSION"
    update_global_json "$DOTNET_SDK_VERSION"
else
    log "WARNING: .NET SDK not found, skipping global.json update"
fi

### 6. Update dependencies and rebuild
log "Updating dependencies and rebuilding..."

# Backend
log "Updating .NET backend..."
cd "$APP_DIR/glasscode/backend"
if ! sudo -u "$DEPLOY_USER" dotnet restore; then
    log "ERROR: Failed to restore .NET dependencies"
    exit 1
fi

if ! sudo -u "$DEPLOY_USER" dotnet build -c Release; then
    log "ERROR: Failed to build .NET backend"
    exit 1
fi

# Frontend
log "Updating Next.js frontend..."
cd "$APP_DIR/glasscode/frontend"

# Install/update Node.js dependencies
if ! sudo -u "$DEPLOY_USER" npm ci; then
    log "ERROR: Failed to install Node.js dependencies"
    exit 1
fi

# Create/update environment files
log "Setting up environment variables..."
cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=https://$DOMAIN
NEXT_PUBLIC_BASE_URL=https://$DOMAIN
NODE_ENV=production
EOF

# Build frontend
if ! sudo -u "$DEPLOY_USER" npm run build; then
    log "ERROR: Failed to build Next.js frontend"
    exit 1
fi

### 7. Restart services
log "Restarting services..."

# Reload systemd configuration
systemctl daemon-reload

# Start backend first
log "Starting .NET backend service..."
systemctl restart ${APP_NAME}-dotnet

# Wait for backend to be ready
if ! wait_for_service "${APP_NAME}-dotnet"; then
    log "ERROR: Backend service failed to start"
    systemctl status ${APP_NAME}-dotnet
    exit 1
fi

# Start frontend
log "Starting Next.js frontend service..."
systemctl restart ${APP_NAME}-frontend

# Wait for frontend to be ready
if ! wait_for_service "${APP_NAME}-frontend"; then
    log "ERROR: Frontend service failed to start"
    systemctl status ${APP_NAME}-frontend
    exit 1
fi

### 8. Health check
log "Performing health checks..."

# Check if backend is responding
sleep 5
if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
    log "Backend health check: PASSED"
else
    log "WARNING: Backend health check failed"
fi

# Check if frontend is responding
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "Frontend health check: PASSED"
else
    log "WARNING: Frontend health check failed"
fi

# Reload NGINX configuration
nginx -t && systemctl reload nginx

log "=== Update Complete! ==="
log "Backend service status: $(systemctl is-active ${APP_NAME}-dotnet)"
log "Frontend service status: $(systemctl is-active ${APP_NAME}-frontend)"
log "Application updated successfully!"