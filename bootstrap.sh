#!/usr/bin/env bash
set -euo pipefail

# GlassCode Academy Bootstrap Script (Node.js version)
# This script sets up the complete GlassCode Academy environment on a fresh Ubuntu/Debian system
# It handles both backend (Node.js) and frontend (Next.js) setup with proper systemd services

### Load production configuration (.env.production only) ###
ENV_FILE="./.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo "✅ Loaded production configuration from $ENV_FILE"
else
    echo "❌ ERROR: Production configuration file $ENV_FILE not found. This script is for production only."
    echo "Create $ENV_FILE with required keys: APP_NAME, DEPLOY_USER, APP_DIR, REPO, DOMAIN, EMAIL, NEXT_PUBLIC_API_BASE, NEXT_PUBLIC_BASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET."
    exit 1
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

FRONTEND_ONLY=0
FRONTEND_PORT="${PORT:-3000}"
FAST_MODE=0
SKIP_BACKEND_HEALTH=0
SKIP_LINT=0
SKIP_TYPECHECK=0
SKIP_CONTENT_VERIFICATION=0
VALIDATE_JSON_CONTENT=0
ENV_ONLY=0
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
        --env-only)
            ENV_ONLY=1
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
export FRONTEND_ONLY FRONTEND_PORT FAST_MODE SKIP_BACKEND_HEALTH SKIP_LINT SKIP_TYPECHECK SKIP_CONTENT_VERIFICATION VALIDATE_JSON_CONTENT ENV_ONLY
log "⚙️  Mode: FRONTEND_ONLY=$FRONTEND_ONLY, FAST_MODE=$FAST_MODE, FRONTEND_PORT=$FRONTEND_PORT, SKIP_CONTENT_VERIFICATION=$SKIP_CONTENT_VERIFICATION, VALIDATE_JSON_CONTENT=$VALIDATE_JSON_CONTENT, ENV_ONLY=$ENV_ONLY"

# Database configuration defaults (from .env.production)
DB_DIALECT="${DB_DIALECT:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-glasscode_dev}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_SSL="${DB_SSL:-false}"

# Interactive prompts for missing DB settings (prefer existing backend .env.production)
prompt_or_default_backend() {
    local var="$1"; local def="$2"; local label="$3";
    local envpath="${APP_DIR}/backend-node/.env.production"; local existing=""; local current="${!var:-}"; local input="";
    if [ -f "$envpath" ]; then
        existing=$( (grep -E "^${var}=" "$envpath" || true) | tail -n1 | cut -d'=' -f2- | tr -d '\r')
    fi
    local effective="${existing:-$current}"
    if [ -z "$effective" ]; then
        if [ -t 0 ]; then
            read -r -p "Enter ${label} [${def}]: " input || true
        fi
        effective="${input:-$def}"
    fi
    eval "${var}=\"${effective}\""; export "$var"
}

prompt_or_default_backend DB_DIALECT "$DB_DIALECT" "Database dialect (postgres)"
prompt_or_default_backend DB_HOST "$DB_HOST" "Database host"
prompt_or_default_backend DB_PORT "$DB_PORT" "Database port"
prompt_or_default_backend DB_NAME "$DB_NAME" "Database name"
prompt_or_default_backend DB_USER "$DB_USER" "Database username"
prompt_or_default_backend DB_PASSWORD "$DB_PASSWORD" "Database password"
prompt_or_default_backend DB_SSL "$DB_SSL" "Use SSL (true/false)"

# Compute DATABASE_URL if missing
if [ -z "${DATABASE_URL:-}" ]; then
    case "$DB_DIALECT" in
        postgres|postgresql)
            DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
            ;;
        mysql)
            DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
            ;;
        *)
            # Fallback to postgres format
            DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
            ;;
    esac
fi
export DATABASE_URL

log "🗄️  DB config: dialect=${DB_DIALECT} host=${DB_HOST} port=${DB_PORT} name=${DB_NAME} user=${DB_USER}"
export DB_DIALECT DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DB_SSL

# Env-only mode: write backend and frontend env files and exit
if [ "${ENV_ONLY:-0}" -eq 1 ]; then
    log "🧾 Writing environment files (env-only mode) ..."

    LOCAL_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "$PWD")"
    TARGET_DIR="$APP_DIR"
    if [ ! -d "$TARGET_DIR/backend-node" ] || [ ! -d "$TARGET_DIR/glasscode/frontend" ]; then
        TARGET_DIR="$LOCAL_REPO_DIR"
    fi

    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

    mkdir -p "$TARGET_DIR/backend-node"
