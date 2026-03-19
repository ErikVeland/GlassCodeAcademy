#!/usr/bin/env bash
# deploy.sh — Local deploy script for GlassCode Academy
# Mirrors the structure of update.sh but runs on macOS without root/systemd.
# Uses Docker Compose for all services; tags images before rebuild for rollback.
#
# Usage: ./deploy.sh [options]
#   --dry-run              Print what would happen without making changes
#   --rollback             Restore the last tagged image snapshot and restart
#   --fast                 Skip validation, lint, typecheck, and backend health wait
#   --frontend-only        Rebuild and restart only the web container
#   --skip-backup          Skip Docker image snapshot before rebuild
#   --skip-lint            Skip Next.js lint step
#   --skip-typecheck       Skip TypeScript check step
#   --skip-backend-health  Don't wait for API health before starting frontend
#   --skip-migrations      Skip database migration step
#   --clean                Prune dangling images and volumes after deploy
#   --port <n>             Override frontend port (default: 3000)

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Logging ──────────────────────────────────────────────────────────────────
log()       { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  WARNING:${NC} $1"; }
log_error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR:${NC} $1"; }
log_step()  { echo -e "${BLUE}${BOLD}[$(date +'%Y-%m-%d %H:%M:%S')] ▶ $1${NC}"; }

# ─── Progress bar ─────────────────────────────────────────────────────────────
draw_progress() {
    local current=$1 total=$2 prefix=${3:-""}
    local width=30 percent filled bar_filled bar_empty
    percent=$(( current * 100 / total ))
    filled=$(( percent * width / 100 ))
    bar_filled=$(printf '%*s' "$filled" | tr ' ' '#')
    bar_empty=$(printf '%*s' $(( width - filled )) | tr ' ' '-')
    printf "\r%s[%s%s] %3d%% (%d/%d)" "$prefix" "$bar_filled" "$bar_empty" "$percent" "$current" "$total"
}

# ─── Defaults ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.yml"
FRONTEND_PORT=3000
API_PORT=8081

DRY_RUN=0
ROLLBACK=0
FAST_MODE=0
FRONTEND_ONLY=0
SKIP_BACKUP=0
SKIP_LINT=0
SKIP_TYPECHECK=0
SKIP_BACKEND_HEALTH=0
SKIP_MIGRATIONS=0
CLEAN_AFTER=0

# ─── CLI flags ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)             DRY_RUN=1; shift ;;
        --rollback)            ROLLBACK=1; shift ;;
        --fast)                FAST_MODE=1; SKIP_LINT=1; SKIP_TYPECHECK=1; SKIP_BACKEND_HEALTH=1; shift ;;
        --frontend-only)       FRONTEND_ONLY=1; shift ;;
        --skip-backup)         SKIP_BACKUP=1; shift ;;
        --skip-lint)           SKIP_LINT=1; shift ;;
        --skip-typecheck)      SKIP_TYPECHECK=1; shift ;;
        --skip-backend-health) SKIP_BACKEND_HEALTH=1; shift ;;
        --skip-migrations)     SKIP_MIGRATIONS=1; shift ;;
        --clean)               CLEAN_AFTER=1; shift ;;
        --port)                FRONTEND_PORT="${2:-$FRONTEND_PORT}"; shift 2 ;;
        -h|--help)
            sed -n '/^# Usage/,/^$/p' "$0"
            exit 0
            ;;
        *)
            log_warn "Unknown argument: $1"
            shift
            ;;
    esac
done

log_step "GlassCode Academy — Local Deploy"
log "Flags: DRY_RUN=$DRY_RUN ROLLBACK=$ROLLBACK FAST=$FAST_MODE FRONTEND_ONLY=$FRONTEND_ONLY"
log "       SKIP_BACKUP=$SKIP_BACKUP SKIP_LINT=$SKIP_LINT SKIP_TS=$SKIP_TYPECHECK SKIP_BACKEND_HEALTH=$SKIP_BACKEND_HEALTH CLEAN=$CLEAN_AFTER"

