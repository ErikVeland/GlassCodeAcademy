#!/usr/bin/env bash
set -euo pipefail

# deploy-bet.sh
# Deploy static build for bet.glasscode.academy to a remote server and configure Nginx.

SERVER=""
USER="ubuntu"
SSH_PORT="22"
TARGET_ROOT="/var/www/bet.glasscode.academy"
PUSH_CONF="false"
USE_SUDO="false"
SUDO_PASS=""
REPO_URL=""
BRANCH="main"
DEST_DIR="$(pwd)/bet.glasscode.academy"
CONF_LOCAL="$(pwd)/bet.glasscode.academy.conf"
CONF_REMOTE="/etc/nginx/sites-available/bet.glasscode.academy.conf"

usage() {
  cat <<EOF
Usage: $0 --server <host> [options]

Required:
  --server <host>           Remote server hostname or IP

Optional:
  --user <name>             SSH user (default: ubuntu)
  --ssh-port <port>         SSH port (default: 22)
  --target-root <path>      Remote web root (default: /var/www/bet.glasscode.academy)
  --push-conf               Also push Nginx conf and reload Nginx
  --sudo                    Use sudo for remote Nginx and mkdir operations
  --sudo-pass <password>    Provide sudo password for non-interactive remote sudo
  --repo <git-url>          If provided, build from repo using bet-import-build.sh
  --branch <branch>         Branch for repo build (default: main)
  --dest <path>             Local destination parent dir (default: ./bet.glasscode.academy)

Notes:
  - Expects local build artifacts at <dest>/build if --repo not provided.
  - When --push-conf is set, expects bet.glasscode.academy.conf in project root.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --server) SERVER="$2"; shift 2;;
    --user) USER="$2"; shift 2;;
    --ssh-port) SSH_PORT="$2"; shift 2;;
    --target-root) TARGET_ROOT="$2"; shift 2;;
    --push-conf) PUSH_CONF="true"; shift 1;;
    --sudo) USE_SUDO="true"; shift 1;;
    --sudo-pass) SUDO_PASS="$2"; shift 2;;
    --repo) REPO_URL="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    --dest) DEST_DIR="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown option: $1"; usage; exit 1;;
  esac
done

if [[ -z "$SERVER" ]]; then
  echo "❌ --server is required"; usage; exit 1
fi

# If repo provided, perform build
if [[ -n "$REPO_URL" ]]; then
  echo "🌐 Building from repo: $REPO_URL (branch: $BRANCH)"
  "$(pwd)/scripts/bet-import-build.sh" --repo "$REPO_URL" --branch "$BRANCH" --dest "$DEST_DIR"
fi

BUILD_DIR="$DEST_DIR/build"
if [[ ! -d "$BUILD_DIR" ]]; then
  echo "❌ Build directory not found: $BUILD_DIR"
  exit 1
fi

echo "📂 Using build artifacts: $BUILD_DIR"

# Ensure remote target directory exists
MKDIR_CMD="mkdir -p '$TARGET_ROOT'"
if [[ "$USE_SUDO" == "true" ]]; then
  if [[ -n "$SUDO_PASS" ]]; then
    MKDIR_CMD="echo \"$SUDO_PASS\" | sudo -S mkdir -p '$TARGET_ROOT'"
  else
    MKDIR_CMD="sudo mkdir -p '$TARGET_ROOT'"
  fi
fi
ssh -p "$SSH_PORT" "$USER@$SERVER" "$MKDIR_CMD"

# Sync build to remote target root
echo "🚚 Syncing files to $USER@$SERVER:$TARGET_ROOT"
RSYNC_SSH="ssh -p $SSH_PORT"
rsync -az --delete -e "$RSYNC_SSH" "$BUILD_DIR/" "$USER@$SERVER:$TARGET_ROOT/"

# Optionally push Nginx conf
if [[ "$PUSH_CONF" == "true" ]]; then
  if [[ ! -f "$CONF_LOCAL" ]]; then
    echo "❌ Local Nginx conf not found: $CONF_LOCAL"; exit 1
  fi
  echo "🧰 Pushing Nginx conf to $USER@$SERVER:$CONF_REMOTE"
  SCP_PATH="$CONF_REMOTE"
  if [[ "$USE_SUDO" == "true" ]]; then
    # Push to a temp path then move with sudo
    TMP_PATH="/tmp/bet.glasscode.academy.conf"
    scp -P "$SSH_PORT" "$CONF_LOCAL" "$USER@$SERVER:$TMP_PATH"
    if [[ -n "$SUDO_PASS" ]]; then
      ssh -p "$SSH_PORT" "$USER@$SERVER" "echo \"$SUDO_PASS\" | sudo -S mv '$TMP_PATH' '$CONF_REMOTE'"
    else
      ssh -p "$SSH_PORT" "$USER@$SERVER" "sudo mv '$TMP_PATH' '$CONF_REMOTE'"
    fi
  else
    scp -P "$SSH_PORT" "$CONF_LOCAL" "$USER@$SERVER:$SCP_PATH"
  fi

  # Enable site and reload Nginx
  LN_CMD="ln -sf '$CONF_REMOTE' '/etc/nginx/sites-enabled/bet.glasscode.academy.conf'"
  TEST_CMD="nginx -t"
  RELOAD_CMD="systemctl reload nginx"
  if [[ "$USE_SUDO" == "true" ]]; then
    if [[ -n "$SUDO_PASS" ]]; then
      # Run chained commands under a single sudo session with password via -S
      ssh -p "$SSH_PORT" "$USER@$SERVER" "echo \"$SUDO_PASS\" | sudo -S bash -lc \"$LN_CMD && $TEST_CMD && $RELOAD_CMD\""
    else
      ssh -p "$SSH_PORT" "$USER@$SERVER" "sudo bash -lc \"$LN_CMD && $TEST_CMD && $RELOAD_CMD\""
    fi
  else
    ssh -p "$SSH_PORT" "$USER@$SERVER" "$LN_CMD && $TEST_CMD && $RELOAD_CMD"
  fi
  echo "✅ Nginx reloaded"
fi

echo "🎉 Deployment complete: https://bet.glasscode.academy/"