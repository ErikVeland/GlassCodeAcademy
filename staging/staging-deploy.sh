#!/usr/bin/env bash
# staging-deploy.sh - Deploy GlassCode Academy Node.js backend to staging environment

set -euo pipefail

# Configuration
APP_NAME="glasscode-node"
DEPLOY_USER="deploy"
APP_DIR="/srv/academy-node"
STAGING_DOMAIN="staging.glasscode.academy"
REPO="https://github.com/ErikVeland/GlassCodeAcademy.git"
NODE_VERSION="18"
FRONTEND_PORT="3000"
BACKEND_PORT="8080"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    log "❌ ERROR: This script must be run as root (use sudo)"
    exit 1
fi

log "🚀 Starting staging deployment for $APP_NAME"

# Install required packages
log "📦 Installing required packages..."
apt-get update
apt-get install -y curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Install Node.js
log "📦 Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
apt-get install -y nodejs

# Create deploy user if it doesn't exist
log "👤 Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
fi

# Create application directory
log "📁 Creating application directory..."
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# Clone or update repository
log "📥 Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
    sudo -u "$DEPLOY_USER" git -C "$APP_DIR" pull
else
    sudo -u "$DEPLOY_USER" git clone "$REPO" "$APP_DIR"
fi

# Install backend dependencies
log "📦 Installing backend dependencies..."
cd "$APP_DIR/backend-node"
sudo -u "$DEPLOY_USER" npm ci --production

# Create environment file
log "⚙️  Creating environment configuration..."
cat > "$APP_DIR/backend-node/.env" <<EOF
NODE_ENV=staging
PORT=$BACKEND_PORT
DATABASE_URL=postgresql://glasscode_staging:password@localhost:5432/glasscode_staging
JWT_SECRET=$(openssl rand -hex 32)
EOF

# Set up PostgreSQL database
log "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE USER glasscode_staging WITH PASSWORD 'password';
CREATE DATABASE glasscode_staging OWNER glasscode_staging;
\c glasscode_staging
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
EOF

# Run database migrations
log "🔄 Running database migrations..."
cd "$APP_DIR/backend-node"
sudo -u "$DEPLOY_USER" npm run migrate

# Seed database with initial data
log "🌱 Seeding database..."
sudo -u "$DEPLOY_USER" npm run seed

# Create systemd service for backend
log "⚙️  Creating systemd service..."
cat > /etc/systemd/system/"$APP_NAME"-backend.service <<EOF
[Unit]
Description=GlassCode Academy Node.js Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR/backend-node
EnvironmentFile=$APP_DIR/backend-node/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
log "🔄 Enabling systemd service..."
systemctl daemon-reload
systemctl enable "$APP_NAME"-backend.service

# Create systemd service for frontend
log "⚙️  Creating frontend systemd service..."
cat > /etc/systemd/system/"$APP_NAME"-frontend.service <<EOF
[Unit]
Description=GlassCode Academy Frontend
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR/glasscode/frontend
ExecStart=/usr/bin/node .next/standalone/server.js -p $FRONTEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable frontend service
log "🔄 Enabling frontend systemd service..."
systemctl daemon-reload
systemctl enable "$APP_NAME"-frontend.service

# Configure NGINX
log "⚙️  Configuring NGINX..."
cat > /etc/nginx/sites-available/"$APP_NAME" <<EOF
upstream backend {
    server 127.0.0.1:$BACKEND_PORT;
}

upstream frontend {
    server 127.0.0.1:$FRONTEND_PORT;
}

server {
    listen 80;
    listen [::]:80;
    server_name $STAGING_DOMAIN;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $STAGING_DOMAIN;
    
    # SSL Configuration (self-signed for staging)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Frontend Application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # GraphQL Proxy (for backward compatibility)
    location /graphql {
        proxy_pass http://backend/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
EOF

# Enable NGINX site
log "🔗 Enabling NGINX site..."
ln -sf /etc/nginx/sites-available/"$APP_NAME" /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Start services
log "🚀 Starting services..."
systemctl start "$APP_NAME"-backend.service
systemctl start "$APP_NAME"-frontend.service

# Wait for services to start
log "⏳ Waiting for services to start..."
sleep 10

# Health checks
log "🔍 Performing health checks..."

# Check backend health
if curl -s http://localhost:$BACKEND_PORT/health | grep -q '"success":true'; then
    log "✅ Backend health check passed"
else
    log "❌ Backend health check failed"
    systemctl status "$APP_NAME"-backend.service --no-pager || true
    journalctl -u "$APP_NAME"-backend.service -n 20 --no-pager || true
fi

# Check frontend health
if curl -s http://localhost:$FRONTEND_PORT/ | grep -q '<html'; then
    log "✅ Frontend health check passed"
else
    log "❌ Frontend health check failed"
    systemctl status "$APP_NAME"-frontend.service --no-pager || true
    journalctl -u "$APP_NAME"-frontend.service -n 20 --no-pager || true
fi

log "🎉 Staging deployment completed!"
log "🌐 Access your application at: https://$STAGING_DOMAIN"
log "📊 Backend API documentation available at: https://$STAGING_DOMAIN/api/docs"