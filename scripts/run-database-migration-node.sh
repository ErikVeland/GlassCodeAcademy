#!/bin/bash

# Database migration script for CI/CD environments (Node.js version)
# This script runs the database migrations using the Node.js backend

set -e  # Exit on any error

echo "🚀 Starting database migration process (Node.js version)..."

# Check if we're in the right directory
if [ ! -d "backend-node" ]; then
    echo "❌ Error: backend-node directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Navigate to backend directory
cd backend-node

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found"
    exit 1
fi

echo "🔧 Node.js version: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run the migration using the migrate script
echo "🏃 Running database migration..."
npm run migrate

echo "✅ Database migration completed successfully!"