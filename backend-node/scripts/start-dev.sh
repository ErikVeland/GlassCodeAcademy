#!/bin/bash

# Development startup script for Node.js backend

# Function to clean up background processes on exit
cleanup() {
    echo -e "\n⏹️  Stopping Node.js backend..."
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo "✅ Node.js backend stopped."
    exit 0
}

# Trap SIGINT and SIGTERM to gracefully shutdown
trap cleanup SIGINT SIGTERM

# Start the Node.js backend
echo "🔷 Starting Node.js backend on port 8080..."
cd "$(dirname "$0")/.."
npm run dev &
BACKEND_PID=$!

echo -e "\n✅ Node.js backend started:"
echo "  🔷 Backend:  http://localhost:8080"
echo -e "\n💡 Press Ctrl+C to stop the backend."

# Wait for the background process
wait $BACKEND_PID