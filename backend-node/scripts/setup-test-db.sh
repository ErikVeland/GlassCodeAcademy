#!/bin/bash

# PostgreSQL Test Database Setup Script
# This script creates a PostgreSQL test database for running tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="glasscode_test"
DB_USER="test_user"
DB_PASSWORD="test_password"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${GREEN}PostgreSQL Test Database Setup${NC}"
echo "================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  macOS: brew services start postgresql"
    echo "  Ubuntu: sudo systemctl start postgresql"
    echo "  Windows: Start PostgreSQL service"
    exit 1
fi

echo "PostgreSQL is running ✓"
echo ""

# Create test database
echo "Creating test database..."
if psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Dropped existing database"
    else
        echo "Keeping existing database"
        DB_EXISTS=true
    fi
fi

if [ "$DB_EXISTS" != "true" ]; then
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}Database created successfully ✓${NC}"
fi

# Create test user
echo ""
echo "Creating test user..."
if psql -h $DB_HOST -p $DB_PORT -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${YELLOW}User '$DB_USER' already exists${NC}"
else
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    echo -e "${GREEN}User created successfully ✓${NC}"
fi

# Grant privileges
echo ""
echo "Granting privileges..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;"
echo -e "${GREEN}Privileges granted ✓${NC}"

# Create .env.test file
echo ""
echo "Creating .env.test file..."
if [ -f ".env.test" ]; then
    echo -e "${YELLOW}.env.test already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.test"
        ENV_CREATED=false
    fi
fi

if [ "$ENV_CREATED" != "false" ]; then
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test

# PostgreSQL Test Database
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

# Redis (if needed)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret for tests
JWT_SECRET=test-jwt-secret-for-testing-only-min-32-chars

# Disable external services
SENTRY_DSN=
ENABLE_TRACING=false

# Test settings
LOG_LEVEL=error
ENABLE_QUERY_LOGGING=false
EOF
    echo -e "${GREEN}.env.test created successfully ✓${NC}"
fi

# Test connection
echo ""
echo "Testing database connection..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}Connection successful ✓${NC}"
else
    echo -e "${RED}Connection failed ✗${NC}"
    echo "Please check your PostgreSQL configuration"
    exit 1
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run migrations: NODE_ENV=test npx sequelize-cli db:migrate"
echo "  2. Run tests: npm test"
echo ""
echo "Database details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Connection: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
