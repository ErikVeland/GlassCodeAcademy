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

# Parse CLI flags and set mode/port
# Defaults: frontend + backend, port 3000 unless overridden
FRONTEND_ONLY=0
FRONTEND_PORT="${PORT:-3000}"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --frontend-only)
            FRONTEND_ONLY=1
            shift
            ;;
        --port)
            if [[ -n "${2:-}" ]]; then
                FRONTEND_PORT="$2"
                shift 2
            else
                log "⚠️  WARNING: --port flag provided without a value; using default $FRONTEND_PORT"
                shift
            fi
            ;;
        *)
            log "⚠️  WARNING: Unknown argument: $1"
            shift
            ;;
    esac
done
export FRONTEND_ONLY FRONTEND_PORT
log "⚙️  Mode: FRONTEND_ONLY=$FRONTEND_ONLY, FRONTEND_PORT=$FRONTEND_PORT"

# Perform environment preflight checks and install missing base tools
preflight_checks() {
    log "🔍 Running environment preflight checks..."

    # Require root privileges
    if [ "${EUID:-$(id -u)}" -ne 0 ]; then
        log "❌ ERROR: This script must be run as root (use sudo)"
        exit 1
    fi

    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID="$ID"
        OS_VER="$VERSION_ID"
        PRETTY_OS="$PRETTY_NAME"
        log "🖥️  Detected OS: $PRETTY_OS"
        if [ "$OS_ID" != "ubuntu" ] && [ "$OS_ID" != "debian" ]; then
            log "❌ ERROR: Only Debian/Ubuntu systems are supported"
            exit 1
        fi
    else
        log "❌ ERROR: Cannot detect OS (missing /etc/os-release)"
        exit 1
    fi

    # Ensure systemd is available
    if ! command_exists systemctl; then
        log "❌ ERROR: systemd is required on the server"
        exit 1
    fi

    # Ensure apt-get exists
    if ! command_exists apt-get; then
        log "❌ ERROR: This script requires a Debian/Ubuntu-based system with apt-get"
        exit 1
    fi

    # Network reachability (non-fatal warnings)
    if ! curl -fsSL https://deb.nodesource.com/setup_20.x >/dev/null 2>&1; then
        log "⚠️  WARNING: nodesource.com not reachable right now; will retry during installation"
    fi
    if ! curl -fsSL https://packages.microsoft.com >/dev/null 2>&1; then
        log "⚠️  WARNING: packages.microsoft.com not reachable right now; will retry during installation"
    fi

    # Ensure base tools
    REQUIRED_CMDS=(curl git jq unzip zip ss)
    MISSING_PKGS=()
    for cmd in "${REQUIRED_CMDS[@]}"; do
        if ! command_exists "$cmd"; then
            MISSING_PKGS+=("$cmd")
        fi
    done
    if [ "${#MISSING_PKGS[@]}" -gt 0 ]; then
        log "📦 Installing missing base packages: ${MISSING_PKGS[*]}"
        apt-get update
        # Map command names to packages where needed
        apt-get install -y curl git jq unzip zip iproute2 || true
    else
        log "✅ Base packages already present"
    fi

    # Ports check (non-fatal warnings)
    for port in 8080 "$FRONTEND_PORT"; do
        if ss -tulpn 2>/dev/null | grep -q ":$port"; then
            log "⚠️  WARNING: Port $port appears to be in use; services may fail to bind"
        fi
    done

    # Env variables presence (non-fatal warnings)
    REQUIRED_ENV=(APP_NAME DEPLOY_USER APP_DIR DOMAIN EMAIL)
    for var in "${REQUIRED_ENV[@]}"; do
        if [ -z "${!var:-}" ]; then
            log "⚠️  WARNING: Environment variable $var not set; using defaults where applicable"
        fi
    done

    # Flags to control conditional installations
    NEED_NODE=0
    NEED_DOTNET=0
    NODE_VER=$(node --version 2>/dev/null || echo "")
    if [ -z "$NODE_VER" ] || ! echo "$NODE_VER" | grep -qE '^v(20|21)\.'; then
        NEED_NODE=1
    fi
    if ! command_exists dotnet; then
        NEED_DOTNET=1
    fi
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

### 1. Preflight and prerequisites
preflight_checks

log "🔍 Validating prerequisites..."

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

### 4. Install Node.js (20 LTS) if needed
if [ "${NEED_NODE:-0}" -eq 1 ]; then
    log "🟢 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    log "✅ Node.js already present: $(node --version)"
fi
log "✅ npm version: $(npm --version)"

### 5. Install .NET SDK (try 9, fallback to 8) if needed
DOTNET_SDK_VERSION=""
# Skip .NET installation entirely in frontend-only mode
if [ "$FRONTEND_ONLY" -eq 1 ]; then
    NEED_DOTNET=0
fi
if [ "${NEED_DOTNET:-0}" -eq 1 ]; then
    log "🔷 Installing .NET..."
    # Choose Microsoft packages config based on OS
    MS_URL=""
    if [ "${OS_ID}" = "ubuntu" ]; then
        MS_URL="https://packages.microsoft.com/config/ubuntu/${OS_VER}/packages-microsoft-prod.deb"
    elif [ "${OS_ID}" = "debian" ]; then
        MS_URL="https://packages.microsoft.com/config/debian/${OS_VER}/packages-microsoft-prod.deb"
    fi
    curl -sSL "$MS_URL" -o packages-microsoft-prod.deb || true
    if [ -f packages-microsoft-prod.deb ]; then
        dpkg -i packages-microsoft-prod.deb || true
        rm -f packages-microsoft-prod.deb
        apt-get update || true
    fi

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
else
    if command_exists dotnet; then
        log "✅ .NET already present: $(dotnet --version)"
    else
        log "ℹ️  Skipping .NET installation (frontend-only mode)"
    fi
fi

if command_exists dotnet; then
    DOTNET_SDK_VERSION=$(dotnet --list-sdks | head -1 | cut -d ' ' -f 1)
    log "✅ .NET SDK version: $DOTNET_SDK_VERSION"
    log "✅ .NET runtime version: $(dotnet --version)"
else
    DOTNET_SDK_VERSION=""
    log "ℹ️  .NET SDK not present"
fi

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

### 8. Update global.json (only if .NET SDK detected)
if [ -n "$DOTNET_SDK_VERSION" ]; then
    update_global_json "$DOTNET_SDK_VERSION"
fi

### 9. Build & Publish Backend (.NET) (skipped in frontend-only mode)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
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

    # Create and start REAL backend service before frontend build
    log "⚙️  Creating backend systemd service (real backend)..."
    systemctl stop ${APP_NAME}-dotnet 2>/dev/null || true
    log "🔌 Port 8080 preflight: checking for conflicts..."
    CONFLICT_PIDS=$(ss -tulpn 2>/dev/null | grep ':8080' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
    if [ -n "$CONFLICT_PIDS" ]; then
        log "🛑 Killing processes using port 8080 (PIDs: $CONFLICT_PIDS)"
        kill -9 $CONFLICT_PIDS 2>/dev/null || true
        sleep 2
    fi
    ss -tulpn 2>/dev/null | grep ':8080' || true
    cat >/etc/systemd/system/${APP_NAME}-dotnet.service <<EOF
[Unit]
Description=$APP_NAME .NET Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/backend/out
ExecStart=/usr/bin/dotnet $APP_DIR/glasscode/backend/out/backend.dll
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    # Always attempt to unmask backend service before enabling/starting
    systemctl unmask ${APP_NAME}-dotnet || true
    systemctl enable ${APP_NAME}-dotnet

    log "🚀 Starting real backend service..."
    systemctl start ${APP_NAME}-dotnet

    log "⏳ Waiting for real backend health before frontend build..."
    MAX_ATTEMPTS=30
    ATTEMPT=1
    SLEEP_INTERVAL=5
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1; then
            HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/health)
            BACKEND_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            if [[ "$BACKEND_STATUS" == "healthy" ]]; then
                log "✅ Real backend healthy. Proceeding to build frontend."
                break
            else
                log "⚠️  Real backend responding but status is $BACKEND_STATUS"
                break
            fi
        fi
        draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Backend health: "
        ATTEMPT=$((ATTEMPT + 1))
        sleep $SLEEP_INTERVAL
    done

    if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
        log "❌ Real backend failed to become healthy before frontend build."
        log "🧪 Diagnostic: systemd status"
        systemctl status ${APP_NAME}-dotnet --no-pager || true
        log "🪵 Recent backend logs (journalctl)"
        journalctl -u ${APP_NAME}-dotnet -n 200 --no-pager || true
        log "🔌 Listening ports snapshot"
        ss -tulpn | grep :8080 || true
        log "🌐 Health endpoint verbose output"
        curl -v http://localhost:8080/api/health || true
        exit 1
    fi
fi

### 10. Build Frontend (Next.js)
log "🎨 Building frontend..."
cd "$APP_DIR/glasscode/frontend"

# Ensure Node dependencies are installed for root workspace and scripts before frontend build
log "📦 Ensuring root Node dependencies installed..."
cd "$APP_DIR"
if [ -f "package-lock.json" ]; then
    log "📦 Using npm ci in root (package-lock.json found)"
    sudo -u "$DEPLOY_USER" npm ci || sudo -u "$DEPLOY_USER" npm install
else
    log "⚠️  package-lock.json not found in root, using npm install"
    sudo -u "$DEPLOY_USER" npm install
fi

if [ -d "$APP_DIR/scripts" ] && [ -f "$APP_DIR/scripts/package.json" ]; then
    log "📦 Ensuring scripts Node dependencies installed..."
    cd "$APP_DIR/scripts"
    if [ -f "package-lock.json" ]; then
        log "📦 Using npm ci in scripts (package-lock.json found)"
        sudo -u "$DEPLOY_USER" npm ci || sudo -u "$DEPLOY_USER" npm install
    else
        log "⚠️  package-lock.json not found in scripts, using npm install"
        sudo -u "$DEPLOY_USER" npm install
    fi
fi

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

# Stage Next.js standalone assets for reliable serving
log "📦 Staging Next.js standalone assets..."
cd "$APP_DIR/glasscode/frontend"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
rm -rf .next/standalone/public
cp -r public .next/standalone/public 2>/dev/null || true
chown -R "$DEPLOY_USER":"$DEPLOY_USER" .next/standalone || true
log "✅ Standalone assets staged"

### 11. Create systemd services
log "⚙️  Creating systemd services..."
systemctl stop ${APP_NAME}-frontend 2>/dev/null || true
log "🔌 Frontend port $FRONTEND_PORT preflight: checking for conflicts..."
FRONTEND_CONFLICT_PIDS=$(ss -tulpn 2>/dev/null | grep ":$FRONTEND_PORT" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
if [ -n "$FRONTEND_CONFLICT_PIDS" ]; then
    log "🛑 Killing processes using port $FRONTEND_PORT (PIDs: $FRONTEND_CONFLICT_PIDS)"
    kill -9 $FRONTEND_CONFLICT_PIDS 2>/dev/null || true
    sleep 2
fi
ss -tulpn 2>/dev/null | grep ":$FRONTEND_PORT" || true

### Frontend service (production mode)
# Generate unit with conditional backend gating and standalone working directory
if [ "$FRONTEND_ONLY" -eq 0 ]; then
cat >/etc/systemd/system/${APP_NAME}-frontend.service <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target ${APP_NAME}-dotnet.service

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend/.next/standalone
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT
TimeoutStartSec=300
ExecStartPre=/usr/bin/bash -lc '
  MAX=30; COUNT=1;
  while [ \$COUNT -le \$MAX ]; do
    HTTP=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/health || true);
    RESP=\$(curl -s http://127.0.0.1:8080/api/health || true);
    STATUS=\$(echo "\$RESP" | jq -r .status 2>/dev/null || echo "");
    if [ "\$HTTP" = "200" ] && [ "\$STATUS" = "healthy" ]; then
      exit 0;
    fi;
    sleep 5; COUNT=\$((COUNT+1));
  done;
  echo "Backend health check gating failed: http='\$HTTP' status='\$STATUS' resp='\$RESP'"; exit 1;
'
ExecStart=/usr/bin/node server.js -p $FRONTEND_PORT
 

[Install]
WantedBy=multi-user.target
EOF
else
cat >/etc/systemd/system/${APP_NAME}-frontend.service <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend/.next/standalone
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT
TimeoutStartSec=300
ExecStart=/usr/bin/node server.js -p $FRONTEND_PORT

[Install]
WantedBy=multi-user.target
EOF
fi

systemctl daemon-reload
# Always attempt to unmask services to avoid masked-unit failures
systemctl unmask ${APP_NAME}-frontend || true
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    systemctl unmask ${APP_NAME}-dotnet || true
fi
# Unmask services if previously masked
if systemctl is-enabled ${APP_NAME}-frontend 2>/dev/null | grep -q masked; then
    log "⚠️  Frontend service is masked. Unmasking..."
    systemctl unmask ${APP_NAME}-frontend || true
fi
if [ "$FRONTEND_ONLY" -eq 0 ] && systemctl is-enabled ${APP_NAME}-dotnet 2>/dev/null | grep -q masked; then
    log "⚠️  Backend service is masked. Unmasking..."
    systemctl unmask ${APP_NAME}-dotnet || true
fi

if [ "$FRONTEND_ONLY" -eq 0 ]; then
    systemctl enable ${APP_NAME}-dotnet ${APP_NAME}-frontend
else
    systemctl enable ${APP_NAME}-frontend
fi

### 11.1 Start or restart services
log "🚀 Starting services..."
SERVICES_TO_START=()
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    SERVICES_TO_START+=("${APP_NAME}-dotnet")
fi
SERVICES_TO_START+=("${APP_NAME}-frontend")
for svc in "${SERVICES_TO_START[@]}"; do
    if systemctl is-active --quiet "$svc"; then
        log "🔄 $svc already running, restarting..."
        systemctl restart "$svc" || true
    else
        log "▶️  Starting $svc..."
        systemctl start "$svc" || true
    fi
    # Wait for service to become active (best-effort)
    if ! wait_for_service "$svc"; then
        log "⚠️  WARNING: $svc did not become active within timeout"
        systemctl status "$svc" --no-pager || true
        journalctl -u "$svc" -n 100 --no-pager || true
    fi
done

### 12. Configure Nginx
log "🌐 Configuring Nginx..."
if [ "$FRONTEND_ONLY" -eq 1 ]; then
cat >/etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
else
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /graphql {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
fi

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
if [ "$FRONTEND_ONLY" -eq 0 ]; then
  if curl -s -X POST http://localhost:8080/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
      log "✅ Backend health check: PASSED"
  else
      log "⚠️  WARNING: Backend health check failed"
  fi
else
  log "ℹ️  Skipping backend health check (frontend-only mode)"
fi

if curl -f http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
    log "✅ Frontend health check: PASSED"
else
    log "⚠️  WARNING: Frontend health check failed"
fi

log "🎉 Deployment Complete!"
log "🔗 Visit https://$DOMAIN"
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend)"