#!/usr/bin/env bash
set -Eeuo pipefail

# setup-backend.sh
# Deploys the local backend-node to a remote Linode server, installs dependencies,
# sets up a systemd service, and validates the health endpoint. Optionally configures Nginx+SSL.
#
# Usage:
#   ./setup-backend.sh
#   REMOTE_USER=deploy REMOTE_HOST=1.2.3.4 ./setup-backend.sh
#   REMOTE_HOST=1.2.3.4 API_DOMAIN=api.glasscode.academy CONFIGURE_NGINX=true EMAIL=admin@example.com ./setup-backend.sh
#   SSH_TARGET=glasscode ./setup-backend.sh    # use local ssh alias
#
# Configurable env vars (defaults shown):
#   REMOTE_USER="${REMOTE_USER:-deploy}"     # SSH user on Linode
#   REMOTE_HOST="${REMOTE_HOST:-194.195.248.217}" # Linode IP/hostname
#   SSH_TARGET="${SSH_TARGET:-}"             # If set, uses this alias directly (e.g., 'glasscode')
#   REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/glasscode/backend-node}" # Remote app dir
#   LOCAL_BACKEND_DIR="${LOCAL_BACKEND_DIR:-backend-node}"         # Local source dir
#   SERVICE_NAME="${SERVICE_NAME:-glasscode-node-backend}"         # systemd unit name
#   ENV_FILE="${ENV_FILE:-/etc/glasscode/backend-node.env}"
#   PORT="${PORT:-8080}"
#   NODE_ENV_REMOTE="${NODE_ENV_REMOTE:-test}"                      # start in test mode (SQLite)
#   CONFIGURE_NGINX="${CONFIGURE_NGINX:-false}"                     # true to configure Nginx
#   API_DOMAIN="${API_DOMAIN:-}"                                    # e.g., api.glasscode.academy
#   EMAIL="${EMAIL:-}"                                              # certbot email
#   REMOTE_SUDO_PASS="${REMOTE_SUDO_PASS:-}"                        # optional sudo password for non-interactive sudo
#
# For production later, edit the remote env file and set:
#   NODE_ENV=production
#   DATABASE_URL=postgresql://user:pass@host:5432/dbname
#   JWT_SECRET=your-super-secret-jwt-key
#   DB_SSL=true|false

REMOTE_USER="${REMOTE_USER:-deploy}"
REMOTE_HOST="${REMOTE_HOST:-194.195.248.217}"
SSH_TARGET="${SSH_TARGET:-}"
if [ -n "$SSH_TARGET" ]; then
  REMOTE="$SSH_TARGET"
else
  REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
fi
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/glasscode/backend-node}"
LOCAL_BACKEND_DIR="${LOCAL_BACKEND_DIR:-backend-node}"
SERVICE_NAME="${SERVICE_NAME:-glasscode-node-backend}"
ENV_FILE="${ENV_FILE:-/etc/glasscode/backend-node.env}"
PORT="${PORT:-8080}"
NODE_ENV_REMOTE="${NODE_ENV_REMOTE:-test}"
CONFIGURE_NGINX="${CONFIGURE_NGINX:-false}"
API_DOMAIN="${API_DOMAIN:-}"
EMAIL="${EMAIL:-}"
REMOTE_SUDO_PASS="${REMOTE_SUDO_PASS:-}"

log() { printf "\033[1;34m[setup]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[error]\033[0m %s\n" "$*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' not found on local machine.";
    exit 1;
  fi
}

trap 'err "Script failed (line $LINENO)."' ERR

# 1) Local prerequisites
log "Checking local prerequisites (ssh, rsync)..."
require_cmd ssh
require_cmd rsync

# Validate local backend path
if [ ! -d "$LOCAL_BACKEND_DIR" ] || [ ! -f "$LOCAL_BACKEND_DIR/server.js" ]; then
  err "Local backend directory '$LOCAL_BACKEND_DIR' missing or server.js not found. Run from repo root or set LOCAL_BACKEND_DIR."
  exit 1
