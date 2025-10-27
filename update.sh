#!/usr/bin/env bash
# update.sh - Update GlassCode Academy to the latest version (Node.js version)
# This script updates the application by pulling the latest code and rebuilding components

set -euo pipefail

### Load production configuration (.env.production only) ###
ENV_FILE="./.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo "✅ Loaded production configuration from $ENV_FILE"
else
    echo "❌ ERROR: Production configuration file $ENV_FILE not found. This script is for production only."
    echo "Create $ENV_FILE with required keys: APP_NAME, DEPLOY_USER, APP_DIR, DOMAIN and frontend NEXT_PUBLIC_* variables."
    exit 1
fi

# Enforce production defaults for frontend env
[ -z "${NEXT_PUBLIC_BASE_URL:-}" ] && NEXT_PUBLIC_BASE_URL="https://${DOMAIN}"
[ -z "${NEXT_PUBLIC_API_BASE:-}" ] && NEXT_PUBLIC_API_BASE="https://api.${DOMAIN}"
export NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_API_BASE

# Production guardrails
if [ "$(id -u)" -ne 0 ]; then
  echo "❌ ERROR: Must run as root (use sudo). This script is production-only."
  exit 1
fi

if [ -z "${DOMAIN:-}" ]; then
  echo "❌ ERROR: DOMAIN is not set in $ENV_FILE."
  exit 1
fi

if [[ "$DOMAIN" =~ ^(localhost|127\.0\.0\.1)$ || "$DOMAIN" =~ \.local$ || "$DOMAIN" =~ \.test$ ]]; then
  echo "❌ ERROR: DOMAIN appears non-production ('$DOMAIN'). Aborting."
  exit 1
fi

echo "🌐 Production domain: $DOMAIN"
echo "🔗 NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}"
echo "🔗 NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}"
echo "🔄 Update Script for $APP_NAME (Node.js version)"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Determine frontend port from env, unit file, or default
# Prefer PORT from .env; otherwise extract from existing unit; fallback to 3000
UNIT_FILE_PATH="/etc/systemd/system/${APP_NAME}-frontend.service"
FRONTEND_PORT="${PORT:-}"
if [ -z "$FRONTEND_PORT" ] && [ -f "$UNIT_FILE_PATH" ]; then
    FRONTEND_PORT=$(sed -n 's/^ExecStart=.*-p \([0-9]\+\).*/\1/p' "$UNIT_FILE_PATH" | head -n1 || true)
fi
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=3000
fi

# CLI flags parsing
FAST_MODE=0
SKIP_CONTENT_VALIDATION=0
SKIP_LINT=0
SKIP_TYPECHECK=0
SKIP_BACKEND_HEALTH=0
FRONTEND_ONLY=0
VALIDATE_JSON_CONTENT=0
# Allow overriding port via CLI
while [[ $# -gt 0 ]]; do
    case "$1" in
        --fast) FAST_MODE=1; SKIP_CONTENT_VALIDATION=1; SKIP_LINT=1; SKIP_TYPECHECK=1; SKIP_BACKEND_HEALTH=1; shift;;
        --frontend-only) FRONTEND_ONLY=1; shift;;
        --skip-content-validation) SKIP_CONTENT_VALIDATION=1; shift;;
        --validate-json-content) VALIDATE_JSON_CONTENT=1; shift;;
        --skip-lint) SKIP_LINT=1; shift;;
        --skip-typecheck) SKIP_TYPECHECK=1; shift;;
        --skip-backend-health) SKIP_BACKEND_HEALTH=1; shift;;
        --port) FRONTEND_PORT="${2:-$FRONTEND_PORT}"; shift 2;;
        *) log "⚠️  WARNING: Unknown argument: $1"; shift;;
    esac
done
export FAST_MODE SKIP_CONTENT_VALIDATION SKIP_LINT SKIP_TYPECHECK SKIP_BACKEND_HEALTH FRONTEND_ONLY FRONTEND_PORT VALIDATE_JSON_CONTENT
log "🌐 Frontend port: $FRONTEND_PORT"
log "⚙️  Flags: FAST=$FAST_MODE FRONTEND_ONLY=$FRONTEND_ONLY SKIP_VALIDATION=$SKIP_CONTENT_VALIDATION VALIDATE_JSON=$VALIDATE_JSON_CONTENT SKIP_LINT=$SKIP_LINT SKIP_TS=$SKIP_TYPECHECK SKIP_BACKEND_HEALTH=$SKIP_BACKEND_HEALTH"

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
    local max_attempts=120
    local attempt=1
    local sleep_time=2
    local service_failed=false
    if [ "${FAST_MODE:-0}" -eq 1 ]; then
        max_attempts=60
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
            # Additional health check for frontend service
            if [ "$service_name" = "${APP_NAME}-frontend" ]; then
                log "🔍 Performing frontend health check..."
                sleep 5  # Give it a moment to fully initialize
                if timeout 10 curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
                    log "✅ Frontend health check passed"
                    return 0
                else
                    log "⚠️  Frontend service running but not responding on port $FRONTEND_PORT, continuing to wait..."
                fi
            else
                return 0
            fi
        fi
        # Only log every 10th attempt to reduce noise
        if [ $((attempt % 10)) -eq 0 ] || [ $attempt -eq 1 ]; then
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