# Skipping local .env creation; enforce .env.production-only for production

    # Ensure backend .env.production exists and includes the same keys (merge-only)
    BACKEND_PROD_ENV="$TARGET_DIR/backend-node/.env.production"
    TMP_BENV=$(mktemp 2>/dev/null || echo "$BACKEND_PROD_ENV.tmp")
    if [ -f "$BACKEND_PROD_ENV" ]; then
        cp "$BACKEND_PROD_ENV" "$TMP_BENV"
    else
        : > "$TMP_BENV"
    fi
    add_if_missing_be_prod() {
        local key="$1"; local value="$2";
        # Upsert: set when missing or present but empty; otherwise keep existing
        if grep -qE "^${key}=" "$TMP_BENV"; then
            local current="$(grep -E "^${key}=" "$TMP_BENV" | tail -n1 | cut -d'=' -f2- | tr -d '\r')"
            if [ -z "$current" ]; then
                awk -v k="$key" -v v="$value" '
                BEGIN{found=0}
                {
                    if ($0 ~ "^"k"=") {
                        found=1
                        split($0, arr, "=")
                        if (length(arr[2])==0) { print k"="v } else { print $0 }
                    } else { print $0 }
                }
                END{ if(!found) print k"="v }
                ' "$TMP_BENV" > "$TMP_BENV.tmp" && mv "$TMP_BENV.tmp" "$TMP_BENV"
            fi
        else
            printf "%s=%s\n" "$key" "$value" >> "$TMP_BENV"
        fi
    }
    add_if_missing_be_prod NODE_ENV "production"
add_if_missing_be_prod PORT "${BACKEND_PORT:-8080}"
add_if_missing_be_prod DATABASE_URL "$DATABASE_URL"
add_if_missing_be_prod DB_DIALECT "$DB_DIALECT"
add_if_missing_be_prod DB_HOST "$DB_HOST"
add_if_missing_be_prod DB_PORT "$DB_PORT"
add_if_missing_be_prod DB_NAME "$DB_NAME"
add_if_missing_be_prod DB_USER "$DB_USER"
add_if_missing_be_prod DB_PASSWORD "$DB_PASSWORD"
add_if_missing_be_prod DB_SSL "$DB_SSL"
mv "$TMP_BENV" "$BACKEND_PROD_ENV"

    # Set defaults if missing
    if [ -z "${NEXT_PUBLIC_BASE_URL:-}" ]; then
        NEXT_PUBLIC_BASE_URL="https://${DOMAIN}"
    fi
    if [ -z "${NEXT_PUBLIC_API_BASE:-}" ]; then
        NEXT_PUBLIC_API_BASE="https://api.${DOMAIN}"
    fi

    mkdir -p "$TARGET_DIR/glasscode/frontend"
    cat >"$TARGET_DIR/glasscode/frontend/.env.production" <<EOF
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

    log "✅ Environment files written:"
log " - $TARGET_DIR/backend-node/.env.production"
log " - $TARGET_DIR/glasscode/frontend/.env.production"
exit 0
fi

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

    # Ensure base tools
    REQUIRED_CMDS=(curl git jq unzip zip ss bc lsof)
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
        apt-get install -y curl git jq unzip zip iproute2 bc lsof || true
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
    NODE_VER=$(node --version 2>/dev/null || echo "")
    if [ -z "$NODE_VER" ] || ! echo "$NODE_VER" | grep -qE '^v(20|21)\.'; then
        NEED_NODE=1
    fi
}

# Function to stop running services like update.sh does
stop_running_services() {
    log "⏹️  Stopping any running services..."
    systemctl stop ${APP_NAME}-frontend ${APP_NAME}-backend 2>/dev/null || true
    log "✅ Services stopped"
}

is_service_running() {
    systemctl is-active --quiet "$1"
}

