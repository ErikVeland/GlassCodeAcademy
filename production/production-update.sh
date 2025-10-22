#!/usr/bin/env bash
# production-update.sh - Update GlassCode Academy Node.js backend in production with rollback capability

set -euo pipefail

# Configuration
APP_DIR="/srv/academy-node"
BACKUP_DIR="/srv/academy-backups"
MAX_BACKUPS=5
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

# Check if running as deploy user or root
if [[ $EUID -ne 0 ]] && [[ $(whoami) != "deploy" ]]; then
   echo_error "This script must be run as 'deploy' user or root"
   exit 1
fi

# Create backup directory if it doesn't exist
sudo mkdir -p $BACKUP_DIR

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

echo_step "Creating backup of current deployment"
sudo cp -r $APP_DIR $BACKUP_PATH

# Clean up old backups
echo_step "Cleaning up old backups (keeping last $MAX_BACKUPS)"
cd $BACKUP_DIR
ls -t | tail -n +$((MAX_BACKUPS+1)) | xargs -r sudo rm -rf

# Update repository
echo_step "Updating repository"
cd $APP_DIR
sudo -u deploy git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
sudo -u deploy git reset --hard origin/main

# Check if there are actual changes
if [ "$CURRENT_COMMIT" = "$(git rev-parse HEAD)" ]; then
    echo_step "No changes detected, nothing to update"
    # Remove backup since no changes were made
    sudo rm -rf $BACKUP_PATH
    exit 0
fi

# Install/update backend dependencies
echo_step "Installing backend dependencies"
cd backend-node
sudo -u deploy npm ci --only=production

# Run database migrations
echo_step "Running database migrations"
npx sequelize-cli db:migrate

# Build frontend
echo_step "Building frontend application"
cd ../glasscode/frontend
sudo -u deploy npm ci
sudo -u deploy npm run build

# Restart services
echo_step "Restarting services"
pm2 restart ecosystem.config.js --env production
pm2 restart ecosystem.frontend.config.js --env production

# Health check
echo_step "Performing health check"
sleep 10  # Give services time to start

HEALTH_CHECK_ATTEMPTS=3
HEALTH_CHECK_SUCCESS=false

for i in $(seq 1 $HEALTH_CHECK_ATTEMPTS); do
    if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        HEALTH_CHECK_SUCCESS=true
        break
    fi
    echo_warn "Health check failed, attempt $i/$HEALTH_CHECK_ATTEMPTS"
    sleep 5
done

if [ "$HEALTH_CHECK_SUCCESS" = false ]; then
    echo_error "Health check failed after $HEALTH_CHECK_ATTEMPTS attempts"
    echo_step "Initiating rollback..."
    
    # Stop services
    pm2 stop ecosystem.config.js
    pm2 stop ecosystem.frontend.config.js
    
    # Restore from backup
    sudo rm -rf $APP_DIR
    sudo cp -r $BACKUP_PATH $APP_DIR
    sudo chown -R deploy:deploy $APP_DIR
    
    # Restart services with rolled back version
    cd $APP_DIR/backend-node
    pm2 restart ecosystem.config.js --env production
    cd ../glasscode/frontend
    pm2 restart ecosystem.frontend.config.js --env production
    
    echo_step "Rollback completed"
    exit 1
fi

echo_step "Production update completed successfully!"
echo_step "Backup saved to: $BACKUP_PATH"