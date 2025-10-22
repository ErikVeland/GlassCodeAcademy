#!/usr/bin/env bash
# production-deploy.sh - Deploy GlassCode Academy Node.js backend to production environment

set -euo pipefail

# Configuration
APP_NAME="glasscode-node"
DEPLOY_USER="deploy"
APP_DIR="/srv/academy-node"
PROD_DOMAIN="api.glasscode.academy"
REPO="https://github.com/ErikVeland/GlassCodeAcademy.git"
NODE_VERSION="18"
FRONTEND_PORT="3000"
BACKEND_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo_error "This script should not be run as root"
   exit 1
fi

# Ensure we're in home directory
cd ~

echo_step "Starting production deployment of $APP_NAME"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo_step "Installing Node.js $NODE_VERSION"
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $CURRENT_NODE -lt $NODE_VERSION ]]; then
        echo_step "Upgrading Node.js to $NODE_VERSION"
        curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo_step "Installing PM2 process manager"
    sudo npm install -g pm2
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo_step "Installing PostgreSQL"
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Create deploy user if it doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo_step "Creating deploy user: $DEPLOY_USER"
    sudo useradd -m -s /bin/bash $DEPLOY_USER
fi

# Create application directory
echo_step "Setting up application directory"
sudo mkdir -p $APP_DIR
sudo chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo_step "Updating existing repository"
    cd $APP_DIR
    git reset --hard HEAD
    git pull origin main
else
    echo_step "Cloning repository"
    git clone $REPO $APP_DIR
    cd $APP_DIR
fi

# Switch to deploy user
sudo chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Install backend dependencies
echo_step "Installing backend dependencies"
cd backend-node
npm ci --only=production

# Create .env file for production
echo_step "Configuring environment variables"
cat > .env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_prod
DB_USER=glasscode_app
DB_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
EOF

# Set up PostgreSQL database
echo_step "Setting up PostgreSQL database"
sudo -u postgres psql << EOF
CREATE USER glasscode_app WITH PASSWORD '$(grep DB_PASS .env | cut -d'=' -f2)';
CREATE DATABASE glasscode_prod OWNER glasscode_app;
GRANT ALL PRIVILEGES ON DATABASE glasscode_prod TO glasscode_app;
EOF

# Run database migrations
echo_step "Running database migrations"
npx sequelize-cli db:migrate

# Start backend with PM2
echo_step "Starting backend service"
pm2 start ecosystem.config.js --env production || pm2 restart ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
echo_step "Setting up PM2 startup"
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER

# Configure Nginx as reverse proxy
echo_step "Configuring Nginx reverse proxy"
sudo apt-get install -y nginx

cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $PROD_DOMAIN;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
echo_step "Setting up SSL certificate"
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi

sudo certbot --nginx -d $PROD_DOMAIN --non-interactive --agree-tos --email admin@glasscode.academy

# Install frontend dependencies and build
echo_step "Building frontend application"
cd ../glasscode/frontend
npm ci
npm run build

# Serve frontend with PM2
echo_step "Starting frontend service"
pm2 start ecosystem.frontend.config.js --env production || pm2 restart ecosystem.frontend.config.js --env production

# Save PM2 configuration
pm2 save

echo_step "Production deployment completed successfully!"
echo_step "Backend API: https://$PROD_DOMAIN"
echo_step "Frontend: https://glasscode.academy"
echo_step "Database: glasscode_prod (user: glasscode_app)"
echo_step "PM2 services are running and configured to start on boot"