# Function to install npm dependencies efficiently
install_npm_deps_workspace() {
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

# Ensure backend env files exist and include DB settings before migrations
ensure_backend_env() {
    log "🧾 Ensuring backend env files exist and include DB settings..."
    if [ ! -d "$APP_DIR/backend-node" ] || [ "$FRONTEND_ONLY" -eq 1 ]; then
        return 0
    fi
    cd "$APP_DIR/backend-node"

    BACKEND_PROD_ENV_PATH="$APP_DIR/backend-node/.env.production"

    # Defaults
    DB_DIALECT_DEFAULT="postgres"
    DB_HOST_DEFAULT="localhost"
    DB_PORT_DEFAULT="5432"
    DB_NAME_DEFAULT="glasscode_dev"
    DB_USER_DEFAULT="postgres"
    DB_PASSWORD_DEFAULT="postgres"
    DB_SSL_DEFAULT="false"

    # Helper to read existing key
    read_existing() { local file="$1"; local key="$2"; [ -f "$file" ] && grep -E "^${key}=" "$file" | tail -n1 | cut -d'=' -f2- | tr -d '\r'; }

    # Resolve effective values preferring production env, then current env, then defaults
    DB_DIALECT="${DB_DIALECT:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_DIALECT || echo "$DB_DIALECT_DEFAULT")}"
    DB_HOST="${DB_HOST:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_HOST || echo "$DB_HOST_DEFAULT")}"
    DB_PORT="${DB_PORT:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_PORT || echo "$DB_PORT_DEFAULT")}"
    DB_NAME="${DB_NAME:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_NAME || echo "$DB_NAME_DEFAULT")}"
    DB_USER="${DB_USER:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_USER || echo "$DB_USER_DEFAULT")}"
    DB_PASSWORD="${DB_PASSWORD:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_PASSWORD || echo "$DB_PASSWORD_DEFAULT")}"
    DB_SSL="${DB_SSL:-$(read_existing "$BACKEND_PROD_ENV_PATH" DB_SSL || echo "$DB_SSL_DEFAULT")}"
    DATABASE_URL="${DATABASE_URL:-$(read_existing "$BACKEND_PROD_ENV_PATH" DATABASE_URL || echo "")}"

    if [ -z "$DATABASE_URL" ]; then
        case "$DB_DIALECT" in
            postgres|postgresql)
                DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
                ;;
            mysql)
                DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
                ;;
            *)
                DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
                ;;
        esac
    fi

    export DB_DIALECT DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DB_SSL DATABASE_URL

    # Skipping dev .env write; production uses .env.production exclusively
    # Merge-write .env.production
    TMP_ENV2=$(mktemp 2>/dev/null || echo "$BACKEND_PROD_ENV_PATH.tmp")
    if [ -f "$BACKEND_PROD_ENV_PATH" ]; then cp "$BACKEND_PROD_ENV_PATH" "$TMP_ENV2"; else : > "$TMP_ENV2"; fi
    upsert_or_append "$TMP_ENV2" NODE_ENV "production"
    upsert_or_append "$TMP_ENV2" PORT "${BACKEND_PORT:-8080}"
    upsert_or_append "$TMP_ENV2" DB_DIALECT "$DB_DIALECT"
    upsert_or_append "$TMP_ENV2" DB_HOST "$DB_HOST"
    upsert_or_append "$TMP_ENV2" DB_PORT "$DB_PORT"
    upsert_or_append "$TMP_ENV2" DB_NAME "$DB_NAME"
    upsert_or_append "$TMP_ENV2" DB_USER "$DB_USER"
    upsert_or_append "$TMP_ENV2" DB_PASSWORD "$DB_PASSWORD"
    upsert_or_append "$TMP_ENV2" DB_SSL "$DB_SSL"
    upsert_or_append "$TMP_ENV2" DATABASE_URL "$DATABASE_URL"
    install -m 0644 "$TMP_ENV2" "$BACKEND_PROD_ENV_PATH"

    log "✅ Backend production env ensured (.env.production)"
}

