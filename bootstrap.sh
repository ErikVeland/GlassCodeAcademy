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
    
    # Default configuration
    APP_NAME="glasscode"
    DEPLOY_USER="deploy"
    APP_DIR="/srv/academy"
    REPO="git@github.com:ErikVeland/GlassCodeAcademy.git"
    DOMAIN="glasscode.academy"
    EMAIL="erik@veland.au"
fi

echo "🚀 Bootstrap Script for $APP_NAME"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Draw progress bar for waits
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

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

is_service_running() {
    systemctl is-active --quiet "$1"
}

wait_for_service() {
    local service_name=$1
    local max_attempts=30
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
    log "✅ global.json updated successfully"
}

### 1. Validate prerequisites
log "🔍 Validating prerequisites..."
if ! command_exists apt-get; then
    log "❌ ERROR: This script requires a Debian/Ubuntu-based system with apt-get"
    exit 1
fi

### 2. Create deploy user if not exists
log "👤 Setting up deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "🔧 Creating deploy user..."
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    log "✅ Deploy user created"
else
    log "✅ Deploy user already exists"
fi

### 3. Install base packages
log "📦 Installing base packages..."
apt-get update
apt-get install -y \
    curl gnupg2 ca-certificates lsb-release apt-transport-https \
    build-essential pkg-config unzip zip jq git \
    nginx certbot python3-certbot-nginx ufw fail2ban
log "✅ Base packages installed"

### 4. Install Node.js (20 LTS)
log "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
log "✅ Node.js version: $(node --version)"
log "✅ npm version: $(npm --version)"

### 5. Install .NET SDK (try 9, fallback to 8)
log "🔷 Installing .NET..."
curl -sSL https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -o packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm -f packages-microsoft-prod.deb
apt-get update

DOTNET_VERSION=""
if apt-get install -y dotnet-sdk-9.0 aspnetcore-runtime-9.0; then
    DOTNET_VERSION="9.0"
    log "✅ .NET 9.0 installed"
elif apt-get install -y dotnet-sdk-8.0 aspnetcore-runtime-8.0; then
    DOTNET_VERSION="8.0"
    log "✅ .NET 8.0 installed"
else
    log "❌ ERROR: Failed to install .NET SDK"
    exit 1
fi

DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
log "✅ .NET SDK version: $DOTNET_SDK_VERSION"
log "✅ .NET runtime version: $(dotnet --version)"

### 6. Setup directories
log "📂 Setting up directories..."
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
log "✅ Directories set up"

### 7. Clone or update repo
log "📥 Fetching repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    sudo -u "$DEPLOY_USER" git clone "$REPO" "$APP_DIR"
    log "✅ Repository cloned"
else
    cd "$APP_DIR"
    sudo -u "$DEPLOY_USER" git reset --hard
    sudo -u "$DEPLOY_USER" git pull
    log "✅ Repository updated"
fi

### 8. Update global.json
update_global_json "$DOTNET_SDK_VERSION"

### 9. Build & Publish Backend (.NET)
log "🏗️  Building backend..."
cd "$APP_DIR/glasscode/backend"

# Clean + restore dependencies
log "🔧 Restoring .NET dependencies..."
if ! sudo -u "$DEPLOY_USER" dotnet restore; then
    log "❌ ERROR: Failed to restore .NET dependencies"
    exit 1
fi
log "✅ .NET dependencies restored"

# Publish backend to /out
log "📦 Publishing .NET backend..."
if ! sudo -u "$DEPLOY_USER" dotnet publish -c Release -o "$APP_DIR/glasscode/backend/out"; then
    log "❌ ERROR: Failed to publish .NET backend"
    exit 1
fi
log "✅ .NET backend published"

### 10. Build Frontend (Next.js)
log "🎨 Building frontend..."
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

### 11. Create systemd services
log "⚙️  Creating systemd services..."
systemctl stop ${APP_NAME}-dotnet ${APP_NAME}-frontend 2>/dev/null || true

# Create .NET backend service
cat >/etc/systemd/system/${APP_NAME}-dotnet.service <<EOF
[Unit]
Description=$APP_NAME .NET Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/backend/out
ExecStart=/usr/bin/dotnet $APP_DIR/glasscode/backend/out/backend.dll --urls http://0.0.0.0:8080
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (production mode)
cat >/etc/systemd/system/${APP_NAME}-frontend.service <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target ${APP_NAME}-dotnet.service

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend
ExecStartPre=/usr/bin/bash -lc '
  MAX=30; COUNT=1;
  while [ $COUNT -le $MAX ]; do
    RESP=$(curl -s http://127.0.0.1:8080/api/health || true);
    STATUS=$(echo "$RESP" | grep -o '"status":"[^\"]*"' | cut -d'"' -f4);
    if [ "$STATUS" = "healthy" ]; then
      exit 0;
    fi;
    sleep 5; COUNT=$((COUNT+1));
  done;
  echo "Backend health check gating failed: status='$STATUS' resp='$RESP'"; exit 1;
'
ExecStart=/usr/bin/npx next start -p 3000
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}-dotnet ${APP_NAME}-frontend

# Start backend first and wait for it to be ready
log "🚀 Starting backend service..."
systemctl restart ${APP_NAME}-dotnet
if ! wait_for_service "${APP_NAME}-dotnet"; then
    log "❌ Backend failed to start"
    exit 1
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
            log "✅ Backend is fully loaded and healthy!"
            break
        else
            log "⚠️  Backend is responding but status is $BACKEND_STATUS"
            break
        fi
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "Waiting for backend health"; printf "\n"
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    log "❌ Backend failed to become healthy within the expected time."
    log "🔎 Diagnostics: systemd status for backend"
    systemctl status ${APP_NAME}-dotnet --no-pager || true
    log "🪵 Recent backend logs (journalctl)"
    journalctl -u ${APP_NAME}-dotnet -n 200 --no-pager || true
    log "🔌 Listening ports snapshot"
    ss -tulpen | grep -E ':(8080|3000)' || true
    log "🌐 Health endpoint verbose output"
    curl -v http://localhost:8080/api/health || true
    systemctl stop ${APP_NAME}-dotnet 2>/dev/null || true
    exit 1
fi

# Small additional delay to ensure backend is completely ready
log "⏰ Waiting for backend to fully initialize..."
sleep 10

# Now start frontend
log "🚀 Starting frontend service..."
systemctl restart ${APP_NAME}-frontend
if ! wait_for_service "${APP_NAME}-frontend"; then
    log "❌ Frontend failed to start"
    systemctl stop ${APP_NAME}-dotnet 2>/dev/null || true
    exit 1
fi

### 12. Configure Nginx
log "🌐 Configuring Nginx..."
cat >/etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 80;
    server_name $DOMAIN;

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /graphql {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
log "✅ Nginx configured"

### 13. TLS
log "🔒 Setting up TLS..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL || true
log "✅ TLS setup complete"

### 14. Firewall
log "🛡️  Configuring UFW..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
log "✅ UFW configured"

### 15. Health check
log "🩺 Performing health checks..."
sleep 10
if curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
    log "✅ Backend health check: PASSED"
else
    log "⚠️  WARNING: Backend health check failed"
fi

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "✅ Frontend health check: PASSED"
else
    log "⚠️  WARNING: Frontend health check failed"
fi

log "🎉 Deployment Complete!"
log "🔗 Visit https://$DOMAIN"
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend)"