fi

# 2) Remote connectivity
log "Checking remote connectivity to $REMOTE..."
ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE" 'echo ok' >/dev/null || {
  err "SSH connectivity failed. Ensure SSH keys/password and host are correct."; exit 1;
}

# Helper to run sudo on remote, optionally with password
run_remote_sudo() {
  local cmd="$1"
  if [ -n "$REMOTE_SUDO_PASS" ]; then
    printf "%s\n" "$REMOTE_SUDO_PASS" | ssh "$REMOTE" "sudo -S bash -lc '$cmd'"
  else
    ssh "$REMOTE" "sudo bash -lc '$cmd'"
  fi
}

# Determine the remote login user (not root)
REMOTE_LOGIN_USER=$(ssh "$REMOTE" "whoami")

# 3) Prepare remote directories
log "Ensuring remote directory structure and ownership..."
run_remote_sudo "mkdir -p /opt/glasscode && chown -R $REMOTE_LOGIN_USER:$REMOTE_LOGIN_USER /opt/glasscode"

# 4) Sync backend-node to remote
log "Syncing local '$LOCAL_BACKEND_DIR' to '$REMOTE:$REMOTE_APP_DIR'..."
rsync -avz --delete "$LOCAL_BACKEND_DIR/" "$REMOTE:$REMOTE_APP_DIR/"

# 5) Validate Node.js on remote
log "Checking Node.js on remote..."
ssh "$REMOTE" "if ! command -v node >/dev/null 2>&1; then echo 'Node.js not found (need 18+). Install Node.js and re-run.'; exit 2; fi"

# 6) Install dependencies on remote (including dev deps for SQLite in test mode)
log "Installing backend dependencies on remote with npm ci..."
ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && npm ci"

# 7) Create remote env file (minimal for test mode)
log "Creating remote env file at $ENV_FILE (PORT=$PORT, NODE_ENV=$NODE_ENV_REMOTE)..."
ssh "$REMOTE" "cat > /tmp/backend-node.env" <<EOF
PORT=$PORT
NODE_ENV=$NODE_ENV_REMOTE
# Add DB and secrets when switching to production:
# DATABASE_URL=postgresql://user:pass@host:5432/dbname
# JWT_SECRET=your-super-secret-jwt-key
# DB_SSL=false
EOF
# Compute env dir locally to avoid remote quoting issues
ENV_DIR_LOCAL="$(dirname "$ENV_FILE")"
run_remote_sudo "mkdir -p $ENV_DIR_LOCAL; if [ -f $ENV_FILE ]; then grep -qE ^PORT= $ENV_FILE || echo PORT=$PORT >> $ENV_FILE; grep -qE ^NODE_ENV= $ENV_FILE || echo NODE_ENV=$NODE_ENV_REMOTE >> $ENV_FILE; else install -m 0644 /tmp/backend-node.env $ENV_FILE; fi"

# 8) Resolve node binary path for systemd
NODE_BIN_REMOTE=$(ssh "$REMOTE" "command -v node || echo /usr/bin/node")

# 9) Create systemd unit using resolved node path
log "Creating systemd service $SERVICE_NAME..."
ssh "$REMOTE" "cat > /tmp/$SERVICE_NAME.service" <<EOF
[Unit]
Description=GlassCode Academy Node Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=$REMOTE_APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$NODE_BIN_REMOTE $REMOTE_APP_DIR/server.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
run_remote_sudo "install -m 0644 /tmp/$SERVICE_NAME.service /etc/systemd/system/$SERVICE_NAME.service"

# 10) Enable and start service
log "Enabling and starting $SERVICE_NAME..."
run_remote_sudo "systemctl daemon-reload && systemctl enable $SERVICE_NAME && systemctl restart $SERVICE_NAME"

# 11) Show status and logs
log "Fetching service status and recent logs..."
run_remote_sudo "systemctl status $SERVICE_NAME --no-pager || true; journalctl -u $SERVICE_NAME -n 200 --no-pager || true"

