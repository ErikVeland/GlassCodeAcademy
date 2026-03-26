#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${GLASSCODE_PROD_HOST:-glasscode}"
REMOTE_USER="${GLASSCODE_PROD_USER:-svc_epstein}"
REMOTE_PORT="${GLASSCODE_PROD_PORT:-22}"
SSH_KEY_PATH="${GLASSCODE_PROD_SSH_KEY_PATH:-$HOME/.ssh/id_epstein_prod_ed25519}"
REMOTE_ROOT="${GLASSCODE_PROD_ROOT:-/home/${REMOTE_USER}/services/academy}"
REMOTE_WEB_DIR="${GLASSCODE_PROD_WEB_DIR:-${REMOTE_ROOT}/apps/web}"
REMOTE_API_DIR="${GLASSCODE_PROD_API_DIR:-/opt/glasscode/backend-node}"
REMOTE_API_SERVICE="${GLASSCODE_PROD_API_SERVICE:-glasscode-node-backend.service}"
REMOTE_WEB_PM2_NAME="${GLASSCODE_PROD_WEB_PM2_NAME:-glasscode-frontend}"
REMOTE_CONTENT_DIR="${GLASSCODE_PROD_CONTENT_DIR:-${REMOTE_ROOT}/content}"

DRY_RUN=0
SKIP_QUALITY=0
SKIP_VERIFY=0
API_ONLY=0
WEB_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --skip-quality) SKIP_QUALITY=1; shift ;;
    --skip-verify) SKIP_VERIFY=1; shift ;;
    --api-only) API_ONLY=1; shift ;;
    --web-only) WEB_ONLY=1; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ "$API_ONLY" -eq 1 && "$WEB_ONLY" -eq 1 ]]; then
  echo "Cannot use --api-only and --web-only together." >&2
  exit 1
fi

SSH_OPTS=(-p "$REMOTE_PORT" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
if [[ -f "$SSH_KEY_PATH" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

remote_ssh() {
  ssh "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "$@"
}

remote_rsync() {
  rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$@"
}

if [[ "$SKIP_QUALITY" -ne 1 ]]; then
  ./scripts/quality_gate.sh
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DRY RUN: would sync source, rebuild remote services, and verify production."
  exit 0
fi

remote_ssh "mkdir -p '${REMOTE_WEB_DIR}' '${REMOTE_API_DIR}' '${REMOTE_CONTENT_DIR}'"

if [[ "$API_ONLY" -ne 1 ]]; then
  remote_rsync ./apps/web/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_WEB_DIR}/" \
    --exclude '.next' --exclude 'node_modules'
  remote_rsync ./content/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_CONTENT_DIR}/"
fi

if [[ "$WEB_ONLY" -ne 1 ]]; then
  remote_rsync ./apps/api/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_API_DIR}/" \
    --exclude 'dist' --exclude 'node_modules'
fi

remote_ssh "
  set -euo pipefail
  export NODE_ENV=production

  if [[ '$WEB_ONLY' -ne 1 ]]; then
    cd '${REMOTE_API_DIR}'
    npm ci
    npm run build
    sudo systemctl restart '${REMOTE_API_SERVICE}'
  fi

  if [[ '$API_ONLY' -ne 1 ]]; then
    cd '${REMOTE_WEB_DIR}'
    npm ci
    npm run build
    if pm2 describe '${REMOTE_WEB_PM2_NAME}' >/dev/null 2>&1; then
      pm2 restart '${REMOTE_WEB_PM2_NAME}' --update-env
    else
      pm2 start npm --name '${REMOTE_WEB_PM2_NAME}' --cwd '${REMOTE_WEB_DIR}' -- run start:next -- --port 3000
    fi
    pm2 save
  fi
"

if [[ "$SKIP_VERIFY" -ne 1 ]]; then
  ./scripts/post_deploy_verify.sh
fi

echo "✅ GlassCode Academy production deployment completed."