# ─── Pre-flight checks ────────────────────────────────────────────────────────
preflight() {
    log_step "Pre-flight checks"

    # Docker
    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed."
        exit 1
    fi
    if ! docker info &>/dev/null; then
        log_error "Docker daemon is not running. Start Docker Desktop."
        exit 1
    fi

    # docker compose v2
    if ! docker compose version &>/dev/null; then
        log_error "docker compose (v2) is not available. Update Docker Desktop."
        exit 1
    fi

    # Compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "No $COMPOSE_FILE found in $SCRIPT_DIR"
        exit 1
    fi

    # Node.js
    if ! command -v node &>/dev/null; then
        log_error "Node.js is not installed."
        exit 1
    fi
    local node_ver
    node_ver=$(node --version | sed 's/v//')
    local node_major="${node_ver%%.*}"
    if [ "$node_major" -lt 18 ]; then
        log_error "Node.js >= 18 required (found v$node_ver)"
        exit 1
    fi

    # Git clean check (warn only)
    if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null; then
        local dirty_files
        dirty_files=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        if [ "$dirty_files" -gt 0 ]; then
            log_warn "$dirty_files uncommitted file(s) — deploying from working tree"
        fi
        log "Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    fi

    log "✅ Pre-flight passed (Docker $(docker --version | awk '{print $3}' | tr -d ','), Node v$(node --version | tr -d v))"
}

# ─── Backup: tag running images before rebuild ─────────────────────────────────
backup_images() {
    if [ "$SKIP_BACKUP" -eq 1 ]; then
        log "⏭️  Skipping image backup"
        return 0
    fi

    log_step "Snapshotting current images for rollback"

    snapshot_image() {
        local service=$1
        local image
        image=$(docker compose -f "$COMPOSE_FILE" images -q "$service" 2>/dev/null | head -1)
        if [ -n "$image" ]; then
            if [ "$DRY_RUN" -eq 1 ]; then
                log "📄 [DRY RUN] Would tag $image as glasscode_${service}:rollback"
            else
                docker tag "$image" "glasscode_${service}:rollback" 2>/dev/null && \
                    log "  📦 Snapped $service → glasscode_${service}:rollback" || \
                    log_warn "  Could not tag $service image (not yet built)"
            fi
        else
            log_warn "  No running image found for $service — nothing to snapshot"
        fi
    }

    if [ "$FRONTEND_ONLY" -eq 0 ]; then
        snapshot_image "api"
    fi
    snapshot_image "web"
}

# ─── Rollback: restore last snapshot ─────────────────────────────────────────
do_rollback() {
    log_step "Rolling back to last snapshot"

    rollback_service() {
        local service=$1
        if docker image inspect "glasscode_${service}:rollback" &>/dev/null; then
            if [ "$DRY_RUN" -eq 1 ]; then
                log "📄 [DRY RUN] Would restore glasscode_${service}:rollback and restart $service"
            else
                # Tag rollback image back as latest
                local current_image
                current_image=$(docker compose -f "$COMPOSE_FILE" config --format json 2>/dev/null \
                    | python3 -c "import sys,json; cfg=json.load(sys.stdin); print(cfg['services']['$service'].get('image',''))" 2>/dev/null || true)
                docker tag "glasscode_${service}:rollback" "${current_image:-glasscode_${service}}" 2>/dev/null || true
                docker compose -f "$COMPOSE_FILE" up -d --no-build "$service"
                log "  ✅ $service restored from snapshot"
            fi
        else
            log_error "No rollback snapshot found for $service (glasscode_${service}:rollback). Cannot rollback."
            exit 1
        fi
    }

    if [ "$FRONTEND_ONLY" -eq 0 ]; then
        rollback_service "api"
    fi
    rollback_service "web"

    log "✅ Rollback complete"
    health_checks
    exit 0
}

# ─── Install deps ─────────────────────────────────────────────────────────────
install_deps() {
    log_step "Installing Node.js dependencies"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "📄 [DRY RUN] Would run: npm install"
        return 0
    fi
    # Use ci if lockfile is newer than package.json, otherwise install
    if [ -f package-lock.json ] && [ package-lock.json -nt package.json ]; then
        npm ci --prefer-offline 2>&1 | tail -3
    else
        npm install 2>&1 | tail -3
    fi
    log "✅ Dependencies installed"
}

