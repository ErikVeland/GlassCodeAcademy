#!/bin/bash

# Bootstrap/Update script for GlassCode Academy
# This script provides a single turn-key solution to start the application both locally and remotely
# It handles both development and production environments

# Parse command line arguments
HELP=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            HELP=true
            shift
            ;;
        -p|--production)
            PRODUCTION=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            HELP=true
            shift
            ;;
    esac
done

# Display help if requested
if [ "$HELP" = true ]; then
    echo "GlassCode Academy Bootstrap/Update Script"
    echo ""
    echo "Usage: ./bootstrap/update.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -p, --production  Run in production mode (requires sudo)"
    echo ""
    echo "Description:"
    echo "  This script provides a single turn-key solution to start the application"
    echo "  both locally and remotely. It automatically detects the environment and"
    echo "  starts the appropriate services."
    echo ""
    echo "Examples:"
    echo "  ./bootstrap/update.sh          # Start in development mode"
    echo "  sudo ./bootstrap/update.sh -p  # Start in production mode"
    exit 0
fi

echo "🚀 GlassCode Academy Bootstrap/Update Script"

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # Stop Docker containers if they were started
    if [[ "$DOCKER_STARTED" == "true" ]]; then
        echo "🛑 Stopping Docker containers..."
        $DOCKER_COMPOSE_CMD -f docker-compose.yml stop postgres redis 2>/dev/null || true
    fi
    exit 0
}

# Set up cleanup function to run on script exit
trap cleanup EXIT INT TERM

# Progress bar helper
draw_progress() {
    local current=$1
    local max=$2
    local label="$3"
    local width=30
    local filled=$(( current * width / max ))
    local empty=$(( width - filled ))
    printf "\r["
    for ((i=0; i<filled; i++)); do printf "#"; done
    for ((i=0; i<empty; i++)); do printf "-"; done
    printf "] %s (%d/%d)" "$label" "$current" "$max"
}

# Function to check if we're in a production environment
is_production() {
    # Use command line flag if set
    if [ "$PRODUCTION" = true ]; then
        return 0
    fi
    
    # Check if we're running as root (typical for production)
    if [ "$(id -u)" -eq 0 ]; then
        return 0
    fi
    
    # Check for production environment variables
    if [ -n "${NODE_ENV:-}" ] && [ "$NODE_ENV" = "production" ]; then
        return 0
    fi
    
    # Check for production config file
    if [ -f ".env.production" ]; then
        return 0
    fi
    
    return 1
}

# Function to start database services using Docker Compose
start_database_services() {
    echo "🐳 Starting database services with Docker Compose..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        echo "❌ ERROR: docker-compose.yml not found in current directory."
        return 1
    fi
    
    # Start only the postgres and redis services
    if $DOCKER_COMPOSE_CMD -f docker-compose.yml up -d postgres redis; then
        echo "✅ Database services started successfully"
        DOCKER_STARTED="true"
        
        # Wait for services to be healthy
        echo "⏳ Waiting for database services to be ready..."
        MAX_DB_WAIT=30
        DB_WAIT=1
        while [[ $DB_WAIT -le $MAX_DB_WAIT ]]; do
            # Check if PostgreSQL is ready
            if $DOCKER_COMPOSE_CMD -f docker-compose.yml exec postgres pg_isready -U postgres >/dev/null 2>&1; then
                # Check if Redis is ready
                if $DOCKER_COMPOSE_CMD -f docker-compose.yml exec redis redis-cli ping >/dev/null 2>&1; then
                    echo "✅ All database services are ready"
                    return 0
                fi
            fi
            echo "⚠️  Database services not ready, waiting... (attempt $DB_WAIT/$MAX_DB_WAIT)"
            draw_progress "$DB_WAIT" "$MAX_DB_WAIT" "Waiting for database services"
            DB_WAIT=$((DB_WAIT + 1))
            sleep 2
        done
        echo "❌ Database services not ready after $MAX_DB_WAIT attempts"
        return 1
    else
        echo "❌ Failed to start database services"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    cd backend-node
    # Check if database is accessible before running migrations
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        if timeout 5 npm run health >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            npm run migrate
            if [ $? -ne 0 ]; then
                echo "❌ Database migrations failed"
                cd ..
                return 1
            fi
            echo "✅ Database migrations completed"
            cd ..
            return 0
        fi
        echo "⚠️  Database not accessible, waiting... (attempt $DB_CHECK/$MAX_DB_CHECKS)"
        draw_progress "$DB_CHECK" "$MAX_DB_CHECKS" "Waiting for database"
        DB_CHECK=$((DB_CHECK + 1))
        sleep 2
    done
    echo "❌ Database not accessible after $MAX_DB_CHECKS attempts, skipping migrations"
    cd ..
    return 1
}

# Function to run database seeding
run_seeding() {
    echo "🌱 Running database seeding..."
    cd backend-node
    # Check if database is accessible before running seeding
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        if timeout 5 npm run health >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            # Run basic seeding
            npm run seed
            if [ $? -ne 0 ]; then
                echo "❌ Database basic seeding failed"
                cd ..
                return 1
            fi
            echo "✅ Database basic seeding completed"
            
            # Run content seeding
            npm run seed:content
            if [ $? -ne 0 ]; then
                echo "❌ Database content seeding failed"
                cd ..
                return 1
            fi
            echo "✅ Database content seeding completed"
            cd ..
            return 0
        fi
        echo "⚠️  Database not accessible, waiting... (attempt $DB_CHECK/$MAX_DB_CHECKS)"
        draw_progress "$DB_CHECK" "$MAX_DB_CHECKS" "Waiting for database"
        DB_CHECK=$((DB_CHECK + 1))
        sleep 2
    done
    echo "❌ Database not accessible after $MAX_DB_CHECKS attempts, skipping seeding"
    cd ..
    return 1
}

