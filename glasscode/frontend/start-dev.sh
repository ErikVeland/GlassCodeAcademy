#!/bin/bash

# Development script to start Next.js in dev — no build; cleans .next

echo "🚀 Starting GlassCode Academy Frontend (Development Mode)..."

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ ERROR: npm is not installed. Please install Node.js and npm."
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    if ! npm install; then
        echo "❌ ERROR: Failed to install dependencies."
        exit 1
    fi
fi

# Clean stale .next artifacts to avoid chunk conflicts between dev/start
CLEAN_NEXT=${CLEAN_NEXT:-true}
if [ "$CLEAN_NEXT" = "true" ]; then
    echo "🧹 Cleaning .next directory for a fresh dev start..."
    rm -rf ".next"
fi

PORT=${PORT:-3000}
echo "🔧 Starting frontend on port ${PORT}..."
echo "🔗 Frontend: http://localhost:${PORT}"
echo ""
echo "⏹️  Press Ctrl+C to stop the frontend"

# Start the frontend on chosen port
npm run dev -- -p "${PORT}"