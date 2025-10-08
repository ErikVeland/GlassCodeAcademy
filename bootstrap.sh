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
    REPO="git@github.com:ErikVeland/GlassCodeAcademy.git"
    DOMAIN="glasscode.academy"
    EMAIL="erik@veland.au"
fi

echo "=== Bootstrap Script for $APP_NAME ==="

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
    local max_attempts=30
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
if ! command_exists apt-get; then
    log "ERROR: This script requires a Debian/Ubuntu-based system with apt-get"
    exit 1
fi

### 2. Create deploy user if not exists
log "Setting up deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "Creating deploy user..."
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
else
    log "Deploy user already exists"
fi

### 3. Install base packages
log "Installing base packages..."
apt-get update
apt-get install -y \
    curl gnupg2 ca-certificates lsb-release apt-transport-https \
    build-essential pkg-config unzip zip jq git \
    nginx certbot python3-certbot-nginx ufw fail2ban

### 4. Install Node.js (20 LTS)
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
if ! command_exists node; then
    log "ERROR: Node.js installation failed"
    exit 1
fi

log "Node.js version: $(node --version)"
log "npm version: $(npm --version)"

### 5. Install .NET SDK 9 (fallback to 8 if needed)
log "Installing .NET..."
curl -sSL https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -o packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm -f packages-microsoft-prod.deb
apt-get update

DOTNET_VERSION=""
if apt-get install -y dotnet-sdk-9.0 aspnetcore-runtime-9.0; then
    log "Successfully installed .NET 9.0"
    DOTNET_VERSION="9.0"
elif apt-get install -y dotnet-sdk-8.0 aspnetcore-runtime-8.0; then
    log "Successfully installed .NET 8.0"
    DOTNET_VERSION="8.0"
else
    log "ERROR: Failed to install .NET SDK"
    exit 1
fi

# Verify .NET installation
if ! command_exists dotnet; then
    log "ERROR: .NET installation failed"
    exit 1
fi

# Get the exact .NET SDK version
DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
log ".NET SDK version: $DOTNET_SDK_VERSION"
log ".NET runtime version: $(dotnet --version)"

### 6. Setup directories
log "Setting up directories..."
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

### 7. Clone or update repo
log "Fetching repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    log "Cloning repository..."
    sudo -u "$DEPLOY_USER" git clone "$REPO" "$APP_DIR"
else
    log "Repository exists, updating..."
    cd "$APP_DIR"
    sudo -u "$DEPLOY_USER" git reset --hard
    sudo -u "$DEPLOY_USER" git pull
fi

### 8. Update global.json with current .NET SDK version
log "Updating global.json with current .NET SDK version..."
update_global_json "$DOTNET_SDK_VERSION"

### 9. Build Backend (.NET)
log "Building backend..."
cd "$APP_DIR/glasscode/backend"

# Restore dependencies
log "Restoring .NET dependencies..."
if ! sudo -u "$DEPLOY_USER" dotnet restore; then
    log "ERROR: Failed to restore .NET dependencies"
    exit 1
fi

# Build backend
log "Compiling .NET backend..."
if ! sudo -u "$DEPLOY_USER" dotnet build -c Release; then
    log "ERROR: Failed to build .NET backend"
    exit 1
fi

### 10. Build Frontend (Next.js)
log "Building frontend..."
cd "$APP_DIR/glasscode/frontend"

# Install frontend dependencies
log "Installing Node.js dependencies..."
if ! sudo -u "$DEPLOY_USER" npm ci; then
    log "ERROR: Failed to install Node.js dependencies"
    exit 1
fi

# Create environment files
log "Setting up environment variables..."
cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=https://$DOMAIN
NEXT_PUBLIC_BASE_URL=https://$DOMAIN
NODE_ENV=production
EOF

# Build frontend
log "Compiling Next.js frontend..."
if ! sudo -u "$DEPLOY_USER" npm run build; then
    log "ERROR: Failed to build Next.js frontend"
    exit 1
fi

### 11. Create systemd services
log "Creating systemd services..."

# Stop existing services if they exist
systemctl stop ${APP_NAME}-dotnet ${APP_NAME}-frontend 2>/dev/null || true

# Create .NET backend service
cat >/etc/systemd/system/${APP_NAME}-dotnet.service <<EOF
[Unit]
Description=$APP_NAME .NET Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/backend
ExecStart=/usr/bin/dotnet run --no-build --urls http://0.0.0.0:8080
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

# Create Next.js frontend service
cat >/etc/systemd/system/${APP_NAME}-frontend.service <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target ${APP_NAME}-dotnet.service

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_BASE=https://$DOMAIN
Environment=NEXT_PUBLIC_BASE_URL=https://$DOMAIN

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable ${APP_NAME}-dotnet ${APP_NAME}-frontend

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

### 12. Configure Nginx (www → non-www redirect + reverse proxy)
log "Configuring Nginx..."

# Backup existing config if it exists
if [ -f "/etc/nginx/sites-available/$APP_NAME" ]; then
    cp "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-available/$APP_NAME.backup.$(date +%s)"
fi

# Create Nginx configuration
cat >/etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 80;
    server_name $DOMAIN;

    # Proxy API requests to .NET backend
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    # Proxy GraphQL requests to .NET backend
    location /graphql {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    # Serve static files and frontend from Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

### 13. Enable TLS
log "Setting up TLS..."
if command_exists certbot; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL || true
else
    log "WARNING: certbot not found, skipping TLS setup"
fi

### 14. Firewall rules
log "Configuring UFW..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

### 15. Health check
log "Performing health checks..."

# Check if backend is responding
sleep 10
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

log "=== Deployment Complete! ==="
log "Visit https://$DOMAIN"
log "Backend service status: $(systemctl is-active ${APP_NAME}-dotnet)"
log "Frontend service status: $(systemctl is-active ${APP_NAME}-frontend)"