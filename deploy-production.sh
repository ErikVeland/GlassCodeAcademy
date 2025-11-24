#!/bin/bash

# GlassCode Academy Production Deployment Script
# This script sets up the entire application for production deployment

set -euo pipefail

# Configuration
PROJECT_DIR="/srv/glasscode-academy"
BACKUP_DIR="/srv/glasscode-backups"
DOMAIN="glasscode.academy"
API_DOMAIN="api.glasscode.academy"
NODE_VERSION="18"
DEPLOY_USER="glasscode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo_error "This script must be run as root"
   exit 1
fi

# Ensure we're in home directory
cd ~

echo_step "Starting GlassCode Academy production deployment"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo_step "Installing Node.js $NODE_VERSION"
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
    apt-get install -y nodejs
else
    CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $CURRENT_NODE -lt $NODE_VERSION ]]; then
        echo_step "Upgrading Node.js to $NODE_VERSION"
        curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
        apt-get install -y nodejs
    fi
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo_step "Installing PM2 process manager"
    npm install -g pm2
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo_step "Installing PostgreSQL"
    apt-get update
    apt-get install -y postgresql postgresql-contrib
fi

# Install Redis if not present
if ! command -v redis-cli &> /dev/null; then
    echo_step "Installing Redis"
    apt-get install -y redis-server
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo_step "Installing Nginx"
    apt-get install -y nginx
fi

# Create deploy user if it doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo_step "Creating deploy user: $DEPLOY_USER"
    useradd -m -s /bin/bash $DEPLOY_USER
fi

# Create project directory
echo_step "Setting up project directory"
mkdir -p $PROJECT_DIR
chown $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo_step "Updating existing repository"
    cd $PROJECT_DIR
    sudo -u $DEPLOY_USER git reset --hard HEAD
    sudo -u $DEPLOY_USER git pull origin main
else
    echo_step "Cloning repository"
    sudo -u $DEPLOY_USER git clone https://github.com/ErikVeland/GlassCodeAcademy.git $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Switch to deploy user
chown -R $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR

# Create backup directory
mkdir -p $BACKUP_DIR
chown $DEPLOY_USER:$DEPLOY_USER $BACKUP_DIR

# Install backend dependencies
echo_step "Installing backend dependencies"
cd $PROJECT_DIR/apps/api
sudo -u $DEPLOY_USER npm ci --only=production

# Create production environment file for backend
echo_step "Configuring backend environment variables"
cat > .env.production << 'EOF'
# GlassCode Academy - Production Environment Configuration
PORT=8081
NODE_ENV=production
DATABASE_URL=postgresql://glasscode_app:$(openssl rand -base64 32)@localhost:5432/glasscode_prod
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
CACHE_TTL=3600
CORS_ORIGIN=https://glasscode.academy
EOF

# Set up PostgreSQL database
echo_step "Setting up PostgreSQL database"
DB_PASSWORD=$(grep DATABASE_URL .env.production | cut -d'=' -f2 | cut -d':' -f3 | cut -d'@' -f1)
sudo -u postgres psql << EOF
CREATE USER glasscode_app WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE glasscode_prod OWNER glasscode_app;
GRANT ALL PRIVILEGES ON DATABASE glasscode_prod TO glasscode_app;
EOF

# Run database migrations
echo_step "Running database migrations"
sudo -u $DEPLOY_USER npm run migrate

# Install frontend dependencies and build
echo_step "Building frontend application"
cd $PROJECT_DIR/glasscode/frontend
sudo -u $DEPLOY_USER npm ci
sudo -u $DEPLOY_USER npm run build

# Create production environment file for frontend
echo_step "Configuring frontend environment variables"
cat > .env.production << EOF
NEXT_PUBLIC_API_BASE=https://api.glasscode.academy
NEXT_PUBLIC_BASE_URL=https://glasscode.academy
NODE_ENV=production
NEXTAUTH_URL=https://glasscode.academy
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

# Configure Nginx as reverse proxy
echo_step "Configuring Nginx reverse proxy"

# Create Nginx configuration for frontend
cat > /etc/nginx/sites-available/glasscode-frontend << 'EOF'
server {
    listen 80;
    server_name glasscode.academy;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create Nginx configuration for backend API
cat > /etc/nginx/sites-available/glasscode-api << 'EOF'
server {
    listen 80;
    server_name api.glasscode.academy;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/glasscode-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/glasscode-api /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t && systemctl reload nginx

# Set up SSL with Let's Encrypt
echo_step "Setting up SSL certificates"
if ! command -v certbot &> /dev/null; then
    echo_step "Installing Certbot"
    apt-get install -y certbot python3-certbot-nginx
fi

# Obtain certificates (this will require domain validation)
echo_warn "You will need to manually complete SSL certificate setup with Let's Encrypt"
echo_warn "Run: certbot --nginx -d glasscode.academy -d api.glasscode.academy"

# Create PM2 ecosystem files
echo_step "Creating PM2 configuration files"

# Create backend ecosystem file
cat > $PROJECT_DIR/apps/api/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'glasscode-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8081
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8081
    }
  }]
};
EOF

# Create frontend ecosystem file
cat > $PROJECT_DIR/glasscode/frontend/ecosystem.frontend.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'glasscode-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start backend with PM2
echo_step "Starting backend service"
cd $PROJECT_DIR/apps/api
sudo -u $DEPLOY_USER pm2 start ecosystem.config.js --env production

# Start frontend with PM2
echo_step "Starting frontend service"
cd $PROJECT_DIR/glasscode/frontend
sudo -u $DEPLOY_USER pm2 start ecosystem.frontend.config.js --env production

# Save PM2 configuration
sudo -u $DEPLOY_USER pm2 save

# Set up PM2 to start on boot
echo_step "Setting up PM2 startup"
env PATH=$PATH:/usr/bin pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER

# Set up monitoring and logging
echo_step "Setting up system monitoring"

# Create log rotation configuration
cat > /etc/logrotate.d/glasscode << 'EOF'
/srv/glasscode-academy/apps/api/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 glasscode glasscode
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/srv/glasscode-academy/glasscode/frontend/.next/server/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 glasscode glasscode
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Final health checks
echo_step "Performing final health checks"

# Wait for services to start
sleep 10

# Check if services are running
if sudo -u $DEPLOY_USER pm2 list | grep -q "glasscode-api"; then
    echo_step "Backend service is running"
else
    echo_error "Backend service failed to start"
    exit 1
fi

if sudo -u $DEPLOY_USER pm2 list | grep -q "glasscode-frontend"; then
    echo_step "Frontend service is running"
else
    echo_error "Frontend service failed to start"
    exit 1
fi

echo_step "Production deployment completed successfully!"
echo_info "Next steps:"
echo_info "1. Set up DNS records for glasscode.academy and api.glasscode.academy"
echo_info "2. Complete SSL certificate setup with: certbot --nginx -d glasscode.academy -d api.glasscode.academy"
echo_info "3. Configure OAuth providers in the environment files"
echo_info "4. Set up monitoring and alerting as needed"
echo_info ""
echo_info "Access your application at:"
echo_info "Frontend: https://glasscode.academy"
echo_info "API: https://api.glasscode.academy"
echo_info "Database: glasscode_prod (user: glasscode_app)"
echo_info "PM2 services are running and configured to start on boot"