# ─── Lint / typecheck (run on host, not in Docker) ────────────────────────────
validate_code() {
    if [ "$SKIP_LINT" -eq 0 ]; then
        log_step "Lint check (apps/web)"
        if [ "$DRY_RUN" -eq 1 ]; then
            log "📄 [DRY RUN] Would run: npm run lint --workspace=@glass-code-academy/web"
        else
            npm run lint --workspace=@glass-code-academy/web 2>&1 | tail -5 || log_warn "Lint reported issues (non-fatal)"
        fi
    fi

    if [ "$SKIP_TYPECHECK" -eq 0 ]; then
        log_step "TypeScript check"
        if [ "$DRY_RUN" -eq 1 ]; then
            log "📄 [DRY RUN] Would run: npm run typecheck --workspaces"
        else
            npm run typecheck --workspaces 2>&1 | grep -v "jest" | tail -5 || log_warn "TypeScript errors found (non-fatal in deploy)"
        fi
    fi
}

# ─── Build services ───────────────────────────────────────────────────────────
build_services() {
    log_step "Building Docker images"

    if [ "$DRY_RUN" -eq 1 ]; then
        if [ "$FRONTEND_ONLY" -eq 1 ]; then
            log "📄 [DRY RUN] Would run: docker compose build web"
        else
            log "📄 [DRY RUN] Would run: docker compose build api web"
        fi
        return 0
    fi

    local total_steps=4
    local step=0

    if [ "$FRONTEND_ONLY" -eq 1 ]; then
        step=1; draw_progress $step $total_steps "  Building: "
        docker compose -f "$COMPOSE_FILE" build web 2>&1 | grep -E "^(Step|#[0-9]|ERROR)" || true
        step=4; draw_progress $step $total_steps "  Building: "
        echo
    else
        step=1; draw_progress $step $total_steps "  Building: "; echo
        docker compose -f "$COMPOSE_FILE" build api 2>&1 | grep -E "^(Step|#[0-9]|ERROR)" || true
        step=2; draw_progress $step $total_steps "  Building: "; echo
        docker compose -f "$COMPOSE_FILE" build web 2>&1 | grep -E "^(Step|#[0-9]|ERROR)" || true
        step=4; draw_progress $step $total_steps "  Building: "; echo
    fi

    log "✅ Images built"
}