# 12) Validate local health
log "Validating local health endpoint on remote (http://127.0.0.1:$PORT/health)..."
# Retry up to 30s for service to bind, then dump diagnostics
run_remote_sudo "for i in {1..30}; do curl -fsS http://127.0.0.1:$PORT/health && exit 0; sleep 1; done; echo 'Health failed after retries. Showing diagnostics:'; systemctl status $SERVICE_NAME --no-pager || true; journalctl -u $SERVICE_NAME -n 200 --no-pager || true; (command -v ss >/dev/null && ss -tlnp || (command -v netstat >/dev/null && netstat -tlnp || true)) || true; exit 1"
log "Local health OK."

# 13) Optional: Configure Nginx + SSL for API_DOMAIN
if [ "$CONFIGURE_NGINX" = "true" ]; then
  if [ -z "$API_DOMAIN" ]; then
    err "CONFIGURE_NGINX=true requires API_DOMAIN to be set (e.g., api.glasscode.academy)."
    exit 1
  fi
  log "Configuring Nginx for $API_DOMAIN to proxy http://127.0.0.1:$PORT..."
  # Install Nginx if missing
  run_remote_sudo "if ! command -v nginx >/dev/null 2>&1; then if command -v apt-get >/dev/null 2>&1; then apt-get update && apt-get install -y nginx; elif command -v dnf >/dev/null 2>&1; then dnf install -y nginx; elif command -v yum >/dev/null 2>&1; then yum install -y nginx; else echo 'Package manager not found for Nginx install'; exit 1; fi; fi"
  # Create site config
  run_remote_sudo "cat > /etc/nginx/sites-available/$API_DOMAIN <<NGINX
server {
  listen 80;
  server_name $API_DOMAIN;
  access_log /var/log/nginx/${API_DOMAIN}_access.log;
  error_log /var/log/nginx/${API_DOMAIN}_error.log;

  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \"upgrade\";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX"
  # Enable site
  run_remote_sudo "mkdir -p /etc/nginx/sites-enabled && ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/$API_DOMAIN && nginx -t && systemctl reload nginx"

  # Install certbot and issue certificate (optional)
  if [ -n "$EMAIL" ]; then
    log "Installing certbot and issuing SSL certificate for $API_DOMAIN..."
    run_remote_sudo "if ! command -v certbot >/dev/null 2>&1; then if command -v apt-get >/dev/null 2>&1; then apt-get install -y certbot python3-certbot-nginx; elif command -v dnf >/dev/null 2>&1; then dnf install -y certbot python3-certbot-nginx; elif command -v yum >/dev/null 2>&1; then yum install -y certbot python3-certbot-nginx; fi; fi"
    run_remote_sudo "certbot --nginx -d '$API_DOMAIN' --email '$EMAIL' --agree-tos --non-interactive || true"
  else
    log "EMAIL not set; skipping SSL issuance. You can run certbot later."
  fi

  # Test public health (may require DNS propagation)
  log "Testing public health endpoint (https://$API_DOMAIN/health)..."
  ssh "$REMOTE" "curl -fsS https://$API_DOMAIN/health" || log "Public health check failed (DNS/SSL/Nginx may still be propagating)."
fi

log "Setup complete. Next steps:"
log "- To switch to production: ssh $REMOTE 'sudo nano $ENV_FILE' and set NODE_ENV=production, DATABASE_URL, JWT_SECRET, DB_SSL as needed; then 'sudo systemctl restart $SERVICE_NAME'"
log "- Validate: ssh $REMOTE 'curl -fsS http://127.0.0.1:$PORT/health'"
log "- If configured: verify https://$API_DOMAIN/health responds 200
","instruction":"Add SSH alias support and a helper to run remote sudo with optional password; use non-interactive file uploads for env and systemd unit files; adjust connectivity log and sudo usage across the script.","code_language":"bash","explanation":"Enhancing the setup script to use a local ssh alias and handle non-interactive sudo so it works with the user’s ssh glasscode setup."}