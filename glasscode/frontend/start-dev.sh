#!/bin/bash

# Development script to start the Next.js frontend directly

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

# Check if .next directory exists, if not build the project
if [ ! -d ".next" ]; then
    echo "⚠️  .next directory not found. Building project..."
    if ! npm run build; then
        echo "❌ ERROR: Failed to build the project."
        exit 1
    fi
    echo "✅ Build completed successfully."
fi

echo "🔧 Starting frontend on port 3000..."
echo "🔗 Frontend: http://localhost:3000"
echo ""
echo "⏹️  Press Ctrl+C to stop the frontend"

# Start the frontend
npm run dev