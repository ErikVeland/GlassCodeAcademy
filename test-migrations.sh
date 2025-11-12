#!/bin/bash

echo "Testing database migrations..."

# Set environment variables explicitly
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glasscode_dev"
export DB_DIALECT="postgres"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="glasscode_dev"
export DB_USER="postgres"
export DB_PASSWORD="postgres"

echo "Environment variables:"
echo "DATABASE_URL: $DATABASE_URL"
echo "DB_DIALECT: $DB_DIALECT"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: ****"

cd backend-node

echo "Testing database connection..."
node -e "
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
"

echo "Running migrations..."
node scripts/run-migrations.js