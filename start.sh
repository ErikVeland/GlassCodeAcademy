#!/bin/bash

# Startup script for Fullstack Academy application

# Function to clean up background processes on exit
cleanup() {
    echo -e "\nStopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Trap SIGINT and SIGTERM to gracefully shutdown
trap cleanup SIGINT SIGTERM

# Start the .NET backend
echo "Starting .NET backend on port 5023..."
cd /Users/veland/dotNetQuiz/dot-net-quiz/backend
dotnet run &
BACKEND_PID=$!

# Start the Next.js frontend
echo "Starting Next.js frontend on port 3000..."
cd /Users/veland/dotNetQuiz/dot-net-quiz/frontend
npm run dev &
FRONTEND_PID=$!

echo -e "\nServers started:"
echo "  Backend:  http://localhost:5023"
echo "  Frontend: http://localhost:3000"
echo -e "\nPress Ctrl+C to stop both servers."

# Wait for all background processes
wait $BACKEND_PID $FRONTEND_PID