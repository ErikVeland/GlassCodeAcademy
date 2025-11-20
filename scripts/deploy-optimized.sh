#!/bin/bash

# GlassCode Academy Optimized Deployment Script
# This script streamlines the deployment process for the GlassCode Academy platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log "Docker and Docker Compose are installed"
}

# Stop any existing containers
stop_existing_containers() {
    log "Stopping existing containers..."
    if docker-compose -f docker-compose.optimized.yml down; then
        log "Existing containers stopped successfully"
    else
        log_warn "No existing containers found or failed to stop"
    fi
}

# Build and start services
build_and_start_services() {
    log "Building and starting services..."
    
    # Build services
    if ! docker-compose -f docker-compose.optimized.yml build; then
        log_error "Failed to build services"
        exit 1
    fi
    
    # Start services
    if ! docker-compose -f docker-compose.optimized.yml up -d; then
        log_error "Failed to start services"
        exit 1
    fi
    
    log "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    log "Waiting for PostgreSQL..."
    until docker-compose -f docker-compose.optimized.yml exec postgres pg_isready > /dev/null 2>&1; do
        sleep 2
    done
    log "PostgreSQL is ready"
    
    # Wait for Redis
    log "Waiting for Redis..."
    until docker-compose -f docker-compose.optimized.yml exec redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
    done
    log "Redis is ready"
    
    # Wait for API service
    log "Waiting for API service..."
    sleep 10  # Give some time for the API to start
    
    # Wait for frontend service
    log "Waiting for Frontend service..."
    sleep 10  # Give some time for the frontend to start
    
    log "All services are running"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Run migrations in the API container
    if docker-compose -f docker-compose.optimized.yml exec api npm run migrate; then
        log "Database migrations completed successfully"
    else
        log_error "Failed to run database migrations"
        exit 1
    fi
}

# Seed initial data
seed_data() {
    log "Seeding initial data..."
    
    # Seed content data
    if docker-compose -f docker-compose.optimized.yml exec api npm run seed:content; then
        log "Content data seeded successfully"
    else
        log_warn "Failed to seed content data"
    fi
    
    # Seed academy data
    if docker-compose -f docker-compose.optimized.yml exec api npm run seed:academy; then
        log "Academy data seeded successfully"
    else
        log_warn "Failed to seed academy data"
    fi
}

# Check service health
check_service_health() {
    log "Checking service health..."
    
    # Check API health
    if docker-compose -f docker-compose.optimized.yml exec api npm run health; then
        log "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Check detailed health
    if docker-compose -f docker-compose.optimized.yml exec api npm run health:test; then
        log "Detailed health check passed"
    else
        log_warn "Detailed health check had some issues"
    fi
}

# Display service status
display_status() {
    log "Displaying service status..."
    docker-compose -f docker-compose.optimized.yml ps
}

# Main deployment function
main() {
    log "Starting GlassCode Academy optimized deployment..."
    
    # Check prerequisites
    check_docker
    
    # Stop existing containers
    stop_existing_containers
    
    # Build and start services
    build_and_start_services
    
    # Wait for services to be healthy
    wait_for_services
    
    # Run database migrations
    run_migrations
    
    # Seed initial data
    seed_data
    
    # Check service health
    check_service_health
    
    # Display final status
    display_status
    
    log "Deployment completed successfully!"
    echo
    log "You can access the application at:"
    log "  Frontend: http://localhost:3000"
    log "  API: http://localhost:8081"
    log "  PostgreSQL: localhost:5432"
    log "  Redis: localhost:6379"
}

# Run main function
main "$@"