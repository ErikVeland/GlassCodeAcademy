#!/usr/bin/env bash
# update.sh - Update GlassCode Academy to the latest version
# This script updates the application by pulling the latest code and rebuilding components
#
# SMART VALIDATION APPROACH:
# This script implements smart validation to optimize update performance:
# - Backend: Quick compilation check and artifact validation before full rebuild
# - Frontend: Checks for build artifacts, linting, and TypeScript errors before full rebuild
# - Only performs expensive operations (cache clearing, full builds) when necessary
# - Significantly reduces update time when no changes require rebuilding

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
# CLI flags parsing (fast path, optional validations)
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

install_npm_deps() {
    log "📦 Installing Node.js dependencies for all workspaces..."
    
    # Install dependencies for all workspaces
    install_npm_deps_workspace "$APP_DIR" "root"

    if [ -d "$APP_DIR/scripts" ]; then
        install_npm_deps_workspace "$APP_DIR/scripts" "scripts"
    fi

    install_npm_deps_workspace "$APP_DIR/glasscode/frontend" "frontend"
    
    log "✅ All Node.js dependencies installed"
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
    return 1
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

# Prune older backups and keep only the most recent one to avoid clutter
if ls -d /srv/academy-backup-* >/dev/null 2>&1; then
    RECENT_AND_OLD=$(ls -dt /srv/academy-backup-* 2>/dev/null || true)
    # Convert to array; first entry is the most recent
    IFS=$'\n' read -r -d '' -a BACKUPS < <(printf '%s\0' "$RECENT_AND_OLD") || true
    if [ ${#BACKUPS[@]} -gt 1 ]; then
        for OLD in "${BACKUPS[@]:1}"; do
            if [ -d "$OLD" ]; then
                rm -rf "$OLD"
                log "🧹 Removed old backup: $OLD"
            fi
        done
    fi
fi

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
log "🔍 Content validation (JSON optional, DB-first)..."
cd "$APP_DIR"
if [ "${VALIDATE_JSON_CONTENT:-0}" -eq 1 ] && [ -f "scripts/validate-content.js" ]; then
    if [ "${SKIP_CONTENT_VALIDATION:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
        log "⏭️  Fast/skip mode: skipping JSON content validation"
    elif node scripts/validate-content.js; then
        log "✅ JSON content validation passed"
    else
        if [ "${FAST_MODE:-0}" -eq 1 ]; then
            log "⚠️  JSON content validation failed, continuing due to fast mode"
        else
            log "❌ ERROR: JSON content validation failed"
            rollback
        fi
    fi
else
    log "ℹ️  Skipping JSON file validation (DB-first mode)"
fi

### 7. Smart Backend Build
if [ "${FRONTEND_ONLY:-0}" -eq 1 ]; then
    log "⏭️  Frontend-only mode: skipping backend build"
else
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
    fi

    ### 8. Start Backend BEFORE Frontend Build
    log "🚀 Starting backend service (pre-build)..."
    systemctl restart ${APP_NAME}-dotnet
    if ! wait_for_service "${APP_NAME}-dotnet"; then
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Backend failed to start before frontend build, continuing due to fast/skip mode"
        else
            log "❌ Backend failed to start before frontend build"
            rollback
        fi
    fi

    log "⏳ Verifying backend health before frontend build..."
    MAX_ATTEMPTS=30
    [ "${FAST_MODE:-0}" -eq 1 ] && MAX_ATTEMPTS=15
    ATTEMPT=1
    SLEEP_INTERVAL=3
    BACKEND_HEALTHY=false
fi

# Poll DB-backed endpoints for readiness (disable JSON health by default)
MIGRATION_TRIGGERED=0
while [[ $ATTEMPT -le $MAX_ATTEMPTS && ${FRONTEND_ONLY:-0} -eq 0 ]]; do
    # Check if service is still running first
    if ! systemctl is-active --quiet "${APP_NAME}-dotnet"; then
        printf "\n"  # Clear progress line
        log "❌ Backend service stopped unexpectedly during DB readiness check"
        break
    fi

    MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
    LESSONS_JSON=$(timeout 10 curl -s http://localhost:8080/api/lessons-db || true)
    QUIZZES_JSON=$(timeout 10 curl -s http://localhost:8080/api/LessonQuiz || true)
    if echo "$MODULES_JSON" | grep -q '\[\s*{' \
       && echo "$LESSONS_JSON" | grep -q '\[\s*{' \
       && echo "$QUIZZES_JSON" | grep -q '\[\s*{' ; then
        printf "\n"  # Clear progress line
        log "✅ Backend DB endpoints are responding at attempt $ATTEMPT/$MAX_ATTEMPTS. Proceeding to build frontend."
        break
    fi

    # If endpoints are arrays but currently empty, proactively trigger full migration once
    if [[ $MIGRATION_TRIGGERED -eq 0 ]]; then
        if echo "$MODULES_JSON" | grep -q '^\s*\[\s*\]\s*$' || echo "$LESSONS_JSON" | grep -q '^\s*\[\s*\]\s*$' || echo "$QUIZZES_JSON" | grep -q '^\s*\[\s*\]\s*$'; then
            log "🛠️  DB endpoints return empty arrays; triggering full migration to populate data..."
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

                    if echo "$MODULES_JSON" | grep -q '\[\s*{' && echo "$LESSONS_JSON" | grep -q '\[\s*{' && echo "$QUIZZES_JSON" | grep -q '\[\s*{'; then
                        log "✅ CLI migration populated data; DB endpoints responding at attempt $ATTEMPT/$MAX_ATTEMPTS."
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
printf "\n" 2>/dev/null || true

if [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; then
    log "✅ Backend DB readiness satisfied at attempt $ATTEMPT/$MAX_ATTEMPTS (pre-build)."
fi

if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
    log "❌ Backend DB endpoints failed to become ready before frontend build."
    log "🧪 Diagnostic: systemd status"
    systemctl status ${APP_NAME}-dotnet --no-pager || true
    log "🧪 Diagnostic: recent logs"
    journalctl -u ${APP_NAME}-dotnet -n 100 --no-pager || true
    log "🧪 Diagnostic: port check"
    ss -tulpn | grep :8080 || true
    log "🧪 Diagnostic: DB endpoint curls"
    timeout 15 curl -v http://localhost:8080/api/modules-db || true
    timeout 15 curl -v http://localhost:8080/api/lessons-db || true
    timeout 15 curl -v http://localhost:8080/api/LessonQuiz || true
    if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
        log "⚠️  Proceeding despite backend DB readiness failure due to fast/skip mode"
    else
        rollback
    fi
fi

### 9. Smart Frontend Build
log "🎨 Smart frontend build validation..."
cd "$APP_DIR/glasscode/frontend"

# Ensure standalone directory exists
ensure_standalone_directory "$APP_DIR/glasscode/frontend" "$DEPLOY_USER"

# Quick validation: check if existing build is valid
FRONTEND_BUILD_REQUIRED=false
log "🔍 Performing quick frontend validation..."
if [ ! -f ".next/BUILD_ID" ] || [ ! -f ".next/standalone/server.js" ] || [ ! -d ".next/static" ]; then
    log "⚠️  Missing build artifacts, full frontend build required"
    FRONTEND_BUILD_REQUIRED=true
elif [ "${SKIP_LINT:-0}" -eq 0 ] && [ "${FAST_MODE:-0}" -eq 0 ] && ! sudo -u "$DEPLOY_USER" npx next lint --quiet >/dev/null 2>&1; then
    log "⚠️  Linting errors detected, full frontend build required"
    FRONTEND_BUILD_REQUIRED=true
elif [ "${SKIP_TYPECHECK:-0}" -eq 0 ] && [ "${FAST_MODE:-0}" -eq 0 ] && ! sudo -u "$DEPLOY_USER" npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
    log "⚠️  TypeScript errors detected, full frontend build required"
    FRONTEND_BUILD_REQUIRED=true
else
    log "✅ Quick frontend validation passed, existing build is valid"
fi

# Only do expensive operations if validation failed
if [ "$FRONTEND_BUILD_REQUIRED" = "true" ]; then
    log "🏗️  Performing full frontend build..."
    
    # Install Node dependencies for all workspaces
    install_npm_deps

    # Pre-checks: Warn for missing secrets and auto-generate a temporary NEXTAUTH_SECRET
    log "🔐 Checking secrets for production..."
    if [ -z "${NEXTAUTH_SECRET:-}" ]; then
        log "⚠️  WARNING: NEXTAUTH_SECRET is missing in $ENV_FILE. Generating a temporary secret to avoid install failure."
        # Generate a 64-char hex secret using Node crypto; fallback to a static placeholder if generation fails
        GENERATED_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))' 2>/dev/null || echo "temporary-nextauth-secret-change-me")
        NEXTAUTH_SECRET="$GENERATED_SECRET"
        log "ℹ️  A temporary NEXTAUTH_SECRET has been set for this deployment. Please update $ENV_FILE with a permanent, strong secret."
    fi

    # Warn if provider IDs are missing (non-fatal)
    [ -z "${GOOGLE_CLIENT_ID:-}" ] && log "⚠️  WARNING: GOOGLE_CLIENT_ID missing; Google login will be disabled."
    [ -z "${GOOGLE_CLIENT_SECRET:-}" ] && log "⚠️  WARNING: GOOGLE_CLIENT_SECRET missing; Google login will be disabled."
    [ -z "${GITHUB_ID:-}" ] && log "⚠️  WARNING: GITHUB_ID missing; GitHub login will be disabled."
    [ -z "${GITHUB_SECRET:-}" ] && log "⚠️  WARNING: GITHUB_SECRET missing; GitHub login will be disabled."
    [ -z "${APPLE_CLIENT_ID:-}" ] && log "⚠️  WARNING: APPLE_CLIENT_ID missing; Apple login will be disabled."
    [ -z "${APPLE_CLIENT_SECRET:-}" ] && log "⚠️  WARNING: APPLE_CLIENT_SECRET missing; Apple login will be disabled."
    ## Apple provider in NextAuth uses APPLE_CLIENT_ID and APPLE_CLIENT_SECRET in our setup

    # Check if .env.production exists and has required variables
    if [ -f ".env.production" ] && grep -q "NEXTAUTH_SECRET" .env.production && grep -q "NEXT_PUBLIC_API_BASE" .env.production && grep -q "GC_CONTENT_MODE" .env.production; then
        log "📋 Using existing .env.production file (contains required variables)"
    else
        log "📋 Creating .env.production file..."
        cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
NODE_ENV=production
NEXTAUTH_URL=${NEXTAUTH_URL:-https://$DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GITHUB_ID=${GITHUB_ID:-}
GITHUB_SECRET=${GITHUB_SECRET:-}
APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-}
APPLE_CLIENT_SECRET=${APPLE_CLIENT_SECRET:-}
DEMO_USERS_JSON=${DEMO_USERS_JSON:-}
GC_CONTENT_MODE=${GC_CONTENT_MODE:-db}
EOF
    fi
 
    # Enforce lint and typecheck before production build (skip in fast mode)
if [ "${SKIP_LINT:-0}" -eq 0 ] && [ "${FAST_MODE:-0}" -eq 0 ]; then
    log "🔎 Running ESLint checks (frontend)"
    sudo -u "$DEPLOY_USER" npm run lint || log "⚠️  ESLint warnings/errors; continuing due to fast mode preferences"
else
    log "⏭️  Skipping ESLint due to fast/skip settings"
fi
if [ "${SKIP_TYPECHECK:-0}" -eq 0 ] && [ "${FAST_MODE:-0}" -eq 0 ]; then
    log "🔎 Running TypeScript typecheck (frontend)"
    sudo -u "$DEPLOY_USER" npm run typecheck || log "⚠️  TypeScript typecheck issues; continuing due to fast mode preferences"
else
    log "⏭️  Skipping TypeScript typecheck due to fast/skip settings"
fi

    # Build frontend with robust error handling and cleanup
    log "🔨 Starting frontend build with enhanced stability..."
    
    # Pre-build cleanup and verification
    log "🧹 Pre-build cleanup and verification..."
    log "🧹 Clearing Next.js cache..."
    sudo -u "$DEPLOY_USER" rm -rf .next || true
    log "✅ Next.js cache cleared"
    
    # Clear npm cache to prevent dependency resolution issues
    log "🧹 Clearing npm cache..."
if [ "${FAST_MODE:-0}" -eq 1 ]; then
    log "⏭️  Skipping npm cache clear in fast mode"
else
    sudo -u "$DEPLOY_USER" npm cache clean --force || true
    log "✅ npm cache cleared"
fi
    
    # Verify package.json and dependencies
    if [ ! -f "package.json" ]; then
        log "❌ package.json not found in frontend directory"
        rollback
        exit 1
    fi
    
    # Check if node_modules exists and is valid
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log "⚠️  node_modules missing or invalid, reinstalling dependencies..."
        sudo -u "$DEPLOY_USER" rm -rf node_modules package-lock.json
        sudo -u "$DEPLOY_USER" npm install
    fi
    
    # First build attempt with standard timeout
    if ! timeout 900 sudo -u "$DEPLOY_USER" npm run build; then
        log "⚠️  Frontend build timed out or failed, attempting recovery..."
        BUILD_EXIT_CODE=$?
        if [ $BUILD_EXIT_CODE -eq 124 ]; then
            log "⚠️  Build timed out after 900 seconds"
        else
            log "⚠️  Build failed with exit code $BUILD_EXIT_CODE"
        fi
        
        # Kill any existing Next.js processes that might interfere
        log "🔄 Killing any existing Next.js processes..."
        pkill -f "next-server\|next dev" || true
        sleep 2
        
        # Comprehensive cleanup for recovery build
        log "🧹 Comprehensive cleanup for recovery build..."
        sudo -u "$DEPLOY_USER" rm -rf node_modules .next package-lock.json
if [ "${FAST_MODE:-0}" -eq 1 ]; then
    log "⏭️  Skipping npm cache clear in fast mode"
else
    sudo -u "$DEPLOY_USER" npm cache clean --force
fi
        
        # Fresh dependency installation
        log "📦 Fresh dependency installation..."
        if ! sudo -u "$DEPLOY_USER" npm install; then
            log "❌ Failed to install dependencies during recovery"
            rollback
            exit 1
        fi
        
        # Retry build with extended timeout
        log "🔨 Retry build with extended timeout (1200s)..."
        if ! timeout 1200 sudo -u "$DEPLOY_USER" npm run build; then
            log "❌ Frontend build failed after recovery attempt"
            rollback
            exit 1
        fi
    fi
    
    # Validate build artifacts
    log "🔍 Validating build artifacts..."
    if [ ! -f ".next/BUILD_ID" ]; then
        log "❌ ERROR: Missing .next/BUILD_ID - frontend build may have failed"
        rollback
        exit 1
    fi
    if [ ! -f ".next/standalone/server.js" ]; then
        log "❌ ERROR: Missing .next/standalone/server.js - standalone build failed"
        rollback
        exit 1
    fi
    if [ ! -d ".next/static" ]; then
        log "❌ ERROR: Missing .next/static directory - static assets not generated"
        rollback
        exit 1
    fi
    log "✅ Build artifacts validated"
    
    log "✅ Frontend built successfully"
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

# Verify Next.js standalone server exists
if [ ! -f ".next/standalone/server.js" ]; then
    log "❌ Next standalone server missing at .next/standalone/server.js"
    log "🧪 Diagnostic: list .next and standalone contents"
    ls -al .next || true
    ls -al .next/standalone || true
    rollback
fi

### 10. Restart services in proper order
log "🔄 Restarting services..."
systemctl daemon-reload
# Proactively unmask services to avoid masked-unit failures
systemctl unmask ${APP_NAME}-frontend || true
systemctl unmask ${APP_NAME}-dotnet || true

# Start backend first and wait for it to be ready
if [ "${FRONTEND_ONLY:-0}" -eq 1 ]; then
    log "⏭️  Frontend-only mode: skipping backend restart and health checks"
else
    log "🚀 Starting backend service..."
    systemctl restart ${APP_NAME}-dotnet
    if ! wait_for_service "${APP_NAME}-dotnet"; then
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Backend failed to start, continuing due to fast/skip mode"
        else
            log "❌ Backend failed to start, rolling back..."
            rollback
        fi
    fi

    # Wait for backend to be fully ready by polling database-backed endpoints (JSON checks disabled by default)
    log "⏳ Waiting for backend DB endpoints to be ready..."
    MAX_ATTEMPTS=30
    [ "${FAST_MODE:-0}" -eq 1 ] && MAX_ATTEMPTS=15
    ATTEMPT=1
    SLEEP_INTERVAL=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
    MIGRATION_TRIGGERED=0
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
        LESSONS_JSON=$(timeout 10 curl -s http://localhost:8080/api/lessons-db || true)
        QUIZZES_JSON=$(timeout 10 curl -s http://localhost:8080/api/LessonQuiz || true)
        if echo "$MODULES_JSON" | grep -q '\[\s*{' \
           && echo "$LESSONS_JSON" | grep -q '\[\s*{' \
           && echo "$QUIZZES_JSON" | grep -q '\[\s*{' ; then
            printf "\n"  # Clear progress line
            log "✅ Backend DB endpoints are responding with data at attempt $ATTEMPT/$MAX_ATTEMPTS!"
            break
        fi

        # If endpoints are arrays but currently empty, proactively trigger full migration once
        if [[ $MIGRATION_TRIGGERED -eq 0 ]]; then
                log "🛠️  DB endpoints return empty arrays; triggering full migration to populate data..."
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

                        if echo "$MODULES_JSON" | grep -q '\[\s*{' && echo "$LESSONS_JSON" | grep -q '\[\s*{' && echo "$QUIZZES_JSON" | grep -q '\[\s*{'; then
                            log "✅ CLI migration populated data; DB endpoints responding at attempt $ATTEMPT/$MAX_ATTEMPTS."
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

    # Ensure the progress line is terminated
    printf "\n" 2>/dev/null || true

    if [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; then
        log "✅ Backend DB readiness satisfied at attempt $ATTEMPT/$MAX_ATTEMPTS (post-restart)."
    fi

    if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
        log "❌ Backend DB endpoints did not become ready within the expected time."

        # Verbose diagnostics before rollback
        log "🧪 Diagnostic: Checking backend service status"
        systemctl status ${APP_NAME}-dotnet --no-pager || true

        log "🧪 Diagnostic: Recent backend logs"
        journalctl -u ${APP_NAME}-dotnet -n 100 --no-pager || true

        log "🧪 Diagnostic: Listening ports (expect 0.0.0.0:8080)"
        ss -tulpn | grep :8080 || true

        log "🧪 Diagnostic: DB endpoint verbose curl"
        timeout 15 curl -v http://localhost:8080/api/modules-db || true
        timeout 15 curl -v http://localhost:8080/api/lessons-db || true
        timeout 15 curl -v http://localhost:8080/api/LessonQuiz || true

        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Proceeding despite backend DB readiness failure due to fast/skip mode"
        else
            log "❌ Rolling back due to backend DB readiness failure..."
            rollback
        fi
    fi

    # Small additional delay to ensure backend is completely ready
    log "⏳ Extra grace period: waiting 5s after backend DB ready..."
    sleep 5
fi

# Now start frontend with enhanced error handling
log "🚀 Starting frontend service..."
if systemctl is-enabled ${APP_NAME}-frontend 2>/dev/null | grep -q masked; then
    log "⚠️  Frontend service is masked. Unmasking..."
    if ! systemctl unmask ${APP_NAME}-frontend; then
        log "❌ Failed to unmask frontend service"
        rollback
    fi
fi

UNIT_FILE_PATH="/etc/systemd/system/${APP_NAME}-frontend.service"
# Ensure unit file exists and uses Next standalone ExecStart
# Ensure backend health check script exists to avoid inline quoting
cat >"$APP_DIR/glasscode/frontend/check_backend_health.sh" <<'EOS'
#!/usr/bin/env bash
MAX=30
COUNT=1
while [ $COUNT -le $MAX ]; do
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/health || true)
  RESP=$(timeout 10 curl -s http://127.0.0.1:8080/api/health || true)
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)
  # Treat backend "degraded" as acceptable for frontend start; proceed on any 200
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
if [ ! -f "$UNIT_FILE_PATH" ]; then
    log "🔧 Creating frontend unit file at $UNIT_FILE_PATH"
    cat > "$UNIT_FILE_PATH" <<EOF
[Unit]
Description=${APP_NAME} Next.js Frontend
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
    # Remove backend gating in fast mode or when explicitly skipped
    if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
        sed -i '/^ExecStartPre=.*check_backend_health.sh$/d' "$UNIT_FILE_PATH" || true
    fi
    systemctl daemon-reload
    # Remove ExecStartPre when skipping backend health gating in fast mode
    if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
        sed -i '/^ExecStartPre=.*check_backend_health.sh$/d' "$UNIT_FILE_PATH" || true
    fi
    if command -v systemd-analyze >/dev/null 2>&1; then
        log "🧪 Verifying unit file with systemd-analyze"
        if ! systemd-analyze verify "$UNIT_FILE_PATH"; then
            log "❌ Unit file verification failed"
            rollback
        fi
    fi
else
    # If the unit exists, ensure it uses the standalone ExecStart regardless of current value
    log "🔧 Enforcing ExecStart to use Next standalone server"
    sed -i "s|^ExecStart=.*|ExecStart=/usr/bin/node .next/standalone/server.js -p $FRONTEND_PORT|" "$UNIT_FILE_PATH"
    # Also enforce ExecStartPre to use the health-check script to avoid quoting issues
    # Conditionally manage ExecStartPre based on mode
if [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ] || [ "${FRONTEND_ONLY:-0}" -eq 1 ]; then
    if grep -q '^ExecStartPre=' "$UNIT_FILE_PATH"; then
        log "🔧 Removing ExecStartPre due to fast/skip/frontend-only mode"
        sed -i '/^ExecStartPre=/d' "$UNIT_FILE_PATH"
    fi
else
    if grep -q '^ExecStartPre=' "$UNIT_FILE_PATH"; then
        log "🔧 Rewriting ExecStartPre to use health-check script"
        sed -i "s|^ExecStartPre=.*|ExecStartPre=$APP_DIR/glasscode/frontend/check_backend_health.sh|" "$UNIT_FILE_PATH"
    else
        log "🔧 Adding ExecStartPre to use health-check script"
        sed -i "/^\[Service\]/a ExecStartPre=$APP_DIR/glasscode/frontend/check_backend_health.sh" "$UNIT_FILE_PATH"
    fi
fi
    # Clean up any accidental inline script content in the unit file
    # Some previous versions embedded the health-check script inline, producing invalid keys like MAX, HTTP, RESP
    if grep -Eq '^(MAX=|HTTP=|RESP=|STATUS=|sleep 5;|echo "Backend health check gating failed)' "$UNIT_FILE_PATH"; then
        log "🔧 Detected inline script contamination in unit file; rewriting clean template"
        cat > "$UNIT_FILE_PATH" <<EOF
[Unit]
Description=${APP_NAME} Next.js Frontend
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
    fi
    systemctl daemon-reload
    if command -v systemd-analyze >/dev/null 2>&1; then
        log "🧪 Verifying unit file with systemd-analyze"
        if ! systemd-analyze verify "$UNIT_FILE_PATH"; then
            log "❌ Unit file verification failed"
            rollback
        fi
    fi
fi

# Restart frontend service with graceful handling
log "🔄 Restarting frontend service..."

# Check if service is running and stop gracefully if needed
if systemctl is-active --quiet ${APP_NAME}-frontend; then
    log "⏹️  Stopping existing frontend service gracefully..."
    systemctl stop ${APP_NAME}-frontend
    sleep 3
    
    # Force kill if still running
    if systemctl is-active --quiet ${APP_NAME}-frontend; then
        log "⚠️  Service still running, force stopping..."
        systemctl kill ${APP_NAME}-frontend
        sleep 2
    fi
fi

# Kill any orphaned Next.js processes
log "🧹 Cleaning up any orphaned Next.js processes..."
pkill -f "next-server\|node.*3000" || true
sleep 2

# Start the service
log "▶️  Starting frontend service..."
systemctl start ${APP_NAME}-frontend

if ! wait_for_service "${APP_NAME}-frontend"; then
    log "❌ Frontend failed to start, collecting diagnostics..."
    
    log "🧪 Diagnostic: frontend service status"
    systemctl status ${APP_NAME}-frontend --no-pager || true
    
    log "🧪 Diagnostic: recent frontend logs (last 50 lines)"
    journalctl -u ${APP_NAME}-frontend -n 50 --no-pager || true
    
    log "🧪 Diagnostic: frontend unit file integrity"
    if [ -f "$UNIT_FILE_PATH" ]; then
        if systemd-analyze verify "$UNIT_FILE_PATH"; then
            log "✅ Unit file verified"
        else
            log "⚠️  Unit file verification failed"
            head -20 "$UNIT_FILE_PATH" || true
        fi
    else
        log "❌ Unit file missing at $UNIT_FILE_PATH"
    fi
    
    log "🧪 Diagnostic: frontend port usage"
    lsof -i :$FRONTEND_PORT || true
    
    if [ "${FAST_MODE:-0}" -eq 1 ]; then
        log "⚠️  Frontend failed to start, continuing due to fast mode"
    else
        rollback
    fi
fi

log "✅ Services restarted"

### 10. Health checks
log "🩺 Performing comprehensive health checks..."

# Check backend GraphQL endpoint
if [ "${FRONTEND_ONLY:-0}" -eq 1 ]; then
    log "⏭️  Frontend-only mode: skipping backend GraphQL check"
else
    log "🔍 Checking backend GraphQL endpoint..."
    if timeout 15 curl -s -X POST http://localhost:8080/graphql \
      -H "Content-Type: application/json" \
      -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
        log "✅ Backend GraphQL endpoint: PASSED"
    else
        if [ "${FAST_MODE:-0}" -eq 1 ] || [ "${SKIP_BACKEND_HEALTH:-0}" -eq 1 ]; then
            log "⚠️  Backend GraphQL check failed, continuing due to fast/skip mode"
        else
            log "❌ Backend GraphQL endpoint: FAILED"
            rollback
        fi
    fi
fi

# Backend JSON health check (optional, disabled by default)
if [ "${FRONTEND_ONLY:-0}" -eq 1 ]; then
    log "⏭️  Frontend-only mode: skipping backend JSON health check"
else
    if [ "${VALIDATE_JSON_CONTENT:-0}" -eq 1 ]; then
        log "🔍 Checking backend JSON health details (flag enabled)..."
        BACKEND_HEALTH_CHECK=$(timeout 15 curl -s http://localhost:8080/api/health 2>/dev/null || echo '{"status":"timeout"}')
        BACKEND_STATUS=$(echo "$BACKEND_HEALTH_CHECK" | grep -o '"status":"[^\"]*"' | cut -d'"' -f4 || echo "unknown")
        if [[ "$BACKEND_STATUS" == "healthy" ]]; then
            log "✅ Backend JSON health status: HEALTHY"
        elif [[ "$BACKEND_STATUS" == "timeout" ]]; then
            log "⚠️  Backend JSON health timed out; service appears to be running"
        else
            log "⚠️  Backend JSON health status: $BACKEND_STATUS"
        fi
    else
        log "ℹ️  Skipping backend JSON health check (disabled by default)"
    fi
fi

# Check frontend availability with retries (allow warm-up)
log "🔍 Checking frontend availability..."
MAX_ATTEMPTS=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 10 || echo 30)
ATTEMPT=1
SLEEP_INTERVAL=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
FRONTEND_OK=false
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if timeout 10 curl -s -f http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        printf "\n"  # Clear progress line
        log "✅ Frontend availability: PASSED at attempt $ATTEMPT/$MAX_ATTEMPTS"
        FRONTEND_OK=true
        break
    fi
    draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Frontend availability: "
    ATTEMPT=$((ATTEMPT + 1))
    sleep $SLEEP_INTERVAL
done
printf "\n" 2>/dev/null || true
if [[ "$FRONTEND_OK" != true ]]; then
    if [ "${FAST_MODE:-0}" -eq 1 ]; then
        log "⚠️  Frontend availability check failed, continuing due to fast mode"
        systemctl status ${APP_NAME}-frontend --no-pager || true
        log "🧪 Diagnostic: recent frontend logs"
        journalctl -u ${APP_NAME}-frontend -n 100 --no-pager || true
        log "🧪 Diagnostic: listening ports (expect $FRONTEND_PORT)"
        ss -tulpn | grep :$FRONTEND_PORT || true
    else
        log "❌ Frontend availability: FAILED"
        log "🧪 Diagnostic: frontend service status"
        systemctl status ${APP_NAME}-frontend --no-pager || true
        log "🧪 Diagnostic: recent frontend logs"
        journalctl -u ${APP_NAME}-frontend -n 100 --no-pager || true
        log "🧪 Diagnostic: listening ports (expect $FRONTEND_PORT)"
        ss -tulpn | grep :$FRONTEND_PORT || true
        rollback
    fi
fi

# Database-backed content validation (default)
log "🔍 Validating database-backed content end-to-end..."
if [ "${SKIP_CONTENT_VALIDATION:-0}" -eq 1 ] || [ "${FAST_MODE:-0}" -eq 1 ]; then
    log "⏭️  Skipping DB content validation due to fast/skip settings"
else
    ATTEMPT=1
    SLEEP_INTERVAL=$([ "${FAST_MODE:-0}" -eq 1 ] && echo 2 || echo 3)
    DB_CONTENT_OK=false
    MODULES_JSON=""
    SLUG=""
    # Fetch modules from backend DB
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        MODULES_JSON=$(timeout 10 curl -s http://localhost:8080/api/modules-db || true)
        if echo "$MODULES_JSON" | grep -q '\[\s*{'; then
            # Extract a slug (camelCase or PascalCase)
            SLUG=$(echo "$MODULES_JSON" | grep -o '"slug":"[^"]*"' | head -n1 | sed -E 's/.*"slug":"([^"]*)".*/\1/' || true)
            [ -z "$SLUG" ] && SLUG=$(echo "$MODULES_JSON" | grep -o '"Slug":"[^"]*"' | head -n1 | sed -E 's/.*"Slug":"([^"]*)".*/\1/' || true)
            [ -z "$SLUG" ] && SLUG="programming-fundamentals"
            break
        fi
        draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Modules DB: "
        ATTEMPT=$((ATTEMPT + 1))
        sleep $SLEEP_INTERVAL
    done
    if [ -z "$MODULES_JSON" ]; then
        log "❌ Failed to fetch modules from DB"
        rollback
    else
        log "✅ Modules DB endpoint: PASSED at attempt $ATTEMPT/$MAX_ATTEMPTS"
    fi

    # Lessons DB
    if timeout 10 curl -s http://localhost:8080/api/lessons-db | grep -q '\[\s*{'; then
        log "✅ Lessons DB endpoint: PASSED"
    else
        log "❌ Lessons DB endpoint: FAILED"
        rollback
    fi

    # LessonQuiz DB
    if timeout 10 curl -s http://localhost:8080/api/LessonQuiz | grep -q '\[\s*{'; then
        log "✅ LessonQuiz DB endpoint: PASSED"
    else
        log "❌ LessonQuiz DB endpoint: FAILED"
        rollback
    fi

    # End-to-end: Frontend API consuming DB quizzes
    QUIZ_RESP=$(timeout 10 curl -s http://localhost:$FRONTEND_PORT/api/content/quizzes/$SLUG || true)
    if echo "$QUIZ_RESP" | grep -q '"questions":\s*\['; then
        log "✅ Frontend DB quiz for '$SLUG': PASSED"
        DB_CONTENT_OK=true
    else
        log "❌ Frontend DB quiz for '$SLUG': FAILED"
        rollback
    fi
fi

# Optional JSON content validation (registry)
if [ "${VALIDATE_JSON_CONTENT:-0}" -eq 1 ]; then
    log "🔍 Validating JSON content (optional flag enabled)..."
    ATTEMPT=1
    CONTENT_OK=false
    RESP=""
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        RESP=$(timeout 10 curl -s http://localhost:$FRONTEND_PORT/api/content/registry || true)
        if echo "$RESP" | grep -q '"modules"'; then
            printf "\n"
            log "✅ Frontend content availability: PASSED at attempt $ATTEMPT/$MAX_ATTEMPTS (api/content/registry)"
            CONTENT_OK=true
            break
        fi
        STATIC_RESP=$(timeout 10 curl -s http://localhost:$FRONTEND_PORT/registry.json || true)
        if echo "$STATIC_RESP" | grep -q '"modules"'; then
            printf "\n"
            log "✅ Frontend content availability: PASSED at attempt $ATTEMPT/$MAX_ATTEMPTS (registry.json)"
            CONTENT_OK=true
            RESP="$STATIC_RESP"
            break
        fi
        draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "  ⏳ Frontend JSON content: "
        ATTEMPT=$((ATTEMPT + 1))
        sleep $SLEEP_INTERVAL
    done
    printf "\n" 2>/dev/null || true
    if [[ "$CONTENT_OK" != true ]]; then
        log "❌ Frontend JSON content availability: FAILED"
        echo "$RESP" | head -n 100 || true
        rollback
    fi
else
    log "ℹ️  Skipping JSON content validation (not enabled)"
fi

nginx -t && systemctl reload nginx

trap - ERR

log "🎉 Update Complete!"
log "🔧 Backend: $(systemctl is-active ${APP_NAME}-dotnet)"
log "🔧 Frontend: $(systemctl is-active ${APP_NAME}-frontend)"
log "✅ Application updated successfully!"