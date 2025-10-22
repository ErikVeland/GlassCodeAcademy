#!/usr/bin/env bash
set -euo pipefail

# GlassCode Academy Bootstrap Script
# This script sets up the complete GlassCode Academy environment on a fresh Ubuntu/Debian system
# It handles both backend (.NET) and frontend (Next.js) setup with proper systemd services
#
# SMART VALIDATION APPROACH:
# - Backend: Quick compilation check before expensive clean/rebuild
# - Frontend: Validates existing build artifacts and runs lint/typecheck before full rebuild
# - Only performs expensive operations (cache clearing, full builds) when errors are detected
# - Significantly reduces bootstrap time when code is already in good state

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

# Generate a random secret with multiple fallbacks
generate_secret() {
    if command_exists openssl; then
        openssl rand -hex 32 && return 0
    fi
    if command_exists node; then
        node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))' && return 0
    fi
    if command_exists python3; then
        python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
        return 0
    fi
    # Fallback to alphanumeric from /dev/urandom
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
}

# Parse CLI flags and set mode/port
# Defaults: frontend + backend, port 3000 unless overridden
log "🔐 Checking authentication secrets..."
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
    log "⚠️  WARNING: NEXTAUTH_SECRET is missing; generating a temporary secret to avoid install failure."
    NEXTAUTH_SECRET="$(generate_secret || echo 'temporary-nextauth-secret-change-me')"
    log "ℹ️  Temporary NEXTAUTH_SECRET set; update $ENV_FILE with a permanent, strong value."
fi
if [ -z "${NEXTAUTH_URL:-}" ]; then
    NEXTAUTH_URL="https://${DOMAIN}"
    log "⚠️  WARNING: NEXTAUTH_URL missing; defaulting to ${NEXTAUTH_URL}"
fi
# Provider IDs/secrets warnings (non-fatal)
[ -z "${GOOGLE_CLIENT_ID:-}" ] && log "⚠️  WARNING: GOOGLE_CLIENT_ID missing; Google login disabled."
[ -z "${GOOGLE_CLIENT_SECRET:-}" ] && log "⚠️  WARNING: GOOGLE_CLIENT_SECRET missing; Google login disabled."
[ -z "${GITHUB_ID:-}" ] && log "⚠️  WARNING: GITHUB_ID missing; GitHub login disabled."
[ -z "${GITHUB_SECRET:-}" ] && log "⚠️  WARNING: GITHUB_SECRET missing; GitHub login disabled."
[ -z "${APPLE_CLIENT_ID:-}" ] && log "⚠️  WARNING: APPLE_CLIENT_ID missing; Apple login disabled."
[ -z "${APPLE_CLIENT_SECRET:-}" ] && log "⚠️  WARNING: APPLE_CLIENT_SECRET missing; Apple login disabled."

FRONTEND_ONLY=0
FRONTEND_PORT="${PORT:-3000}"
FAST_MODE=0
SKIP_BACKEND_HEALTH=0
SKIP_LINT=0
SKIP_TYPECHECK=0
SKIP_CONTENT_VERIFICATION=0
VALIDATE_JSON_CONTENT=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        --frontend-only)
            FRONTEND_ONLY=1
            shift
            ;;
        --fast)
            FAST_MODE=1
            shift
            ;;
        --skip-backend-health)
            SKIP_BACKEND_HEALTH=1
            shift
            ;;
        --skip-lint)
            SKIP_LINT=1
            shift
            ;;
        --skip-typecheck)
            SKIP_TYPECHECK=1
            shift
            ;;
        --skip-content-verification)
            SKIP_CONTENT_VERIFICATION=1
            shift
            ;;
        --validate-json-content)
            VALIDATE_JSON_CONTENT=1
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
export FRONTEND_ONLY FRONTEND_PORT FAST_MODE SKIP_BACKEND_HEALTH SKIP_LINT SKIP_TYPECHECK SKIP_CONTENT_VERIFICATION VALIDATE_JSON_CONTENT
log "⚙️  Mode: FRONTEND_ONLY=$FRONTEND_ONLY, FAST_MODE=$FAST_MODE, FRONTEND_PORT=$FRONTEND_PORT, SKIP_CONTENT_VERIFICATION=$SKIP_CONTENT_VERIFICATION, VALIDATE_JSON_CONTENT=$VALIDATE_JSON_CONTENT"

# Database configuration defaults (overridable via .env)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-glasscode_dev}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
log "🗄️  DB config: host=${DB_HOST} port=${DB_PORT} name=${DB_NAME} user=${DB_USER}"
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD

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
    REQUIRED_CMDS=(curl git jq unzip zip ss bc)
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
        apt-get install -y curl git jq unzip zip iproute2 bc || true
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

