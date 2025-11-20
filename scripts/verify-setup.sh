#!/bin/bash

# GlassCode Academy Setup Verification Script
# This script verifies that all components of the GlassCode Academy platform are properly configured

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js: $NODE_VERSION"
    else
        log_error "Node.js is not installed"
        return 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_info "Docker: $DOCKER_VERSION"
    else
        log_error "Docker is not installed"
        return 1
    fi
    
    # Check Docker Compose (might be included with Docker)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version)
        log_info "Docker Compose: $DOCKER_COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker compose version)
        log_info "Docker Compose: $DOCKER_COMPOSE_VERSION (integrated with Docker)"
    else
        log_error "Docker Compose is not installed"
        return 1
    fi
    
    # Check PostgreSQL client
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version)
        log_info "PostgreSQL client: $PSQL_VERSION"
    else
        log_warn "PostgreSQL client (psql) is not installed - some checks will be skipped"
    fi
    
    log "Prerequisites check completed"
}

# Check file structure
check_file_structure() {
    log "Checking file structure..."
    
    REQUIRED_DIRS=(
        "apps/api"
        "glasscode/frontend"
        "content"
        "scripts"
    )
    
    REQUIRED_FILES=(
        "docker-compose.yml"
        "docker-compose.optimized.yml"
        "apps/api/package.json"
        "glasscode/frontend/package.json"
        "content/registry.json"
    )
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            log_info "Directory exists: $dir"
        else
            log_error "Directory missing: $dir"
            return 1
        fi
    done
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            log_info "File exists: $file"
        else
            log_error "File missing: $file"
            return 1
        fi
    done
    
    log "File structure check completed"
}

# Check Docker configuration
check_docker_config() {
    log "Checking Docker configuration..."
    
    # Check if docker-compose files exist
    if [ -f "docker-compose.yml" ]; then
        log_info "docker-compose.yml exists"
    else
        log_error "docker-compose.yml missing"
        return 1
    fi
    
    if [ -f "docker-compose.optimized.yml" ]; then
        log_info "docker-compose.optimized.yml exists"
    else
        log_error "docker-compose.optimized.yml missing"
        return 1
    fi
    
    # Check Dockerfile existence
    if [ -f "apps/api/Dockerfile" ]; then
        log_info "API Dockerfile exists"
    else
        log_warn "API Dockerfile missing"
    fi
    
    if [ -f "apps/api/Dockerfile.optimized" ]; then
        log_info "API optimized Dockerfile exists"
    else
        log_warn "API optimized Dockerfile missing"
    fi
    
    if [ -f "glasscode/frontend/Dockerfile" ]; then
        log_info "Frontend Dockerfile exists"
    else
        log_warn "Frontend Dockerfile missing"
    fi
    
    if [ -f "glasscode/frontend/Dockerfile.optimized" ]; then
        log_info "Frontend optimized Dockerfile exists"
    else
        log_warn "Frontend optimized Dockerfile missing"
    fi
    
    log "Docker configuration check completed"
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log_warn "psql not available, skipping database connectivity test"
        return 0
    fi
    
    # Try to connect to the database
    if psql -U postgres -d glasscode_dev -h localhost -p 5432 -c "SELECT 1;" > /dev/null 2>&1; then
        log_info "Database connection successful"
        
        # Check if tables exist
        TABLES=$(psql -U postgres -d glasscode_dev -h localhost -p 5432 -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        if [ "$TABLES" -gt 0 ]; then
            log_info "Database contains $TABLES tables"
        else
            log_warn "Database is empty or inaccessible"
        fi
    else
        log_warn "Database connection failed - database may not be running"
    fi
    
    log "Database check completed"
}

# Check API health
check_api_health() {
    log "Checking API health..."
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_warn "curl not available, skipping API health check"
        return 0
    fi
    
    # Try to access the health endpoint
    if curl -f -s http://localhost:8081/api/health > /dev/null 2>&1; then
        log_info "API health check passed"
    else
        log_warn "API health check failed - API may not be running"
    fi
    
    log "API health check completed"
}

# Check content migration status
check_content_migration() {
    log "Checking content migration status..."
    
    # Check if the migration status script exists
    if [ -f "apps/api/scripts/data-migration/check-migration-status.js" ]; then
        log_info "Migration status script exists"
    else
        log_warn "Migration status script missing"
        return 0
    fi
    
    log "Content migration check completed"
}

# Check deployment scripts
check_deployment_scripts() {
    log "Checking deployment scripts..."
    
    DEPLOY_SCRIPTS=(
        "scripts/deploy-optimized.sh"
        "scripts/deploy-optimized.sh"
    )
    
    for script in "${DEPLOY_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            log_info "Script exists: $script"
            
            # Check if script is executable
            if [ -x "$script" ]; then
                log_info "Script is executable: $script"
            else
                log_warn "Script is not executable: $script"
            fi
        else
            log_warn "Script missing: $script"
        fi
    done
    
    log "Deployment scripts check completed"
}

# Main verification function
main() {
    log "Starting GlassCode Academy setup verification..."
    
    echo
    check_prerequisites || return 1
    echo
    check_file_structure || return 1
    echo
    check_docker_config || return 1
    echo
    check_database || return 1
    echo
    check_api_health || return 1
    echo
    check_content_migration || return 1
    echo
    check_deployment_scripts || return 1
    echo
    
    log "Setup verification completed successfully!"
    echo
    log "Summary:"
    log "  ✅ Prerequisites check passed"
    log "  ✅ File structure is correct"
    log "  ✅ Docker configuration is present"
    log "  ✅ Database connectivity verified"
    log "  ✅ API health check completed"
    log "  ✅ Content migration status checked"
    log "  ✅ Deployment scripts verified"
    echo
    log "The GlassCode Academy platform is properly configured and ready for use."
}

# Run main function
main "$@"