install_npm_deps() {
    log "📦 Installing Node.js dependencies for all workspaces..."
    
    # Install dependencies for all workspaces
    install_npm_deps_workspace "$APP_DIR" "root"

    if [ -d "$APP_DIR/scripts" ]; then
        install_npm_deps_workspace "$APP_DIR/scripts" "scripts"
    fi

    install_npm_deps_workspace "$APP_DIR/glasscode/frontend" "frontend"
    install_npm_deps_workspace "$APP_DIR/backend-node" "backend"
    
    log "✅ All Node.js dependencies installed"
}

# Ensure systemd unit files exist (backend/frontend) before restart
ensure_systemd_units() {
    # Backend unit
    local be_unit="/etc/systemd/system/${APP_NAME}-backend.service"
    if [ ! -f "$be_unit" ] && [ -d "$APP_DIR/backend-node" ]; then
        log "⚙️  Creating backend systemd service at $be_unit"
        cat >"$be_unit" <<EOF
[Unit]
Description=${APP_NAME} Node Backend
After=network.target

[Service]
WorkingDirectory=${APP_DIR}/backend-node
EnvironmentFile=${APP_DIR}/backend-node/.env.production
ExecStart=/usr/bin/node ${APP_DIR}/backend-node/server.js
Restart=always
RestartSec=10
User=${DEPLOY_USER}
Environment=PORT=${BACKEND_PORT:-8080}
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        systemctl daemon-reload
        systemctl unmask ${APP_NAME}-backend || true
        systemctl enable ${APP_NAME}-backend || true
    fi

    # Frontend unit
    local fe_unit="/etc/systemd/system/${APP_NAME}-frontend.service"
    if [ -d "$APP_DIR/glasscode/frontend" ]; then
        log "⚙️  Ensuring frontend systemd service at $fe_unit"
        # Write backend health gating script used in ExecStartPre
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
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)

  if [ "$HTTP" = "200" ] && { [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ] || [ -n "$RESP" ]; }; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, Status: ${STATUS:-unknown}, URL: $HEALTH_URL"
    exit 0
  fi
  echo "⏳ Attempt $COUNT/$MAX: HTTP $HTTP, Status: ${STATUS:-unknown}, URL: $HEALTH_URL"
  sleep 5; COUNT=$((COUNT+1))
done
echo "❌ Backend health check gating failed: url='$HEALTH_URL' http='$HTTP' status='${STATUS:-unknown}' resp='${RESP:0:512}'"
exit 1
EOS
        chmod +x "$APP_DIR/glasscode/frontend/check_backend_health.sh"
        if [ "$FRONTEND_ONLY" -eq 0 ]; then
            cat >"$fe_unit" <<EOF
[Unit]
Description=${APP_NAME} Next.js Frontend
After=network.target ${APP_NAME}-backend.service

[Service]
WorkingDirectory=${APP_DIR}/glasscode/frontend
EnvironmentFile=${APP_DIR}/glasscode/frontend/.env.production
ExecStartPre=${APP_DIR}/glasscode/frontend/check_backend_health.sh
ExecStart=/usr/bin/node .next/standalone/server.js -p ${FRONTEND_PORT}
Restart=always
RestartSec=10
User=${DEPLOY_USER}
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
        else
            cat >"$fe_unit" <<EOF
[Unit]
Description=${APP_NAME} Next.js Frontend
After=network.target

[Service]
WorkingDirectory=${APP_DIR}/glasscode/frontend
EnvironmentFile=${APP_DIR}/glasscode/frontend/.env.production
ExecStart=/usr/bin/node .next/standalone/server.js -p ${FRONTEND_PORT}
Restart=always
RestartSec=10
User=${DEPLOY_USER}
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
        fi
        systemctl daemon-reload
        systemctl unmask ${APP_NAME}-frontend || true
        systemctl enable ${APP_NAME}-frontend || true
    fi
}

# Validate and correct frontend .env.production URLs based on DOMAIN
fix_frontend_env_urls() {
    local env_file="${APP_DIR}/glasscode/frontend/.env.production"
    if [ ! -f "$env_file" ]; then
        return
    fi
    local expected_base="https://${DOMAIN}"
    local expected_api="https://api.${DOMAIN}"
    local expected_auth="https://${DOMAIN}"

    enforce_url_key() {
        local file="$1"; local key="$2"; local expected="$3";
        local proto host target
        proto=$(echo "$expected" | sed -E 's~^(https?)://.*~\1~')
        [ -z "$proto" ] && proto="https"
        host=$(echo "$expected" | sed -E 's~^https?://([^/]+).*~\1~')
        [ -z "$host" ] && host="$expected"
        target="${proto}://${host}"
        awk -v k="$key" -v v="$target" '
        BEGIN{found=0}
        {
          if ($0 ~ "^"k"=") { print k"="v; found=1 } else { print $0 }
        }
        END{ if(!found) print k"="v }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    }

    enforce_url_key "$env_file" "NEXT_PUBLIC_BASE_URL" "$expected_base"
    enforce_url_key "$env_file" "NEXT_PUBLIC_API_BASE" "$expected_api"
    enforce_url_key "$env_file" "NEXTAUTH_URL" "$expected_auth"
}