# Proactively free ports used by backend/frontend to avoid bind conflicts
cleanup_ports() {
    local ports=("$@")
    for port in "${ports[@]}"; do
        [ -z "$port" ] && continue
        log "🧹 Ensuring port $port is free..."
        # Collect PIDs using ss (non-fatal if ss missing)
        local pids=""
        if command_exists ss; then
            pids=$(ss -tulpn 2>/dev/null | sed -n "s/.*:$port.*pid=\([0-9]\+\).*/\1/p" | sort -u | tr '\n' ' ' || true)
        else
            log "ℹ️  'ss' not found; falling back to lsof only"
        fi
        # Fallback to lsof if available
        if command_exists lsof; then
            local lsof_pids=""
            lsof_pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' || true)
            pids="$(echo "$pids $lsof_pids" | tr ' ' '\n' | sort -u | tr '\n' ' ')"
        fi
        if [ -n "$pids" ]; then
            log "🛑 Terminating processes on port $port (PIDs: $pids)"
            kill -TERM $pids 2>/dev/null || true
            sleep 2
            # Check again and force kill if necessary
            local remaining=""
            if command_exists ss; then
                remaining=$(ss -tulpn 2>/dev/null | sed -n "s/.*:$port.*pid=\([0-9]\+\).*/\1/p" | sort -u | tr '\n' ' ' || true)
            fi
            if [ -n "$remaining" ]; then
                log "🧨 Force killing remaining PIDs on port $port (PIDs: $remaining)"
                kill -KILL $remaining 2>/dev/null || true
                sleep 1
            fi
        fi
        if command_exists ss && ss -tulpn 2>/dev/null | grep -q ":$port"; then
            log "⚠️  Port $port still appears busy after cleanup; continuing."
        else
            log "✅ Port $port appears free"
        fi
    done
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

# Clean build/publish/temp directories before any installs/builds
pre_install_cleanup() {
    log "🧹 Pre-install cleanup: removing build/publish/temp directories"
    local dirs=(
        "$APP_DIR/node_modules"
        "$APP_DIR/glasscode/frontend/node_modules"
        "$APP_DIR/glasscode/frontend/.next"
        "$APP_DIR/glasscode/frontend/.turbo"
        "$APP_DIR/glasscode/frontend/.cache"
        "$APP_DIR/backend-node/node_modules"
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

# Proactively free common ports used by backend/frontend
cleanup_ports 8080 "$FRONTEND_PORT"

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
PG_VER=$( (ls -1 /etc/postgresql 2>/dev/null || echo "") | sort -r | head -n1)
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
    log "✅ Node.js already present: $(node --version 2>/dev/null || echo 'unknown')"
fi
log "✅ npm version: $(npm --version 2>/dev/null || echo 'unknown')"

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

### 8. Check disk space before builds
log "💾 Checking available disk space..."
AVAILABLE_SPACE_GB=$( (df "$APP_DIR" 2>/dev/null | awk 'NR==2 {printf "%.1f", $4/1024/1024}') || echo 0)
REQUIRED_SPACE_GB=5.0
CMP=$( (echo "$AVAILABLE_SPACE_GB < $REQUIRED_SPACE_GB" | bc -l 2>/dev/null) || awk -v a="$AVAILABLE_SPACE_GB" -v b="$REQUIRED_SPACE_GB" 'BEGIN{print (a<b)?1:0}')
if [ "$CMP" -eq 1 ]; then
    log "❌ ERROR: Insufficient disk space. Available: ${AVAILABLE_SPACE_GB}GB, Required: ${REQUIRED_SPACE_GB}GB"
    log "💡 Consider cleaning up old builds or expanding disk space"
    exit 1
fi
log "✅ Sufficient disk space available: ${AVAILABLE_SPACE_GB}GB"

### 9. Smart Backend Setup (Node.js) (skipped in frontend-only mode)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "🏗️  Setting up backend..."
    cd "$APP_DIR/backend-node"

    # Skipping backend .env population; production uses .env.production exclusively
    # Ensure backend .env.production is populated (merge-only)
    log "🧾 Ensuring backend .env.production is populated..."
    BACKEND_PROD_ENV_PATH="$APP_DIR/backend-node/.env.production"
    TMP_ENV2=$(mktemp 2>/dev/null || echo "$BACKEND_PROD_ENV_PATH.tmp")
    if [ -f "$BACKEND_PROD_ENV_PATH" ]; then
        cp "$BACKEND_PROD_ENV_PATH" "$TMP_ENV2"
    else
        : > "$TMP_ENV2"
    fi
    add_if_missing_backend_prod() {
        local key="$1"; local value="$2";
        # Upsert: set when missing or present but empty; otherwise keep existing
        if grep -qE "^${key}=" "$TMP_ENV2"; then
            local current="$(grep -E "^${key}=" "$TMP_ENV2" | tail -n1 | cut -d'=' -f2- | tr -d '\r')"
            if [ -z "$current" ]; then
                awk -v k="$key" -v v="$value" '
                BEGIN{found=0}
                {
                    if ($0 ~ "^"k"=") {
                        found=1
                        split($0, arr, "=")
                        if (length(arr[2])==0) { print k"="v } else { print $0 }
                    } else { print $0 }
                }
                END{ if(!found) print k"="v }
                ' "$TMP_ENV2" > "$TMP_ENV2.tmp" && mv "$TMP_ENV2.tmp" "$TMP_ENV2"
            fi
        else
            printf "%s=%s\n" "$key" "$value" >> "$TMP_ENV2"
        fi
    }
    add_if_missing_backend_prod NODE_ENV "production"
    add_if_missing_backend_prod PORT "${BACKEND_PORT:-8080}"
    add_if_missing_backend_prod DB_DIALECT "$DB_DIALECT"
add_if_missing_backend_prod DB_HOST "$DB_HOST"
add_if_missing_backend_prod DB_PORT "$DB_PORT"
add_if_missing_backend_prod DB_NAME "$DB_NAME"
add_if_missing_backend_prod DB_USER "$DB_USER"
add_if_missing_backend_prod DB_PASSWORD "$DB_PASSWORD"
add_if_missing_backend_prod DB_SSL "$DB_SSL"
add_if_missing_backend_prod DATABASE_URL "$DATABASE_URL"
    install -m 0644 "$TMP_ENV2" "$BACKEND_PROD_ENV_PATH"
    chown "$DEPLOY_USER":"$DEPLOY_USER" "$BACKEND_PROD_ENV_PATH" || true
    log "✅ Backend .env.production updated (existing values preserved)"

    # Install backend dependencies
    log "🔧 Installing backend dependencies..."
    if ! sudo -u "$DEPLOY_USER" npm ci; then
        log "ℹ️  npm ci failed; falling back to npm install"
        if ! sudo -u "$DEPLOY_USER" npm install; then
            log "❌ ERROR: Failed to install backend dependencies"
            exit 1
        fi
    fi
    log "✅ Backend dependencies installed"

    # Run database migrations
    log "📊 Running database migrations..."
    if ! sudo -u "$DEPLOY_USER" env NODE_ENV=production DATABASE_URL="$DATABASE_URL" DB_DIALECT="$DB_DIALECT" DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" DB_SSL="$DB_SSL" npm run migrate; then
        log "❌ ERROR: Failed to run database migrations"
        exit 1
    fi
    log "✅ Database migrations completed"

    # Seed content
    log "🌱 Seeding content..."
    if ! sudo -u "$DEPLOY_USER" env NODE_ENV=production DATABASE_URL="$DATABASE_URL" DB_DIALECT="$DB_DIALECT" DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" DB_SSL="$DB_SSL" npm run seed; then
        log "❌ ERROR: Failed to seed content"
        exit 1
    fi
    log "✅ Content seeded"

    # Create and start backend service
    log "⚙️  Creating backend systemd service..."
    log "🔌 Port 8080 preflight: checking for conflicts..."
    # Avoid grep in pipeline under pipefail; parse PIDs with sed directly
    CONFLICT_PIDS=""
    if command_exists ss; then
        CONFLICT_PIDS=$(ss -tulpn 2>/dev/null | sed -n 's/.*:8080.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)
    else
        log "ℹ️  'ss' not found; skipping port conflict check via ss"
    fi
    if [ -n "$CONFLICT_PIDS" ]; then
        log "🛑 Killing processes using port 8080 (PIDs: $CONFLICT_PIDS)"
        kill -9 $CONFLICT_PIDS 2>/dev/null || true
        sleep 2
    fi
    command_exists ss && ss -tulpn 2>/dev/null | grep ':8080' || true
    cat >/etc/systemd/system/${APP_NAME}-backend.service <<EOF
[Unit]
Description=$APP_NAME Node Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/backend-node
EnvironmentFile=$APP_DIR/backend-node/.env.production
ExecStart=/usr/bin/node $APP_DIR/backend-node/server.js
Restart=always
RestartSec=10
User=$DEPLOY_USER
Environment=PORT=${BACKEND_PORT:-8080}
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    # Always attempt to unmask backend service before enabling/starting
    systemctl unmask ${APP_NAME}-backend || true
    systemctl enable ${APP_NAME}-backend

    log "🚀 Starting backend service..."
    systemctl start ${APP_NAME}-backend

    log "⏳ Waiting for backend health before frontend build..."
    MAX_ATTEMPTS=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 15 || echo 30)
    ATTEMPT=1
    SLEEP_INTERVAL=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
    BACKEND_HEALTHY=false
    LAST_STATUS=""

    # Resolve public API base for readiness gate (prefer NEXT_PUBLIC_API_BASE)
    API_BASE_RAW="${NEXT_PUBLIC_API_BASE:-}"
    API_BASE=$(echo "$API_BASE_RAW" | tr -d '\r' | xargs)
    [ -z "$API_BASE" ] && API_BASE="https://api.${DOMAIN}"
    API_BASE="${API_BASE%/}"
    HEALTH_URL="${API_BASE}/health"

    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        # Check if service is still running first
        if ! systemctl is-active --quiet "${APP_NAME}-backend"; then
            printf "\n"  # Clear progress line
            log "❌ Backend service stopped unexpectedly during health check"
            break
        fi

        # Poll health endpoint for readiness
        HEALTH_JSON=$(timeout 10 curl -s "$HEALTH_URL" || true)
        if echo "$HEALTH_JSON" | jq -e '.success == true' >/dev/null 2>&1; then
            printf "\n"  # Clear progress line
            log "✅ Backend health ready at attempt $ATTEMPT/$MAX_ATTEMPTS. Proceeding to build frontend."
            BACKEND_HEALTHY=true
            break
        fi

        printf "\r⏳ Waiting for backend health... attempt %d/%d" "$ATTEMPT" "$MAX_ATTEMPTS"
        ATTEMPT=$((ATTEMPT + 1))
        sleep "$SLEEP_INTERVAL"
    done

    # Health check summary
    if [[ "$BACKEND_HEALTHY" == "true" ]]; then
        log "✅ Backend health satisfied at attempt $ATTEMPT/$MAX_ATTEMPTS (pre-build)."
    fi

    if [[ "$BACKEND_HEALTHY" != "true" && $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
        log "❌ Backend health failed before frontend build."
        log "🧪 Diagnostic: systemd status"
        systemctl status ${APP_NAME}-backend --no-pager || true
        log "🪵 Recent backend logs (journalctl)"
        journalctl -u ${APP_NAME}-backend -n 200 --no-pager || true
        log "🌐 Health endpoint verbose output"
        timeout 15 curl -v "$HEALTH_URL" || true
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Continuing despite backend health precondition due to fast/skip mode"
        else
            exit 1
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

    # Ensure .env.production variables with sensible defaults and interactive prompts
    # Establish defaults if not already set in environment
    [ -z "${NEXT_PUBLIC_BASE_URL:-}" ] && NEXT_PUBLIC_BASE_URL="https://${DOMAIN}"
    [ -z "${NEXT_PUBLIC_API_BASE:-}" ] && NEXT_PUBLIC_API_BASE="https://api.${DOMAIN}"
    [ -z "${NEXTAUTH_URL:-}" ] && NEXTAUTH_URL="https://${DOMAIN}"
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        NEXTAUTH_SECRET="$(generate_secret || echo 'temporary-nextauth-secret-change-me')"
    fi

    # Helper to prompt for a variable if missing (uses TTY only; otherwise defaults)
    prompt_or_default() {
        local var="$1"; local def="$2"; local label="$3";
        local existing=""; local current="${!var:-}"; local input="";
        if [ -f ".env.production" ]; then
            existing=$( (grep -E "^${var}=" .env.production || true) | tail -n1 | cut -d'=' -f2- | tr -d '\r')
        fi
        local effective="${existing:-$current}"
        if [ -z "$effective" ]; then
            if [ -t 0 ]; then
                read -r -p "Enter ${label} [${def}]: " input || true
            fi
            effective="${input:-$def}"
        fi
        eval "${var}=\"${effective}\""; export "$var"
    }

    # Prompt for required variables (or use defaults)
    prompt_or_default NEXT_PUBLIC_BASE_URL "${NEXT_PUBLIC_BASE_URL}" "Public base URL"
    prompt_or_default NEXT_PUBLIC_API_BASE "${NEXT_PUBLIC_API_BASE}" "Public API base URL"
    prompt_or_default NEXTAUTH_URL "${NEXTAUTH_URL}" "NextAuth URL"
    prompt_or_default NEXTAUTH_SECRET "${NEXTAUTH_SECRET}" "NextAuth Secret"
    prompt_or_default GOOGLE_CLIENT_ID "" "Google Client ID"
    prompt_or_default GOOGLE_CLIENT_SECRET "" "Google Client Secret"
    prompt_or_default GITHUB_ID "" "GitHub Client ID"
    prompt_or_default GITHUB_SECRET "" "GitHub Client Secret"
    prompt_or_default APPLE_CLIENT_ID "" "Apple Client ID"
    prompt_or_default APPLE_CLIENT_SECRET "" "Apple Client Secret"
    prompt_or_default DEMO_USERS_JSON "" "Demo Users JSON"

    # Merge managed keys without overwriting existing ones
    log "📋 Ensuring .env.production has required variables without overwriting existing"
    TMP_ENV=$(mktemp 2>/dev/null || echo ".env.production.tmp")
    if [ -f ".env.production" ]; then
        cp .env.production "$TMP_ENV"
    else
        : > "$TMP_ENV"
    fi

    add_if_missing() {
        local key="$1"; local value="$2";
        if ! grep -qE "^${key}=" "$TMP_ENV"; then
            printf "%s=%s\n" "$key" "$value" >> "$TMP_ENV"
        else
            # Keep env variable consistent for rest of script
            eval "${key}=\"$((grep -E \"^${key}=\" \"$TMP_ENV\" || true) | tail -n1 | cut -d'=' -f2- | tr -d '\r')\""
        fi
    }

    add_if_missing NEXT_PUBLIC_API_BASE "$NEXT_PUBLIC_API_BASE"
    add_if_missing NEXT_PUBLIC_BASE_URL "$NEXT_PUBLIC_BASE_URL"
    add_if_missing NODE_ENV "production"
    add_if_missing NEXTAUTH_URL "$NEXTAUTH_URL"
    add_if_missing NEXTAUTH_SECRET "$NEXTAUTH_SECRET"
    add_if_missing GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID"
    add_if_missing GOOGLE_CLIENT_SECRET "$GOOGLE_CLIENT_SECRET"
    add_if_missing GITHUB_ID "$GITHUB_ID"
    add_if_missing GITHUB_SECRET "$GITHUB_SECRET"
    add_if_missing APPLE_CLIENT_ID "$APPLE_CLIENT_ID"
    add_if_missing APPLE_CLIENT_SECRET "$APPLE_CLIENT_SECRET"
    add_if_missing DEMO_USERS_JSON "$DEMO_USERS_JSON"

    # Enforce correct domains for frontend URLs (override if wrong)
    enforce_url_key() {
        local file="$1"; local key="$2"; local expected="$3";
        # Normalize expected to https and host-only when possible
        local proto host
        proto=$(echo "$expected" | sed -E 's~^(https?)://.*~\1~')
        [ -z "$proto" ] && proto="https"
        host=$(echo "$expected" | sed -E 's~^https?://([^/]+).*~\1~')
        [ -z "$host" ] && host="$expected"
        local target="${proto}://${host}"

        # Replace or append the key with target value
        awk -v k="$key" -v v="$target" '
        BEGIN{found=0}
        {
          if ($0 ~ "^"k"=") { print k"="v; found=1 } else { print $0 }
        }
        END{ if(!found) print k"="v }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    }

    # Determine expected URLs from DOMAIN
    EXPECTED_BASE_URL="https://${DOMAIN}"
    EXPECTED_API_BASE="https://api.${DOMAIN}"
    EXPECTED_NEXTAUTH_URL="https://${DOMAIN}"

    enforce_url_key "$TMP_ENV" "NEXT_PUBLIC_BASE_URL" "$EXPECTED_BASE_URL"
    enforce_url_key "$TMP_ENV" "NEXT_PUBLIC_API_BASE" "$EXPECTED_API_BASE"
    enforce_url_key "$TMP_ENV" "NEXTAUTH_URL" "$EXPECTED_NEXTAUTH_URL"

    mv "$TMP_ENV" .env.production
    log "✅ .env.production updated (existing values preserved)"

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
# Production-only gating: never use localhost; require public API base
RAW_BASE="${NEXT_PUBLIC_API_BASE:-}"
# Remove quotes/backticks and trim spaces
SANITIZED_BASE="${RAW_BASE//\"/}"
SANITIZED_BASE="${SANITIZED_BASE//\'/}"
SANITIZED_BASE="${SANITIZED_BASE//\`/}"
SANITIZED_BASE="$(echo "$SANITIZED_BASE" | xargs)"
if [ -z "$SANITIZED_BASE" ]; then
  echo "❌ NEXT_PUBLIC_API_BASE is not set; cannot perform production health gating."
  exit 1
fi
HEALTH_URL="${SANITIZED_BASE%/}/health"
MAX=30
COUNT=1
while [ $COUNT -le $MAX ]; do
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  RESP=$(timeout 10 curl -s "$HEALTH_URL" || true)
  SUCCESS=$(echo "$RESP" | jq -r '.success' 2>/dev/null || { echo "$RESP" | grep -q '"success":true' && echo "true" || echo "false"; })
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)

  if [ "$HTTP" = "200" ] && { [ "$SUCCESS" = "true" ] || [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; }; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
    exit 0
  fi
  echo "⏳ Backend health check attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
  sleep 5; COUNT=$((COUNT+1))
done
echo "❌ Backend health check gating failed after $MAX attempts: url='$HEALTH_URL' http='$HTTP' success='$SUCCESS' status='${STATUS:-unknown}' resp='${RESP:0:512}'"
exit 1
EOS
chmod +x "$APP_DIR/glasscode/frontend/check_backend_health.sh"

if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "⚙️  Writing frontend unit with backend dependency at $UNIT_FILE_PATH"
    cat >"$UNIT_FILE_PATH" <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target ${APP_NAME}-backend.service

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
    systemctl unmask ${APP_NAME}-backend || true
fi
# Unmask services if previously masked
if systemctl is-enabled ${APP_NAME}-frontend 2>/dev/null | grep -q masked; then
    log "⚠️  Frontend service is masked. Unmasking..."
    systemctl unmask ${APP_NAME}-frontend || true
fi
if [ "$FRONTEND_ONLY" -eq 0 ] && systemctl is-enabled ${APP_NAME}-backend 2>/dev/null | grep -q masked; then
    log "⚠️  Backend service is masked. Unmasking..."
    systemctl unmask ${APP_NAME}-backend || true
fi

if [ "$FRONTEND_ONLY" -eq 0 ]; then
    systemctl enable ${APP_NAME}-backend ${APP_NAME}-frontend
else
    systemctl enable ${APP_NAME}-frontend
fi

### 11.1 Start or restart services
log "🚀 Starting services..."

# Services already stopped by stop_running_services function

# Start services with enhanced error handling and parallel startup
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "▶️  Starting ${APP_NAME}-backend..."
    if ! systemctl start "${APP_NAME}-backend"; then
        log "❌ Failed to start ${APP_NAME}-backend service"
        systemctl status "${APP_NAME}-backend" --no-pager || true
        journalctl -u "${APP_NAME}-backend" -n 100 --no-pager || true
        exit 1
    fi
    
    # Start backend health check in background
    (
    if wait_for_service "${APP_NAME}-backend"; then
        log "✅ ${APP_NAME}-backend service is healthy"
    else
        log "❌ ${APP_NAME}-backend did not become active within timeout"
        systemctl status "${APP_NAME}-backend" --no-pager || true
        journalctl -u "${APP_NAME}-backend" -n 50 --no-pager || true
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Continuing despite backend health startup failure due to fast/skip mode"
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
    API_BASE="${NEXT_PUBLIC_API_BASE%/}"
    API_HOST=$(echo "$API_BASE" | sed -E 's~https?://([^/]+).*~\1~')
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
        proxy_pass ${API_BASE};
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header Host ${API_HOST};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }


    location /graphql {
        proxy_pass ${API_BASE};
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header Host ${API_HOST};
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

# Configure dedicated API domain to proxy local backend when not in frontend-only mode
cat >/etc/nginx/sites-available/${APP_NAME}-api <<EOF
server {
    listen 80;
    server_name api.$DOMAIN;

    location / {
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
}
EOF
fi

## Prefer curated domain config if present to avoid name mismatches
if [ -f "/etc/nginx/sites-available/${DOMAIN}.conf" ]; then
    ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
    rm -f "/etc/nginx/sites-enabled/$APP_NAME" || true
else
    ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
fi

## Avoid duplicate API server blocks if Certbot already manages api.$DOMAIN in conf.d
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    if [ -f "/etc/nginx/conf.d/api.${DOMAIN}.conf" ]; then
        rm -f "/etc/nginx/sites-enabled/${APP_NAME}-api" || true
    else
        ln -sf "/etc/nginx/sites-available/${APP_NAME}-api" "/etc/nginx/sites-enabled/${APP_NAME}-api"
    fi
fi

nginx -t && systemctl reload nginx
log "✅ Nginx configured"

### 13. TLS
log "🔒 Setting up TLS..."
# Ensure ACME webroot exists for robust http-01 challenges
mkdir -p /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt || true

ISSUED=0

# Ensure per-domain webroots exist to match Nginx configs
mkdir -p /var/www/glasscode.academy /var/www/api.glasscode.academy
chown -R www-data:www-data /var/www/glasscode.academy /var/www/api.glasscode.academy || true

# Issue/renew apex+www certificate (separate from api) using nginx plugin, fallback to matching webroot
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --keep-until-expiring; then
    ISSUED=1
else
    log "⚠️  certbot --nginx for $DOMAIN failed; falling back to webroot"
    certbot certonly --webroot -w /var/www/glasscode.academy -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --keep-until-expiring || true
    ISSUED=1
fi

# Only handle api cert when backend is included
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    if certbot --nginx -d "api.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --keep-until-expiring; then
        ISSUED=1
    else
        log "⚠️  certbot --nginx for api.$DOMAIN failed; falling back to webroot"
        certbot certonly --webroot -w /var/www/api.glasscode.academy -d "api.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --keep-until-expiring || true
        ISSUED=1
    fi
fi

# Ensure renewal timers are active
systemctl enable --now certbot.timer || true
systemctl enable --now snap.certbot.renew.timer || true

nginx -t && systemctl reload nginx
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

# Resolve public API base for production checks (prefer NEXT_PUBLIC_API_BASE)
API_BASE_RAW="${NEXT_PUBLIC_API_BASE:-}"
if [ -z "$API_BASE_RAW" ] && [ -f "$APP_DIR/glasscode/frontend/.env.production" ]; then
    API_BASE_RAW=$(grep -E '^NEXT_PUBLIC_API_BASE=' "$APP_DIR/glasscode/frontend/.env.production" | tail -n1 | cut -d'=' -f2- | tr -d '\r')
fi
[ -z "$API_BASE_RAW" ] && API_BASE_RAW="https://api.${DOMAIN}"
# Sanitize accidental quotes/backticks/spaces and remove trailing slash
API_BASE=$(echo "$API_BASE_RAW" | tr -d '\r' | xargs)
API_BASE="${API_BASE%/}"
HEALTH_URL="${API_BASE}/health"

# Backend health (Node.js REST)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
  if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
      log "ℹ️  Skipping backend health check (fast/skip mode)"
  else
      HTTP=$(timeout 15 curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
      if [ "$HTTP" = "200" ]; then
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
if timeout $FRONTEND_TIMEOUT curl -f http://127.0.0.1:$FRONTEND_PORT >/dev/null 2>&1; then
    log "✅ Frontend health check: PASSED"
else
    log "⚠️  WARNING: Frontend health check failed"
fi

# Database-backed content validation (default)
if [ "$FRONTEND_ONLY" -eq 0 ]; then
    log "🔍 Validating backend content via Node API..."

    COURSES_JSON=$(timeout 10 curl -s "${API_BASE}/api/courses" || true)
    COURSES_SUCCESS=$(echo "$COURSES_JSON" | jq -r '.success' 2>/dev/null || echo "false")
    COURSES_COUNT=$(echo "$COURSES_JSON" | jq -r '.data | length' 2>/dev/null || echo "0")

    if [ "$COURSES_SUCCESS" = "true" ]; then
        if [ "$COURSES_COUNT" -gt 0 ]; then
            log "✅ Courses endpoint: PASSED ($COURSES_COUNT found)"
            COURSE_ID=$(echo "$COURSES_JSON" | jq -r '.data[0].id' 2>/dev/null || echo "")
        else
            log "⚠️  WARNING: Courses endpoint returned empty data; attempting seeding..."
            COURSE_ID=""
            # Attempt content seeding from JSON registry
            if [ -d "$APP_DIR/backend-node" ]; then
                log "🌱 Seeding database content from JSON registry..."
                (
                  cd "$APP_DIR/backend-node" && \
                  sudo -u "$DEPLOY_USER" env NODE_ENV=production \
                    DATABASE_URL="${DATABASE_URL}" DB_DIALECT="${DB_DIALECT}" DB_HOST="${DB_HOST}" DB_PORT="${DB_PORT}" DB_NAME="${DB_NAME}" DB_USER="${DB_USER}" DB_PASSWORD="${DB_PASSWORD}" DB_SSL="${DB_SSL}" \
                    npm run seed:content
                ) || log "⚠️  WARNING: Content seeding failed; continuing"
                # Recheck courses after seeding
                COURSES_JSON=$(timeout 10 curl -s "${API_BASE}/api/courses" || true)
                COURSES_SUCCESS=$(echo "$COURSES_JSON" | jq -r '.success' 2>/dev/null || echo "false")
                COURSES_COUNT=$(echo "$COURSES_JSON" | jq -r '.data | length' 2>/dev/null || echo "0")
                if [ "$COURSES_SUCCESS" = "true" ] && [ "$COURSES_COUNT" -gt 0 ]; then
                    log "✅ Courses now populated after seeding ($COURSES_COUNT found)"
                    COURSE_ID=$(echo "$COURSES_JSON" | jq -r '.data[0].id' 2>/dev/null || echo "")
                else
                    SHORT=$(echo "$COURSES_JSON" | tr -d '\n' | cut -c1-200)
                    log "⚠️  WARNING: Courses remain empty after seeding (resp='${SHORT}')"
                fi
            else
                log "ℹ️  Skipping seeding: backend-node directory not found"
            fi
        fi
    else
        SHORT=$(echo "$COURSES_JSON" | tr -d '\n' | cut -c1-200)
        log "⚠️  WARNING: Courses endpoint failed (resp='${SHORT}')"
        COURSE_ID=""
    fi

    if [ -n "$COURSE_ID" ]; then
        COURSE_DETAIL=$(timeout 10 curl -s "${API_BASE}/api/courses/$COURSE_ID" || true)
        MODULE_ID=$(echo "$COURSE_DETAIL" | jq -r '.data.modules[0].id' 2>/dev/null || echo "")
    else
        MODULE_ID=""
    fi

    if [ -n "$MODULE_ID" ]; then
        MODULE_DETAIL=$(timeout 10 curl -s "${API_BASE}/api/modules/$MODULE_ID" || true)
        if echo "$MODULE_DETAIL" | jq -e '.data.lessons | type=="array"' >/dev/null 2>&1; then
            log "✅ Module detail with lessons: PASSED"
            LESSON_ID=$(echo "$MODULE_DETAIL" | jq -r '.data.lessons[0].id' 2>/dev/null || echo "")
        else
            SHORT=$(echo "$MODULE_DETAIL" | tr -d '\n' | cut -c1-200)
            log "⚠️  WARNING: Module detail failed to include lessons (resp='${SHORT}')"
            LESSON_ID=""
        fi
    else
        LESSON_ID=""
    fi
    
    if [ -n "$LESSON_ID" ]; then
        QUIZZES_JSON=$(timeout 10 curl -s "${API_BASE}/api/lessons/$LESSON_ID/quizzes" || true)
        if echo "$QUIZZES_JSON" | jq -e 'type=="array"' >/dev/null 2>&1; then
            log "✅ Lesson quizzes endpoint: PASSED"
        else
            SHORT=$(echo "$QUIZZES_JSON" | tr -d '\n' | cut -c1-200)
            log "⚠️  WARNING: Lesson quizzes endpoint failed (resp='${SHORT}')"
        fi
    else
        log "ℹ️  Skipping quizzes check (no lesson discovered)"
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
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-backend 2>/dev/null || echo inactive)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend 2>/dev/null || echo inactive)"