# Function to stop running services like update.sh does
stop_running_services() {
    log "⏹️  Stopping any running services..."
    systemctl stop ${APP_NAME}-frontend ${APP_NAME}-dotnet 2>/dev/null || true
    log "✅ Services stopped"
}

is_service_running() {
    systemctl is-active --quiet "$1"
}

# Function to ensure standalone directory exists and build if missing
ensure_standalone_directory() {
    local frontend_dir="$1"
    local deploy_user="$2"
    
    log "🔍 Checking for Next.js standalone directory..."
    
    if [ ! -d "$frontend_dir/.next/standalone" ] || [ ! -f "$frontend_dir/.next/standalone/server.js" ]; then
        log "⚠️  Standalone directory missing or incomplete, building frontend..."
        
        cd "$frontend_dir"
        
        # Clear any existing incomplete build
        sudo -u "$deploy_user" rm -rf .next || true
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            log "📦 Installing frontend dependencies..."
            sudo -u "$deploy_user" npm install
        fi
        
        # Build the frontend to generate standalone output
        log "🔨 Building frontend to generate standalone directory..."
        if ! sudo -u "$deploy_user" npm run build; then
            log "❌ ERROR: Failed to build frontend for standalone directory"
            exit 1
        fi
        
        # Verify standalone directory was created
        if [ ! -d ".next/standalone" ] || [ ! -f ".next/standalone/server.js" ]; then
            log "❌ ERROR: Standalone directory still missing after build"
            log "🧪 Diagnostic: .next directory contents:"
            ls -la .next/ || true
            exit 1
        fi
        
        log "✅ Standalone directory created successfully"
    else
        log "✅ Standalone directory already exists"
    fi
}

wait_for_service() {
    local service_name=$1
    local max_attempts=60
    local attempt=1
    local sleep_time=2
    local service_failed=false

    # Fast mode: reduce attempts and interval to shorten blocking time
    if [ "${FAST_MODE:-0}" -eq 1 ]; then
        max_attempts=30
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
            return 0
        fi
        # Only log every 5th attempt to reduce noise
        if [ $((attempt % 5)) -eq 0 ] || [ $attempt -eq 1 ]; then
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

# Clean build/publish/temp directories before any installs/builds
pre_install_cleanup() {
    log "🧹 Pre-install cleanup: removing build/publish/temp directories"
    local dirs=(
        "$APP_DIR/node_modules"
        "$APP_DIR/glasscode/frontend/node_modules"
        "$APP_DIR/glasscode/frontend/.next"
        "$APP_DIR/glasscode/frontend/.turbo"
        "$APP_DIR/glasscode/frontend/.cache"
        "$APP_DIR/glasscode/backend/publish"
        "$APP_DIR/glasscode/backend/out"
        "$APP_DIR/glasscode/backend/bin"
        "$APP_DIR/glasscode/backend/obj"
    )
    for d in "${dirs[@]}"; do
        if [ -d "$d" ]; then
            log "🗑️  Removing $d"
            rm -rf "$d" || true
        fi
    done
    log "✅ Pre-install cleanup complete"
}

### 1. Preflight and prerequisites
preflight_checks

log "🔍 Validating prerequisites..."

### 2. Stop any running services (like update.sh does)
stop_running_services

### 3. Create deploy user if not exists
log "👤 Setting up deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "🔧 Creating deploy user..."
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    log "✅ Deploy user created"
else
    log "✅ Deploy user already exists"
fi

### 4. Install base packages
log "📦 Installing base packages..."
apt-get update
apt-get install -y \
    curl gnupg2 ca-certificates lsb-release apt-transport-https \
    build-essential pkg-config unzip zip jq git \
    nginx certbot python3-certbot-nginx ufw fail2ban
log "✅ Base packages installed"

### 4.5 Install and configure PostgreSQL (server)
log "🐘 Installing PostgreSQL server..."
apt-get update
apt-get install -y postgresql postgresql-contrib || {
    log "❌ ERROR: Failed to install PostgreSQL"; exit 1; }

systemctl enable postgresql || true
systemctl start postgresql || true

# Wait for PostgreSQL readiness
MAX=30; COUNT=1
while [ $COUNT -le $MAX ]; do
  if sudo -u postgres psql -tAc "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 2; COUNT=$((COUNT+1))
  [ $((COUNT % 5)) -eq 0 ] && log "⏳ Waiting for PostgreSQL to be ready ($COUNT/$MAX)"
done
if ! sudo -u postgres psql -tAc "SELECT 1" >/dev/null 2>&1; then
  log "❌ ERROR: PostgreSQL did not become ready"; exit 1
fi

# Apply credentials and create database
log "🔑 Ensuring database user and credentials..."
if [ "$DB_USER" = "postgres" ]; then
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';" || true
else
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
      sudo -u postgres psql -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"
fi

log "🗃️  Ensuring database '${DB_NAME}' exists..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb "${DB_NAME}" || {
    log "❌ ERROR: Failed to create database ${DB_NAME}"; exit 1; }

