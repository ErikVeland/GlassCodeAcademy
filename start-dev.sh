#!/bin/bash

# Development script to start both frontend and backend services
# This script starts both services in the background and provides a single interface to manage them
# It also starts required database services using Docker Compose

echo "🚀 Starting GlassCode Academy (Development Mode)..."

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

# Function to stop any existing processes on specific ports
stop_existing_services() {
    echo "🔄 Stopping any existing services on ports 8080 and 3000..."
    
    # Kill processes using port 8080 (backend)
    PORT_8080_PIDS=$(lsof -ti:8080 2>/dev/null)
    if [[ -n "$PORT_8080_PIDS" ]]; then
        echo "🛑 Stopping processes on port 8080 (PIDs: $PORT_8080_PIDS)"
        kill -9 $PORT_8080_PIDS 2>/dev/null || true
        sleep 2
    fi
    
    # Kill processes using port 3000 (frontend)
    PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
    if [[ -n "$PORT_3000_PIDS" ]]; then
        echo "🛑 Stopping processes on port 3000 (PIDs: $PORT_3000_PIDS)"
        kill -9 $PORT_3000_PIDS 2>/dev/null || true
        sleep 2
    fi
    
    # Additional cleanup for any remaining node processes
    NODE_BACKEND_PIDS=$(pgrep -f "node.*backend" 2>/dev/null)
    if [[ -n "$NODE_BACKEND_PIDS" ]]; then
        echo "🛑 Stopping node backend processes (PIDs: $NODE_BACKEND_PIDS)"
        kill -9 $NODE_BACKEND_PIDS 2>/dev/null || true
    fi
    
    NODE_FRONTEND_PIDS=$(pgrep -f "node.*next" 2>/dev/null)
    if [[ -n "$NODE_FRONTEND_PIDS" ]]; then
        echo "🛑 Stopping node frontend processes (PIDs: $NODE_FRONTEND_PIDS)"
        kill -9 $NODE_FRONTEND_PIDS 2>/dev/null || true
    fi
    
    echo "✅ Existing services stopped"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    cd apps/api
    # Set database environment variables explicitly for this subprocess
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glasscode_dev"
    export DB_DIALECT="postgres"
    export DB_HOST="localhost"
    export DB_PORT="5432"
    export DB_NAME="glasscode_dev"
    export DB_USER="postgres"
    export DB_PASSWORD="postgres"
    
    # Check if database is accessible before running migrations
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        # Try to authenticate directly with node script instead of npm run health
        if timeout 5 node -e "
            // Set environment variables explicitly
            process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/glasscode_dev';
            process.env.DB_DIALECT = 'postgres';
            process.env.DB_HOST = 'localhost';
            process.env.DB_PORT = '5432';
            process.env.DB_NAME = 'glasscode_dev';
            process.env.DB_USER = 'postgres';
            process.env.DB_PASSWORD = 'postgres';
            
            const sequelize = require('./src/config/database');
            sequelize.authenticate().then(() => {
                console.log('Database connection established');
                process.exit(0);
            }).catch((err) => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
        " >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            # Run migrations directly with node
            if DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glasscode_dev" \
               DB_DIALECT="postgres" \
               DB_HOST="localhost" \
               DB_PORT="5432" \
               DB_NAME="glasscode_dev" \
               DB_USER="postgres" \
               DB_PASSWORD="postgres" \
               node scripts/run-migrations.js; then
                echo "✅ Database migrations completed"
                cd ..
                return 0
            else
                echo "❌ Database migrations failed"
                cd ..
                return 1
            fi
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
    # Set database environment variables explicitly for this subprocess
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glasscode_dev"
    export DB_DIALECT="postgres"
    export DB_HOST="localhost"
    export DB_PORT="5432"
    export DB_NAME="glasscode_dev"
    export DB_USER="postgres"
    export DB_PASSWORD="postgres"
    
    # Check if database is accessible before running seeding
    MAX_DB_CHECKS=30
    DB_CHECK=1
    while [[ $DB_CHECK -le $MAX_DB_CHECKS ]]; do
        # Try to authenticate directly with node script instead of npm run health
        if timeout 5 node -e "
            // Set environment variables explicitly
            process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/glasscode_dev';
            process.env.DB_DIALECT = 'postgres';
            process.env.DB_HOST = 'localhost';
            process.env.DB_PORT = '5432';
            process.env.DB_NAME = 'glasscode_dev';
            process.env.DB_USER = 'postgres';
            process.env.DB_PASSWORD = 'postgres';
            
            const { sequelize } = require('./src/config/database');
            sequelize.authenticate().then(() => {
                console.log('Database connection established');
                process.exit(0);
            }).catch((err) => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
        " >/dev/null 2>&1; then
            echo "✅ Database is accessible"
            # Run seeding
            if POSTGRES_HOST="localhost" npm run seed; then
                echo "✅ Database seeding completed"
                cd ..
                return 0
            else
                echo "❌ Database seeding failed"
                cd ..
                return 1
            fi
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

# Add a flag to skip migrations
SKIP_MIGRATIONS=0
for arg in "$@"; do
    if [ "$arg" = "--skip-migrations" ]; then
        SKIP_MIGRATIONS=1
    fi
done

# Start database services using Docker Compose
start_database_services
if [ $? -ne 0 ]; then
    echo "❌ Failed to start database services, exiting"
    exit 1
fi

# Set database environment variables explicitly
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glasscode_dev"
export DB_DIALECT="postgres"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="glasscode_dev"
export DB_USER="postgres"
export DB_PASSWORD="postgres"

# Run migrations unless skipped
if [ $SKIP_MIGRATIONS -eq 0 ]; then
    run_migrations
    if [ $? -ne 0 ]; then
        echo "❌ Failed to run migrations, exiting"
        exit 1
    fi
else
    echo "⏭️  Skipping database migrations"
fi

# Stop any existing services before starting new ones
stop_existing_services

# Copy latest registry.json to frontend public directory
echo "🔄 Syncing frontend configuration..."
cp content/registry.json glasscode/frontend/public/registry.json 2>/dev/null || echo "⚠️  Warning: Could not sync registry.json"

# Start Node.js backend service
echo "🔧 Starting Node.js backend service..."
if [ ! -d "apps/api" ]; then
    echo "❌ ERROR: Node.js backend directory 'apps/api' not found."
    echo "Please ensure the Node.js backend has been set up correctly."
    exit 1
fi

# Debug: Show database environment variables
echo "🔍 Database environment variables:"
echo "  DATABASE_URL: ${DATABASE_URL:-<not set>}"
echo "  DB_DIALECT: ${DB_DIALECT:-<not set>}"
echo "  DB_HOST: ${DB_HOST:-<not set>}"
echo "  DB_PORT: ${DB_PORT:-<not set>}"
echo "  DB_NAME: ${DB_NAME:-<not set>}"
echo "  DB_USER: ${DB_USER:-<not set>}"
echo "  DB_PASSWORD: ${DB_PASSWORD:-<not set>}"

cd apps/api
echo "ℹ️  Running npm run dev from apps/api directory..."
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to be fully ready by polling the health check endpoint
echo "⏳ Waiting for backend to be fully loaded and healthy..."
MAX_ATTEMPTS=30
ATTEMPT=1
SLEEP_INTERVAL=2
LAST_STATUS=""
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -s -f http://localhost:8081/health >/dev/null 2>&1; then
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
    echo "🧪 Diagnostic: backend service status"
    ps -ef | grep -E "node.*server" | grep -v grep || true
    echo "🧪 Diagnostic: listening ports (expect :8081)"
    lsof -i :8081 || true
    echo "🧪 Diagnostic: health endpoint verbose output"
    curl -v http://localhost:8081/health || true
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
cd /Users/veland/GlassCodeAcademy/glasscode/frontend
# Explicitly set PORT to 3000 to avoid conflicts
PORT=3000 npm run dev &
FRONTEND_PID=$!
cd /Users/veland/GlassCodeAcademy

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
    echo "🧪 Diagnostic: frontend dev server status"
    ps -ef | grep -E "node.*next" | grep -v grep || true
    echo "🧪 Diagnostic: listening ports (expect :3000)"
    lsof -i :3000 || true
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Final health checks
echo "📋 Performing final health checks..."
echo "🔍 Checking backend content availability..."
BACKEND_CONTENT_CHECK=$(curl -s http://localhost:8081/health | grep -c 'ok')

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
echo "✅ Services started and health checked!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend Health Check: http://localhost:8081/health"
echo ""
echo "⏹️  Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID