#!/bin/bash

# Deployment script for GlassCode Academy Node.js backend

set -e  # Exit on any error

# Configuration
APP_NAME="glasscode-backend-node"
DEPLOY_DIR="/opt/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Success message
success() {
    log "${GREEN}✓ $1${NC}"
}

# Warning message
warning() {
    log "${YELLOW}! $1${NC}"
}

# Error message
error() {
    log "${RED}✗ $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    success "All dependencies are installed"
}

# Create deployment directory
create_deploy_dir() {
    log "Creating deployment directory..."
    
    if [ ! -d "$DEPLOY_DIR" ]; then
        mkdir -p $DEPLOY_DIR
        success "Created deployment directory: $DEPLOY_DIR"
    else
        warning "Deployment directory already exists: $DEPLOY_DIR"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd $DEPLOY_DIR
    npm ci --production
    
    success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd $DEPLOY_DIR
    npm run migrate
    
    success "Database migrations completed"
}

# Start application
start_application() {
    log "Starting application..."
    
    cd $DEPLOY_DIR
    pm2 start server.js --name $APP_NAME
    
    success "Application started"
}

# Run health check
run_health_check() {
    log "Running health check..."
    
    cd $DEPLOY_DIR
    npm run health
    
    success "Health check passed"
}

# Main deployment function
deploy() {
    log "Starting deployment of $APP_NAME"
    
    check_root
    check_dependencies
    create_deploy_dir
    
    log "Copying application files..."
    # Use rsync to ensure all files including hidden ones are copied correctly
    rsync -av --exclude='node_modules' --exclude='.git' . $DEPLOY_DIR/
    
    install_dependencies
    run_migrations
    start_application
    run_health_check
    
    success "Deployment completed successfully!"
}

# Run deployment
deploy