# Ensure localhost TCP password auth is allowed
PG_VER=$(ls -1 /etc/postgresql | sort -r | head -n1)
PG_CONF_DIR="/etc/postgresql/${PG_VER}/main"
if [ -d "$PG_CONF_DIR" ]; then
    sed -i "s/^#\?listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF_DIR/postgresql.conf" || true
    if ! grep -q "^host\s\+all\s\+all\s\+127.0.0.1/32" "$PG_CONF_DIR/pg_hba.conf"; then
        echo "host    all             all             127.0.0.1/32            scram-sha-256" >> "$PG_CONF_DIR/pg_hba.conf"
    fi
    systemctl restart postgresql || true
fi

log "✅ PostgreSQL installed and configured"


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

# Pre-install cleanup to ensure fresh state
pre_install_cleanup

### 8. Update global.json (only if .NET SDK detected)
if [ -n "$DOTNET_SDK_VERSION" ]; then
    update_global_json "$DOTNET_SDK_VERSION"
fi

### 8.1. Check disk space before builds
log "💾 Checking available disk space..."
AVAILABLE_SPACE_GB=$(df "$APP_DIR" | awk 'NR==2 {printf "%.1f", $4/1024/1024}')
REQUIRED_SPACE_GB=5.0
if (( $(echo "$AVAILABLE_SPACE_GB < $REQUIRED_SPACE_GB" | bc -l) )); then
    log "❌ ERROR: Insufficient disk space. Available: ${AVAILABLE_SPACE_GB}GB, Required: ${REQUIRED_SPACE_GB}GB"
    log "💡 Consider cleaning up old builds or expanding disk space"
    exit 1
fi
log "✅ Sufficient disk space available: ${AVAILABLE_SPACE_GB}GB"

### 9. Smart Backend Build (.NET) (skipped in frontend-only mode)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "🏗️  Smart backend build validation..."
    cd "$APP_DIR/glasscode/backend"

    # Quick validation: check if project compiles without full build
    BUILD_REQUIRED=false
    log "🔍 Performing quick compilation check..."
    if ! sudo -u "$DEPLOY_USER" dotnet build --verbosity quiet --nologo >/dev/null 2>&1; then
        log "⚠️  Compilation errors detected, full build required"
        BUILD_REQUIRED=true
    elif [ ! -f "$APP_DIR/glasscode/backend/out/backend.dll" ] || [ ! -f "$APP_DIR/glasscode/backend/out/backend.runtimeconfig.json" ]; then
        log "⚠️  Missing build artifacts, full build required"
        BUILD_REQUIRED=true
    else
        log "✅ Quick compilation check passed, existing artifacts valid"
    fi

    # Only do expensive operations if quick validation failed
    if [ "$BUILD_REQUIRED" = "true" ]; then
        log "🏗️  Performing full backend build and publish..."
        
        # Clear .NET build cache to prevent stale build artifacts
        log "🧹 Clearing .NET build cache..."
        sudo -u "$DEPLOY_USER" dotnet clean || true
        sudo -u "$DEPLOY_USER" rm -rf bin obj out || true
        log "✅ .NET cache cleared"

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

        # Validate backend build artifacts
        log "🔍 Validating backend build artifacts..."
        if [ ! -f "$APP_DIR/glasscode/backend/out/backend.dll" ]; then
            log "❌ ERROR: Missing backend.dll - backend build may have failed"
            exit 1
        fi
        if [ ! -f "$APP_DIR/glasscode/backend/out/backend.runtimeconfig.json" ]; then
            log "❌ ERROR: Missing runtime config - backend publish incomplete"
            exit 1
        fi
        log "✅ Backend build artifacts validated"
    fi

    # Create and start REAL backend service before frontend build
    log "⚙️  Creating backend systemd service (real backend)..."
    log "🔌 Port 8080 preflight: checking for conflicts..."
    # Avoid grep in pipeline under pipefail; parse PIDs with sed directly
    CONFLICT_PIDS=$(ss -tulpn 2>/dev/null | sed -n 's/.*:8080.*pid=\([0-9]\+\).*/\1/p' | sort -u)
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
Environment=ConnectionStrings__DefaultConnection=Host=${DB_HOST:-localhost};Database=${DB_NAME:-glasscode_dev};Username=${DB_USER:-postgres};Password=${DB_PASSWORD:-postgres};Port=${DB_PORT:-5432}

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
MAX_ATTEMPTS=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 15 || echo 30)
ATTEMPT=1
SLEEP_INTERVAL=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
BACKEND_HEALTHY=false
LAST_STATUS=""
    
