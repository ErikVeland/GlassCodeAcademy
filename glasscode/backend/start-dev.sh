#!/bin/bash

# Development script to start the .NET backend directly
# This bypasses Docker and runs the application natively

echo "🚀 Starting GlassCode Academy Backend (Development Mode)..."

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null
then
    echo "❌ ERROR: .NET is not installed. Please install .NET 8.0 or later."
    exit 1
fi

# Check if the publish directory exists and has the correct runtime version
REBUILD_NEEDED=false
if [ ! -d "./publish" ]; then
    echo "⚠️  Publish directory not found."
    REBUILD_NEEDED=true
else
    # Check if the runtime config is for the correct version
    if grep -q "net9.0" "./publish/backend.runtimeconfig.json" 2>/dev/null; then
        echo "⚠️  Published application is for .NET 9.0, rebuilding for .NET 8.0..."
        REBUILD_NEEDED=true
    fi
fi

# Rebuild if needed
if [ "$REBUILD_NEEDED" = true ]; then
    echo "🔨 Building the backend for .NET 8.0..."
    # Clean previous publish directory
    rm -rf ./publish
    
    # Restore dependencies
    if ! dotnet restore; then
        echo "❌ ERROR: Failed to restore dependencies."
        exit 1
    fi
    
    # Publish for .NET 8.0
    if ! dotnet publish -c Release -o ./publish --framework net8.0; then
        echo "❌ ERROR: Failed to build the backend."
        exit 1
    fi
    
    echo "✅ Backend built successfully for .NET 8.0!"
fi

DEFAULT_PORT=8080
PORT_ENV=${PORT:-}

# Find an available port starting from DEFAULT_PORT unless PORT env is set
choose_port() {
  local start_port=$1
  local max_port=$2
  local chosen=""
  if [ -n "$PORT_ENV" ]; then
    chosen="$PORT_ENV"
  else
    for ((p=start_port; p<=max_port; p++)); do
      if command -v lsof &> /dev/null; then
        if ! lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1; then
          chosen="$p"
          break
        fi
      else
        # Fallback: try nc if available
        if command -v nc &> /dev/null; then
          if ! nc -z 127.0.0.1 $p >/dev/null 2>&1; then
            chosen="$p"
            break
          fi
        else
          # No tools to check; just pick start_port
          chosen="$start_port"
          break
        fi
      fi
    done
  fi
  echo "$chosen"
}

CHOSEN_PORT=$(choose_port $DEFAULT_PORT 8100)
if [ -z "$CHOSEN_PORT" ]; then
  echo "❌ ERROR: Could not find an available port in range $DEFAULT_PORT-8100"
  exit 1
fi

echo "🔧 Starting backend on port $CHOSEN_PORT..."
echo "🔗 GraphQL endpoint: http://localhost:$CHOSEN_PORT/graphql"
echo "🔗 GraphQL UI: http://localhost:$CHOSEN_PORT/graphql-ui"
echo "🔗 Health check: http://localhost:$CHOSEN_PORT/api/health"
echo ""
echo "⏹️  Press Ctrl+C to stop the backend"

# Ensure backend binds to chosen port unless overridden
export ASPNETCORE_URLS="http://127.0.0.1:$CHOSEN_PORT"

# Start the backend
dotnet ./publish/backend.dll &

BACKEND_PID=$!

# macOS-compatible listening port diagnostic (use lsof instead of ss)
echo "🧪 Diagnostic: listening ports (expect :8080)"
if command -v lsof &> /dev/null; then
  lsof -nP -iTCP -sTCP:LISTEN | grep -E "(dotnet|backend)" || echo "No listening dotnet ports found yet."
else
  echo "lsof not found; skipping port diagnostic."
fi

# Health check loop
HEALTH_URL="http://localhost:$CHOSEN_PORT/api/health"
MAX_ATTEMPTS=30
for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  printf "[%#-30s] Checking backend health (%d/%d)\r" "" "$i" "$MAX_ATTEMPTS"
  if curl -sSf "$HEALTH_URL" > /dev/null; then
    echo "\n✅ Backend is healthy at $HEALTH_URL"
    wait $BACKEND_PID
    exit 0
  fi
  sleep 1
done

echo "\n❌ Backend failed to start properly within the expected time."
echo "🧪 Diagnostic: backend service status"
ps aux | grep -E "dotnet .*backend.dll" | grep -v grep || echo "dotnet backend process not detected."

echo "🧪 Diagnostic: health endpoint verbose output"
curl -v "$HEALTH_URL" || true

kill $BACKEND_PID 2>/dev/null || true
exit 1