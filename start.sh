#!/bin/bash

# Startup script for GlassCode Academy application

# Function to clean up background processes on exit
cleanup() {
    echo -e "\n⏹️  Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped."
    exit 0
}

# Trap SIGINT and SIGTERM to gracefully shutdown
trap cleanup SIGINT SIGTERM

# Start the .NET backend
echo "🔷 Starting .NET backend on port 5023..."
cd "$(dirname "$0")/glasscode/backend"
dotnet run &
BACKEND_PID=$!

# Start the Next.js frontend
echo "🎨 Starting Next.js frontend on port 3000..."
cd "$(dirname "$0")/glasscode/frontend"
npm run dev &
FRONTEND_PID=$!

echo -e "\n✅ Servers started:"
echo "  🔷 Backend:  http://localhost:5023"
echo "  🎨 Frontend: http://localhost:3000"
echo -e "\n💡 Press Ctrl+C to stop both servers."

# Wait for all background processes
wait $BACKEND_PID $FRONTEND_PID