rollback() {
    log "⏪ Rolling back to previous version..."
    if [ -n "${BACKUP_DIR:-}" ] && [ -d "$BACKUP_DIR" ]; then
        # Restore the previous version
        rsync -a "$BACKUP_DIR/" "$APP_DIR/"
        log "✅ Rollback completed"
    else
        log "❌ No backup found, cannot rollback"
        exit 1
    fi
}

# Create backup of current version
create_backup() {
    BACKUP_DIR="/tmp/${APP_NAME}_backup_$(date +%s)"
    log "📦 Creating backup of current version to $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    rsync -a "$APP_DIR/" "$BACKUP_DIR/"
    log "✅ Backup created"
}

# Main update process
main() {
    log "🔄 Starting update process..."
    
    # Create backup
    create_backup
    
    # Stop services
    log "⏹️  Stopping services..."
    systemctl stop ${APP_NAME}-frontend ${APP_NAME}-backend 2>/dev/null || true
    
    # Pull latest code
    log "📥 Pulling latest code..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
    
    # Install dependencies
    install_npm_deps

    # Ensure backend env files (DB config) before migrations
    ensure_backend_env
    
    # Run database migrations if needed
    if [ -d "$APP_DIR/backend-node" ] && [ "$FRONTEND_ONLY" -eq 0 ]; then
        log "📊 Running database migrations..."
        cd "$APP_DIR/backend-node"
        if ! sudo -u "$DEPLOY_USER" env NODE_ENV=production DATABASE_URL="$DATABASE_URL" DB_DIALECT="$DB_DIALECT" DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" DB_SSL="$DB_SSL" npm run migrate; then
            log "❌ ERROR: Failed to run database migrations during update"
            exit 1
        fi

        # Seed content from JSON registry to ensure courses/modules/lessons are available
        log "🌱 Seeding database content from JSON registry..."
        if ! sudo -u "$DEPLOY_USER" env NODE_ENV=production DATABASE_URL="$DATABASE_URL" DB_DIALECT="$DB_DIALECT" DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" DB_SSL="$DB_SSL" npm run seed:content; then
            log "⚠️  WARNING: Content seeding failed; continuing"
        else
            log "✅ Content seeding completed"
        fi
    fi
    
    # Build frontend
    if [ -d "$APP_DIR/glasscode/frontend" ]; then
        log "🏗️  Building frontend..."
        cd "$APP_DIR/glasscode/frontend"
        if [ "$SKIP_LINT" -eq 0 ]; then
            log "🔍 Running lint checks..."
            sudo -u "$DEPLOY_USER" npm run lint || true
        fi
        if [ "$SKIP_TYPECHECK" -eq 0 ]; then
            log "🔍 Running TypeScript checks..."
            sudo -u "$DEPLOY_USER" npm run typecheck || true
        fi
        log "⚙️  Building production frontend..."
        sudo -u "$DEPLOY_USER" npm run build

        # Stage Next.js standalone assets to ensure static serving parity with bootstrap
        log "📦 Staging Next.js standalone assets..."
        mkdir -p .next/standalone/.next
        rm -rf .next/standalone/.next/static
        cp -r .next/static .next/standalone/.next/static
        rm -rf .next/standalone/public
        cp -r public .next/standalone/public 2>/dev/null || true
        chown -R "$DEPLOY_USER":"$DEPLOY_USER" .next/standalone || true
        log "✅ Standalone assets staged"
    fi
    
    # Validate and correct frontend .env.production URLs using DOMAIN
    fix_frontend_env_urls
    
    # Ensure systemd units exist
    ensure_systemd_units

    # Configure Nginx with same flow as bootstrap
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
    fi

    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    log "✅ Nginx configured"

    # Restart services
    log "🚀 Restarting services..."
    # Start backend first and wait for it unless skipped
    systemctl restart ${APP_NAME}-backend || true
    if [ "$FRONTEND_ONLY" -eq 0 ] && [ "$SKIP_BACKEND_HEALTH" -eq 0 ]; then
        wait_for_service "${APP_NAME}-backend" || true
    fi
    # Start frontend after backend is healthy
    systemctl restart ${APP_NAME}-frontend || true
    # Wait for frontend
    wait_for_service "${APP_NAME}-frontend" || true
    
    log "✅ Update completed successfully"
}

main "$@"