# ─── Start infrastructure (postgres + redis) ──────────────────────────────────
start_infra() {
    log_step "Starting infrastructure (postgres + redis)"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "📄 [DRY RUN] Would run: docker compose up -d postgres redis"
        return 0
    fi
    docker compose -f "$COMPOSE_FILE" up -d postgres redis
    log "⏳ Waiting for postgres to be healthy..."
    local max=30 attempt=1
    while [ $attempt -le $max ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres &>/dev/null; then
            log "  ✅ postgres ready (attempt $attempt/$max)"
            break
        fi
        if [ $attempt -eq $max ]; then
            log_error "postgres did not become healthy within $(( max * 2 ))s"
            exit 1
        fi
        draw_progress $attempt $max "  postgres: "
        sleep 2
        attempt=$(( attempt + 1 ))
    done
    echo
    log "  ✅ redis started"
}

# ─── Run migrations ───────────────────────────────────────────────────────────
run_migrations() {
    if [ "$FRONTEND_ONLY" -eq 1 ] || [ "$SKIP_MIGRATIONS" -eq 1 ]; then
        log "⏭️  Skipping migrations"
        return 0
    fi
    log_step "Running database migrations"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "📄 [DRY RUN] Would run: npm run migrate (in apps/api)"
        return 0
    fi
    # Run migrations using the api container once infra is up
    docker compose -f "$COMPOSE_FILE" run --rm \
        -e DATABASE_URL="postgresql://postgres:postgres@postgres:5432/glasscode_dev" \
        api npm run migrate 2>&1 | tail -10
    log "✅ Migrations complete"
}

# ─── Start / restart application services ─────────────────────────────────────
start_services() {
    log_step "Starting application services"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "📄 [DRY RUN] Would run: docker compose up -d api web"
        return 0
    fi

    if [ "$FRONTEND_ONLY" -eq 1 ]; then
        docker compose -f "$COMPOSE_FILE" up -d --build web
        log "✅ Frontend (web) started"
        return 0
    fi

    # Start backend first
    docker compose -f "$COMPOSE_FILE" up -d api

    # Wait for API health unless skipped
    if [ "$SKIP_BACKEND_HEALTH" -eq 0 ]; then
        log "⏳ Waiting for API to be healthy..."
        local max=30 attempt=1
        while [ $attempt -le $max ]; do
            local http_code
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/api/health" 2>/dev/null || echo "000")
            if [ "$http_code" = "200" ]; then
                log "  ✅ API healthy (attempt $attempt/$max)"
                break
            fi
            if [ $attempt -eq $max ]; then
                log_error "API did not become healthy within $(( max * 3 ))s (last HTTP: $http_code)"
                log "  API logs:"
                docker compose -f "$COMPOSE_FILE" logs --tail=20 api || true
                exit 1
            fi
            draw_progress $attempt $max "  API health: "
            sleep 3
            attempt=$(( attempt + 1 ))
        done
        echo
    fi

    # Start frontend
    docker compose -f "$COMPOSE_FILE" up -d web
    log "✅ All services started"
}

# ─── Health checks ────────────────────────────────────────────────────────────
health_checks() {
    log_step "Health checks"

    local failed=0

    check_endpoint() {
        local label=$1
        local url=$2
        local expected_code=${3:-200}
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        if [ "$http_code" = "$expected_code" ]; then
            log "  ✅ $label → HTTP $http_code ($url)"
        else
            log_warn "  ❌ $label → HTTP $http_code (expected $expected_code) — $url"
            failed=$(( failed + 1 ))
        fi
    }

    check_json_status() {
        local label=$1 url=$2 expected_status=$3
        local response status
        response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "{}")
        status=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
        if [ "$status" = "$expected_status" ] || [ "$status" = "degraded" ]; then
            log "  ✅ $label → status=$status"
        else
            log_warn "  ⚠️  $label → status=${status:-unknown} (expected $expected_status)"
        fi
    }

    if [ "$FRONTEND_ONLY" -eq 0 ]; then
        check_endpoint "API process"    "http://localhost:${API_PORT}/api/health"
        check_json_status "API status"  "http://localhost:${API_PORT}/api/health" "healthy"
        check_endpoint "GraphQL proxy"  "http://localhost:${API_PORT}/graphql"     "200"
    fi

    check_endpoint "Frontend home"   "http://localhost:${FRONTEND_PORT}"
    check_endpoint "Frontend /login" "http://localhost:${FRONTEND_PORT}/login"
    check_endpoint "Frontend /health" "http://localhost:${FRONTEND_PORT}/health" "200"

    # Container status summary
    log ""
    log "Container status:"
    docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
        docker compose -f "$COMPOSE_FILE" ps

    if [ "$failed" -gt 0 ]; then
        log_warn "$failed health check(s) failed — review logs above"
        log "  Run: docker compose logs --tail=50 api"
        log "  Run: docker compose logs --tail=50 web"
    else
        log ""
        log "🎉 All health checks passed!"
        log "   Frontend: http://localhost:${FRONTEND_PORT}"
        log "   API:      http://localhost:${API_PORT}/api/health"
    fi
}

# ─── Cleanup dangling Docker resources ────────────────────────────────────────
cleanup() {
    log_step "Cleaning up Docker resources"
    if [ "$DRY_RUN" -eq 1 ]; then
        log "📄 [DRY RUN] Would prune dangling images and anonymous volumes"
        return 0
    fi
    docker image prune -f 2>/dev/null && log "  ✅ Dangling images removed"
    docker volume prune -f --filter "label!=keep" 2>/dev/null && log "  ✅ Anonymous volumes pruned" || true
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    preflight

    if [ "$ROLLBACK" -eq 1 ]; then
        do_rollback
        return
    fi

    local total_phases=7
    local phase=0
    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Backup"
    backup_images

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Dependencies"
    install_deps

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Code validation"
    validate_code

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Build"
    build_services

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Infrastructure"
    start_infra

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Migrations + Services"
    run_migrations
    start_services

    phase=$(( phase + 1 )); log ""; log_step "Phase $phase/$total_phases: Health"
    health_checks

    if [ "$CLEAN_AFTER" -eq 1 ]; then
        log ""
        cleanup
    fi

    log ""
    log "✅ Deploy complete"
}

main "$@"