MIGRATION_TRIGGERED=0
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    # Check if service is still running first
    if ! systemctl is-active --quiet "${APP_NAME}-dotnet"; then
        printf "\n"  # Clear progress line
        log "❌ Backend service stopped unexpectedly during DB readiness check"
        break
    fi

    # Poll DB-backed endpoints for readiness (health endpoint may be insufficient)
    MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
    LESSONS_JSON=$(timeout 10 curl -s http://localhost:8080/api/lessons-db || true)
    QUIZZES_JSON=$(timeout 10 curl -s http://localhost:8080/api/LessonQuiz || true)

    if echo "$MODULES_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1 \
       && echo "$LESSONS_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1 \
       && echo "$QUIZZES_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1; then
        printf "\n"  # Clear progress line
        log "✅ Backend DB endpoints ready with data at attempt $ATTEMPT/$MAX_ATTEMPTS. Proceeding to build frontend."
        BACKEND_HEALTHY=true
        break
    fi

    # Trigger full migration once if arrays are empty
    if [[ $MIGRATION_TRIGGERED -eq 0 ]]; then
        if echo "$MODULES_JSON" | jq -e 'type=="array" and length==0' >/dev/null 2>&1 \
           || echo "$LESSONS_JSON" | jq -e 'type=="array" and length==0' >/dev/null 2>&1 \
           || echo "$QUIZZES_JSON" | jq -e 'type=="array" and length==0' >/dev/null 2>&1; then
            MIGRATION_TRIGGERED=1
            MIGRATION_RESP=$(timeout 60 curl -s -X POST http://localhost:8080/api/migration/full-migration -H "Content-Type: application/json" || true)
            if echo "$MIGRATION_RESP" | grep -q '"Success":\s*true'; then
                log "✅ Full migration triggered successfully"
            else
                SHORT=$(echo "$MIGRATION_RESP" | tr -d '\n' | cut -c1-200)
                log "⚠️  Full migration trigger response: '${SHORT}'"
                log "🔁 Migration API failed/unreachable; invoking CLI fallback with retries..."
                RETRY_MAX=${MIGRATION_CLI_RETRY_MAX:-3}
                RETRY_DELAY_BASE=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
                for RETRY in $(seq 1 "$RETRY_MAX"); do
                    if [ -f "$APP_DIR/glasscode/backend/out/backend.dll" ]; then
                        timeout 300 sudo -u "$DEPLOY_USER" env RUN_AUTOMATED_MIGRATION_ONLY=1 dotnet "$APP_DIR/glasscode/backend/out/backend.dll" || true
                    else
                        (cd "$APP_DIR/glasscode/backend" && timeout 600 sudo -u "$DEPLOY_USER" env RUN_AUTOMATED_MIGRATION_ONLY=1 dotnet run --project "$APP_DIR/glasscode/backend/backend.csproj" || true)
                    fi

                    MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
                    LESSONS_JSON=$(timeout 10 curl -s http://localhost:8080/api/lessons-db || true)
                    QUIZZES_JSON=$(timeout 10 curl -s http://localhost:8080/api/LessonQuiz || true)

                    if echo "$MODULES_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1 \
                       && echo "$LESSONS_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1 \
                       && echo "$QUIZZES_JSON" | jq -e 'type=="array" and length>0' >/dev/null 2>&1 ; then
                        log "✅ CLI migration populated data; DB endpoints ready at attempt $ATTEMPT/$MAX_ATTEMPTS."
                        BACKEND_HEALTHY=true
                        break
                    fi

                    if [ "$RETRY" -lt "$RETRY_MAX" ]; then
                        BACKOFF=$((RETRY_DELAY_BASE * (1 << (RETRY - 1))))
                        log "⏳ CLI migration not reflected yet; retry $RETRY/$RETRY_MAX after ${BACKOFF}s..."
                        sleep "$BACKOFF"
                    else
                        log "❌ CLI migration retries exhausted; continuing checks."
                    fi
                done
            fi
        fi
    fi

    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Backend DB readiness: "
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL

done

if [[ "$BACKEND_HEALTHY" == "true" ]]; then
    log "✅ Backend DB readiness satisfied at attempt $ATTEMPT/$MAX_ATTEMPTS (pre-build)."
fi

if [[ "$BACKEND_HEALTHY" != "true" && $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    log "❌ Backend DB endpoints failed to become ready before frontend build."
    log "🧪 Diagnostic: systemd status"
    systemctl status ${APP_NAME}-dotnet --no-pager || true
    log "🪵 Recent backend logs (journalctl)"
    journalctl -u ${APP_NAME}-dotnet -n 200 --no-pager || true
    log "🔌 Listening ports snapshot"
    ss -tulpn | grep :8080 || true
    log "🌐 DB endpoint verbose output"
    timeout 15 curl -v http://localhost:8080/api/modules-db || true
    timeout 15 curl -v http://localhost:8080/api/lessons-db || true
    timeout 15 curl -v http://localhost:8080/api/LessonQuiz || true
    if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
        log "⚠️  Continuing despite backend DB readiness precondition due to fast/skip mode"
    else
        # Run enhanced content verification script to diagnose issues
        log "🔍 Running enhanced content verification..."
        if [ -f "$APP_DIR/glasscode/backend/Scripts/ContentVerificationReport.cs" ]; then
            cd "$APP_DIR/glasscode/backend"
            timeout 300 sudo -u "$DEPLOY_USER" dotnet run -c Release --no-build --no-restore -- ContentVerificationReport.cs || true
            cd - >/dev/null
        fi
        exit 1
    fi
fi

# Enhanced content verification - only run if needed
if [ "$FRONTEND_ONLY" -eq 0 ] && [ "${SKIP_CONTENT_VERIFICATION:-0}" -ne 1 ]; then
    log "🔍 Running enhanced content verification..."
    
    # Check if we have the verification scripts
    if [ -f "$APP_DIR/glasscode/backend/Scripts/ContentVerificationReport.cs" ]; then
        # Run the content verification report
        cd "$APP_DIR/glasscode/backend"
        
        # Check if dotnet is available
        if command -v dotnet >/dev/null 2>&1; then
            log "📊 Generating content verification report..."
            cd "$APP_DIR/glasscode/backend"
            VERIFICATION_OUTPUT=$(timeout 120 sudo -u "$DEPLOY_USER" dotnet run -c Release --no-build --no-restore -- ContentVerificationReport.cs 2>&1 || true)
            cd - >/dev/null
            echo "$VERIFICATION_OUTPUT"
        else
            log "⚠️  dotnet command not found, skipping enhanced verification"
        fi
        
        cd - >/dev/null
    else
        log "ℹ️  Content verification scripts not found, skipping enhanced verification"
    fi
fi
fi

### 10. Build Frontend (Next.js)
log "🎨 Building frontend..."
cd "$APP_DIR/glasscode/frontend"

# Ensure standalone directory exists
ensure_standalone_directory "$APP_DIR/glasscode/frontend" "$DEPLOY_USER"

# Smart Frontend Build Validation
log "🔍 Performing smart frontend validation..."

# Quick validation: check if existing build is valid
FRONTEND_BUILD_REQUIRED=false
# In fast mode, default to skipping lint/typecheck unless explicitly disabled
SKIP_LINT=${SKIP_LINT:-$FAST_MODE}
SKIP_TYPECHECK=${SKIP_TYPECHECK:-$FAST_MODE}

# Detect presence of dev binaries to avoid npx fetching/hanging in production
HAS_NEXT_BIN=0
HAS_TSC_BIN=0
[ -x "node_modules/.bin/next" ] && HAS_NEXT_BIN=1
[ -x "node_modules/.bin/tsc" ] && HAS_TSC_BIN=1

if [ ! -f ".next/BUILD_ID" ] || [ ! -f ".next/standalone/server.js" ] || [ ! -d ".next/static" ]; then
    log "⚠️  Missing build artifacts, full frontend build required"
    FRONTEND_BUILD_REQUIRED=true
elif [ "${SKIP_LINT}" -ne 1 ]; then
    if [ "$HAS_NEXT_BIN" -eq 1 ]; then
        # Protect against indefinite hangs; suppress output to keep logs clean
        if ! sudo -u "$DEPLOY_USER" timeout 300 node_modules/.bin/next lint --quiet >/dev/null 2>&1; then
            log "⚠️  Linting errors detected or lint timed out, full frontend build required"
            FRONTEND_BUILD_REQUIRED=true
        fi
    else
        log "ℹ️  Skipping lint: devDependencies not installed (next/eslint missing)"
    fi
elif [ "${SKIP_TYPECHECK}" -ne 1 ]; then
    if [ "$HAS_TSC_BIN" -eq 1 ]; then
        # Protect against indefinite hangs; suppress output to keep logs clean
        if ! sudo -u "$DEPLOY_USER" timeout 300 node_modules/.bin/tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
            log "⚠️  TypeScript errors detected or typecheck timed out, full frontend build required"
            FRONTEND_BUILD_REQUIRED=true
        fi
    else
        log "ℹ️  Skipping typecheck: devDependencies not installed (typescript missing)"
    fi
else
    if [ "${SKIP_LINT}" -eq 1 ] || [ "${SKIP_TYPECHECK}" -eq 1 ]; then
        log "✅ Quick validation passed (lint/typecheck skipped in fast/skip mode)"
    else
        log "✅ Quick frontend validation passed, existing build is valid"
    fi
fi

# Only clear caches and rebuild if validation failed
if [ "$FRONTEND_BUILD_REQUIRED" = "true" ]; then
    log "🏗️  Performing full frontend build..."
    
    # Clear Next.js build cache to prevent stale build artifacts
    log "🧹 Clearing Next.js cache..."
    sudo -u "$DEPLOY_USER" rm -rf .next || true
    log "✅ Next.js cache cleared"

    # Clear npm cache to prevent dependency resolution issues
    log "🧹 Clearing npm cache..."
    sudo -u "$DEPLOY_USER" npm cache clean --force || true
    log "✅ npm cache cleared"

    # Function to install npm dependencies efficiently
    install_npm_deps() {
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

    # Install dependencies for all workspaces
    install_npm_deps "$APP_DIR" "root"

    if [ -d "$APP_DIR/scripts" ]; then
        install_npm_deps "$APP_DIR/scripts" "scripts"
    fi

    install_npm_deps "$APP_DIR/glasscode/frontend" "frontend"

    # Set default values for Next.js environment variables if not already set
    if [ -z "${NEXT_PUBLIC_BASE_URL:-}" ]; then
        NEXT_PUBLIC_BASE_URL="https://${DOMAIN}"
        log "ℹ️  Setting NEXT_PUBLIC_BASE_URL to ${NEXT_PUBLIC_BASE_URL}"
    fi
    if [ -z "${NEXT_PUBLIC_API_BASE:-}" ]; then
        NEXT_PUBLIC_API_BASE="https://${DOMAIN}"
        log "ℹ️  Setting NEXT_PUBLIC_API_BASE to ${NEXT_PUBLIC_API_BASE}"
    fi

    # Check if .env.production exists and has required variables
    if [ -f ".env.production" ] && grep -q "NEXTAUTH_SECRET" .env.production && grep -q "NEXT_PUBLIC_API_BASE" .env.production; then
        log "📋 Using existing .env.production file (contains required variables)"
    else
        log "📋 Creating .env.production file..."
        cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
NODE_ENV=production
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GITHUB_ID=${GITHUB_ID:-}
GITHUB_SECRET=${GITHUB_SECRET:-}
APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-}
APPLE_CLIENT_SECRET=${APPLE_CLIENT_SECRET:-}
DEMO_USERS_JSON=${DEMO_USERS_JSON:-}
EOF
    fi
    # Build frontend with timeout and retry mechanism
    log "🔨 Starting frontend build with timeout protection..."
    if ! timeout 900 sudo -u "$DEPLOY_USER" npm run build; then
        log "⚠️  Frontend build timed out or failed, attempting recovery..."
        # Check if it was a timeout or actual failure
        BUILD_EXIT_CODE=$?
        if [ $BUILD_EXIT_CODE -eq 124 ]; then
            log "⚠️  Build timed out after 900 seconds"
        else
            log "⚠️  Build failed with exit code $BUILD_EXIT_CODE"
        fi
        
        # Clear caches and try again with extended timeout
        log "🧹 Clearing all caches for recovery build..."
        sudo -u "$DEPLOY_USER" rm -rf node_modules .next
        sudo -u "$DEPLOY_USER" npm cache clean --force
        sudo -u "$DEPLOY_USER" npm install
        
        log "🔨 Retry build with extended timeout (1200s)..."
        if ! timeout 1200 sudo -u "$DEPLOY_USER" npm run build; then
            log "❌ Frontend build failed after retry with extended timeout"
            exit 1
        fi
    fi
    log "✅ Frontend built"

    # Validate build artifacts
    log "🔍 Validating build artifacts..."
    if [ ! -f ".next/BUILD_ID" ]; then
        log "❌ ERROR: Missing .next/BUILD_ID - frontend build may have failed"
        exit 1
    fi
    if [ ! -f ".next/standalone/server.js" ]; then
        log "❌ ERROR: Missing .next/standalone/server.js - standalone build failed"
        exit 1
    fi
    if [ ! -d ".next/static" ]; then
        log "❌ ERROR: Missing .next/static directory - static assets not generated"
        exit 1
    fi
    log "✅ Build artifacts validated"
fi

# Stage Next.js standalone assets for reliable serving (always needed)
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
log "🔌 Frontend port $FRONTEND_PORT preflight: checking for conflicts..."
# Avoid grep in pipeline under pipefail; parse PIDs with sed directly
FRONTEND_CONFLICT_PIDS=$(ss -tulpn 2>/dev/null | sed -n "s/.*:$FRONTEND_PORT.*pid=\([0-9]\+\).*/\1/p" | sort -u)
if [ -n "$FRONTEND_CONFLICT_PIDS" ]; then
    log "🛑 Killing processes using port $FRONTEND_PORT (PIDs: $FRONTEND_CONFLICT_PIDS)"
    kill -9 $FRONTEND_CONFLICT_PIDS 2>/dev/null || true
    sleep 2
fi
ss -tulpn 2>/dev/null | grep ":$FRONTEND_PORT" || true

### Frontend service (production mode)
# Generate unit with conditional backend gating and Next.js standalone ExecStart
UNIT_FILE_PATH="/etc/systemd/system/${APP_NAME}-frontend.service"

# Prepare backend health check gating script (used in ExecStartPre)
cat >"$APP_DIR/glasscode/frontend/check_backend_health.sh" <<'EOS'
#!/usr/bin/env bash
MAX=30
COUNT=1
while [ $COUNT -le $MAX ]; do
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/health || true)
  RESP=$(timeout 10 curl -s http://127.0.0.1:8080/api/health || true)
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)

  if [ "$HTTP" = "200" ] && { [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ] || [ -n "$RESP" ]; }; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, Status: ${STATUS:-unknown}"
    exit 0
  fi
  sleep 5; COUNT=$((COUNT+1))
done
echo "Backend health check gating failed: http='$HTTP' status='$STATUS' resp='$RESP'"
exit 1
EOS
chmod +x "$APP_DIR/glasscode/frontend/check_backend_health.sh"

if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "⚙️  Writing frontend unit with backend dependency at $UNIT_FILE_PATH"
    cat >"$UNIT_FILE_PATH" <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target ${APP_NAME}-dotnet.service

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend
EnvironmentFile=$APP_DIR/glasscode/frontend/.env.production
ExecStartPre=$APP_DIR/glasscode/frontend/check_backend_health.sh
ExecStart=/usr/bin/node .next/standalone/server.js -p $FRONTEND_PORT
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
else
    log "⚙️  Writing frontend unit (frontend-only mode) at $UNIT_FILE_PATH"
    cat >"$UNIT_FILE_PATH" <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend
EnvironmentFile=$APP_DIR/glasscode/frontend/.env.production
ExecStart=/usr/bin/node .next/standalone/server.js -p $FRONTEND_PORT
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
fi

# Remove ExecStartPre when skipping backend health gating (fast mode or explicitly skipped, or frontend-only)
if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ] || [ "$FRONTEND_ONLY" -eq 1 ]; then
    sed -i '/^ExecStartPre=.*check_backend_health.sh$/d' "$UNIT_FILE_PATH" || true
fi

# Verify the generated unit file when systemd-analyze is available
if command -v systemd-analyze >/dev/null 2>&1; then
    log "🧪 Verifying frontend unit file with systemd-analyze"
    if ! systemd-analyze verify "$UNIT_FILE_PATH"; then
        log "❌ Frontend unit file verification failed"
        exit 1
    fi
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

# Services already stopped by stop_running_services function

# Start services with enhanced error handling and parallel startup
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "▶️  Starting ${APP_NAME}-dotnet..."
    if ! systemctl start "${APP_NAME}-dotnet"; then
        log "❌ Failed to start ${APP_NAME}-dotnet service"
        systemctl status "${APP_NAME}-dotnet" --no-pager || true
        journalctl -u "${APP_NAME}-dotnet" -n 100 --no-pager || true
        exit 1
    fi
    
    # Start backend health check in background
    (
    if wait_for_service "${APP_NAME}-dotnet"; then
        log "✅ ${APP_NAME}-dotnet service is healthy"
    else
        log "❌ ${APP_NAME}-dotnet did not become active within timeout"
        systemctl status "${APP_NAME}-dotnet" --no-pager || true
        journalctl -u "${APP_NAME}-dotnet" -n 50 --no-pager || true
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Continuing despite backend startup failure due to fast/skip mode"
        else
            exit 1
        fi
    fi
) &
BACKEND_HEALTH_PID=$!
fi

log "▶️  Starting ${APP_NAME}-frontend..."
if ! systemctl start "${APP_NAME}-frontend"; then
    log "❌ Failed to start ${APP_NAME}-frontend service"
    systemctl status "${APP_NAME}-frontend" --no-pager || true
    journalctl -u "${APP_NAME}-frontend" -n 100 --no-pager || true
    exit 1
fi

# Start frontend health check in background
(
    if wait_for_service "${APP_NAME}-frontend"; then
        log "✅ ${APP_NAME}-frontend service is healthy"
    else
        log "❌ ${APP_NAME}-frontend did not become active within timeout"
        systemctl status "${APP_NAME}-frontend" --no-pager || true
        journalctl -u "${APP_NAME}-frontend" -n 50 --no-pager || true
        if [ "${FAST_MODE:-0}" -eq 1 ]; then
            log "⚠️  Continuing despite frontend startup failure due to fast mode"
        else
            exit 1
        fi
    fi
) &
FRONTEND_HEALTH_PID=$!

# Wait for health checks to complete
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
        wait $BACKEND_HEALTH_PID || true
    else
        wait $BACKEND_HEALTH_PID
    fi
fi
if [ "${FAST_MODE:-0}" -eq 1 ]; then
    wait $FRONTEND_HEALTH_PID || true
else
    wait $FRONTEND_HEALTH_PID
fi

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
if [ "${FAST_MODE:-0}" -eq 1 ]; then
    sleep 2
else
    sleep 5
fi

# Backend health
if [ "$FRONTEND_ONLY" -eq 0 ]; then
  if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
      log "ℹ️  Skipping backend health check (fast/skip mode)"
  else
      if timeout 15 curl -s -X POST http://localhost:8080/graphql \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
          log "✅ Backend health check: PASSED"
      else
          log "⚠️  WARNING: Backend health check failed"
      fi
  fi
else
  log "ℹ️  Skipping backend health check (frontend-only mode)"
fi

# Frontend availability
FRONTEND_TIMEOUT=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 5 || echo 10)
if timeout $FRONTEND_TIMEOUT curl -f http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
    log "✅ Frontend health check: PASSED"
else
    log "⚠️  WARNING: Frontend health check failed"
fi

# Database-backed content validation (default)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "🔍 Validating database-backed content end-to-end..."
    MODULES_HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/modules-db || true)
    MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
    if echo "$MODULES_JSON" | jq -e 'type=="array"' >/dev/null 2>&1; then
        if echo "$MODULES_JSON" | jq -e 'length > 0' >/dev/null 2>&1; then
            log "✅ Modules DB endpoint: PASSED"
        else
            log "✅ Modules DB endpoint: PASSED (empty array)"
        fi
        SLUG=$(echo "$MODULES_JSON" | grep -o '"slug":"[^"]*"' | head -n1 | sed -E 's/.*"slug":"([^"]*)".*/\1/' || true)
        [ -z "${SLUG:-}" ] && SLUG=$(echo "$MODULES_JSON" | grep -o '"Slug":"[^"]*"' | head -n1 | sed -E 's/.*"Slug":"([^"]*)".*/\1/' || true)
        [ -z "${SLUG:-}" ] && SLUG="programming-fundamentals"
    else
        SHORT=$(echo "$MODULES_JSON" | tr -d '\n' | cut -c1-200)
        log "⚠️  WARNING: Modules DB endpoint failed (http=$MODULES_HTTP, resp='${SHORT}')"
        systemctl is-active ${APP_NAME}-dotnet >/dev/null 2>&1 || systemctl status ${APP_NAME}-dotnet --no-pager | tail -n 20 || true
        SLUG="programming-fundamentals"
    fi

    LESSONS_HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/lessons-db || true)
    LESSONS_JSON=$(timeout 10 curl -s http://localhost:8080/api/lessons-db || true)
    if echo "$LESSONS_JSON" | jq -e 'type=="array"' >/dev/null 2>&1; then
        log "✅ Lessons DB endpoint: PASSED"
    else
        SHORT=$(echo "$LESSONS_JSON" | tr -d '\n' | cut -c1-200)
        log "⚠️  WARNING: Lessons DB endpoint failed (http=$LESSONS_HTTP, resp='${SHORT}')"
    fi

    QUIZZES_HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/LessonQuiz || true)
    QUIZZES_JSON=$(timeout 10 curl -s http://localhost:8080/api/LessonQuiz || true)
    if echo "$QUIZZES_JSON" | jq -e 'type=="array"' >/dev/null 2>&1; then
        log "✅ LessonQuiz DB endpoint: PASSED"
    else
        SHORT=$(echo "$QUIZZES_JSON" | tr -d '\n' | cut -c1-200)
        log "⚠️  WARNING: LessonQuiz DB endpoint failed (http=$QUIZZES_HTTP, resp='${SHORT}')"
    fi

    QUIZ_RESP=$(timeout 10 curl -s "http://localhost:$FRONTEND_PORT/api/content/quizzes/${SLUG:-programming-fundamentals}" || true)
    if echo "$QUIZ_RESP" | grep -q '"questions":\s*\['; then
        log "✅ Frontend DB quiz for '${SLUG:-programming-fundamentals}': PASSED"
    else
        log "⚠️  WARNING: Frontend DB quiz for '${SLUG:-programming-fundamentals}' failed"
    fi
fi

# Optional JSON content validation (registry)
if [ "${VALIDATE_JSON_CONTENT:-0}" -eq 1 ]; then
    log "🔍 Validating JSON content (optional flag enabled)..."
    RESP=$(timeout 10 curl -s http://localhost:$FRONTEND_PORT/api/content/registry || true)
    if echo "$RESP" | grep -q '"modules"'; then
        log "✅ Frontend JSON content: PASSED (api/content/registry)"
    else
        STATIC_RESP=$(timeout 10 curl -s http://localhost:$FRONTEND_PORT/registry.json || true)
        if echo "$STATIC_RESP" | grep -q '"modules"'; then
            log "✅ Frontend JSON content: PASSED (registry.json)"
        else
            log "⚠️  WARNING: Frontend JSON content validation failed"
        fi
    fi
else
    log "ℹ️  Skipping JSON content validation (not enabled)"
fi

log "🎉 Deployment Complete!"
log "🔗 Visit https://$DOMAIN"
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend)"