# Function to start development services
start_development() {
    echo "🔧 Starting GlassCode Academy in Development Mode..."
    
    # Check if required tools are installed
    if ! command -v npm &> /dev/null
    then
        echo "❌ ERROR: npm is not installed. Please install Node.js and npm."
        exit 1
    fi

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null
    then
        echo "❌ ERROR: Docker is not installed. Please install Docker to run database services."
        exit 1
    fi
    
    # Check if docker compose is available (new syntax) or fallback to legacy docker-compose
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
        echo "✅ Using modern Docker Compose (docker compose)"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        echo "✅ Using legacy Docker Compose (docker-compose)"
    else
        echo "❌ ERROR: Docker Compose is not available. Please install Docker Desktop or Docker Compose plugin."
        exit 1
    fi
    export DOCKER_COMPOSE_CMD
    
    # Start database services
    start_database_services
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start database services, exiting"
        exit 1
    fi
    
    # Run migrations
    run_migrations
    if [ $? -ne 0 ]; then
        echo "❌ Failed to run migrations, exiting"
        exit 1
    fi
    
    # Copy latest registry.json to frontend public directory
    echo "🔄 Syncing frontend configuration..."
    cp content/registry.json glasscode/frontend/public/registry.json 2>/dev/null || echo "⚠️  Warning: Could not sync registry.json"
    
    # Start Node.js backend service
    echo "🔧 Starting Node.js backend service..."
    if [ ! -d "backend-node" ]; then
        echo "❌ ERROR: Node.js backend directory 'backend-node' not found."
        echo "Please ensure the Node.js backend has been set up correctly."
        exit 1
    fi

    cd backend-node
    if [ -x "./scripts/start-dev.sh" ]; then
        ./scripts/start-dev.sh &
    else
        echo "ℹ️  No start-dev.sh found in backend-node, running npm directly..."
        npm run dev &
    fi
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be fully ready by polling the health check endpoint
    echo "⏳ Waiting for backend to be fully loaded and healthy..."
    MAX_ATTEMPTS=30
    ATTEMPT=1
    SLEEP_INTERVAL=2
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        if curl -s -f http://localhost:8080/health >/dev/null 2>&1; then
            printf "\n"  # Clear progress line
            echo "✅ Backend health check passed: System is healthy (attempt $ATTEMPT/$MAX_ATTEMPTS)"
            break
        fi
        draw_progress "$ATTEMPT" "$MAX_ATTEMPTS" "Checking backend health"
        ATTEMPT=$((ATTEMPT + 1))
        sleep $SLEEP_INTERVAL
    done

    if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
        echo "❌ Backend failed to start properly within the expected time."
        echo "🛑 Stopping services..."
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi

    # Run seeding after backend is ready
    run_seeding
    if [ $? -ne 0 ]; then
        echo "❌ Failed to run database seeding"
        exit 1
    fi

    # Small additional delay to ensure backend is completely ready
    sleep 2

    # Start frontend service
    echo "🎨 Starting frontend service..."
    cd glasscode/frontend
    # Explicitly set PORT to 3000 to avoid conflicts
    PORT=3000 npm run dev &
    FRONTEND_PID=$!
    cd ../..

    # Wait for frontend to be fully ready by polling
    echo "⏳ Waiting for frontend to be fully loaded..."
    MAX_FE_ATTEMPTS=30
    FE_ATTEMPT=1
    while [[ $FE_ATTEMPT -le $MAX_FE_ATTEMPTS ]]; do
        if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
            printf "\n"  # Clear progress line
            echo "✅ Frontend is fully loaded and ready! (attempt $FE_ATTEMPT/$MAX_FE_ATTEMPTS)"
            break
        fi
        draw_progress "$FE_ATTEMPT" "$MAX_FE_ATTEMPTS" "Checking frontend"
        FE_ATTEMPT=$((FE_ATTEMPT + 1))
        sleep $SLEEP_INTERVAL
    done

    if [[ $FE_ATTEMPT -gt $MAX_FE_ATTEMPTS ]]; then
        echo "❌ Frontend failed to start properly within the expected time."
        echo "🛑 Stopping services..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi

    # Final health checks
    echo "📋 Performing final health checks..."
    echo "🔍 Checking backend content availability..."
    BACKEND_CONTENT_CHECK=$(curl -s http://localhost:8080/health | grep -c 'healthy')

    if [[ $BACKEND_CONTENT_CHECK -gt 0 ]]; then
        echo "✅ Backend content is accessible"
    else
        echo "⚠️  Warning: Backend content check failed"
    fi

    echo "🔍 Checking frontend content..."
    FRONTEND_CONTENT_CHECK=$(curl -s http://localhost:3000/registry.json | grep -c 'modules')

    if [[ $FRONTEND_CONTENT_CHECK -gt 0 ]]; then
        echo "✅ Frontend content is accessible"
    else
        echo "⚠️  Warning: Frontend content check failed"
    fi

    echo ""
    echo "✅ GlassCode Academy started successfully!"
    echo "🔗 Frontend: http://localhost:3000"
    echo "🔗 Backend Health Check: http://localhost:8080/health"
    echo ""
    echo "⏹️  Press Ctrl+C to stop both services"

    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
}

# Function to start production services
start_production() {
    echo "🔧 Starting GlassCode Academy in Production Mode..."
    
    # Use the existing update.sh script for production
    if [ -f "./update.sh" ]; then
        echo "🔄 Running production update script..."
        sudo ./update.sh
    else
        echo "❌ ERROR: Production update script not found."
        exit 1
    fi
}

# Main execution
if is_production; then
    start_production
else
    start_development
fi