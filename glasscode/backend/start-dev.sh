#!/bin/bash

# Development script to start the .NET backend directly
# This bypasses Docker and runs the application natively

# Always operate from the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting GlassCode Academy Backend (Development Mode)..."

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null
then
    echo "❌ ERROR: .NET is not installed. Please install .NET 8.0 or later."
    exit 1
fi

# Check if the publish directory exists and has the correct runtime version
REBUILD_NEEDED=true
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
    if ! dotnet restore ./backend.csproj; then
        echo "❌ ERROR: Failed to restore dependencies."
        exit 1
    fi
    
    # Publish for .NET 8.0
    if ! dotnet publish ./backend.csproj -c Release -o ./publish --framework net8.0; then
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
# Set environment defaults for development
export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"
# Build connection string from environment if not explicitly provided
export ConnectionStrings__DefaultConnection="${ConnectionStrings__DefaultConnection:-Host=${DB_HOST:-127.0.0.1};Database=${DB_NAME:-glasscode_dev};Username=${DB_USER:-postgres};Password=${DB_PASSWORD:-postgres};Port=${DB_PORT:-5432}}"

# Attempt to ensure PostgreSQL is reachable; start service via Homebrew if not
DB_CHECK_HOST="${DB_HOST:-127.0.0.1}"
DB_CHECK_PORT="${DB_PORT:-5432}"
DB_CHECK_USER="${DB_USER:-postgres}"
DB_CHECK_PASS="${DB_PASSWORD:-postgres}"

if command -v psql >/dev/null 2>&1; then
  PSQL_BIN="psql"
elif command -v brew >/dev/null 2>&1 && brew --prefix postgresql@16 >/dev/null 2>&1; then
  PSQL_BIN="$(brew --prefix postgresql@16)/bin/psql"
elif [ -x "/usr/local/opt/postgresql@16/bin/psql" ]; then
  PSQL_BIN="/usr/local/opt/postgresql@16/bin/psql"
else
  PSQL_BIN="psql"
fi

echo "🧪 Checking PostgreSQL connectivity to ${DB_CHECK_HOST}:${DB_CHECK_PORT}..."
if ! PGPASSWORD="$DB_CHECK_PASS" "$PSQL_BIN" -h "$DB_CHECK_HOST" -p "$DB_CHECK_PORT" -U "$DB_CHECK_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
  echo "⚠️  Postgres not reachable; attempting to start service via Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql@16 || true
  fi
fi

# Wait for PostgreSQL readiness
READY_MAX=30
READY=0
for ((i=1; i<=READY_MAX; i++)); do
  if PGPASSWORD="$DB_CHECK_PASS" "$PSQL_BIN" -h "$DB_CHECK_HOST" -p "$DB_CHECK_PORT" -U "$DB_CHECK_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready at ${DB_CHECK_HOST}:${DB_CHECK_PORT} (attempt $i/$READY_MAX)"
    READY=1
    break
  fi
  printf "[%#-30s] Waiting for PostgreSQL (%d/%d)\r" "" "$i" "$READY_MAX"
  sleep 1
  # Retry starting service once more in case it failed
  if command -v brew >/dev/null 2>&1 && [ "$i" -eq 3 ]; then
    brew services start postgresql@16 || true
  fi
done
if [ "$READY" -ne 1 ]; then
  echo "\n❌ ERROR: PostgreSQL is not reachable on ${DB_CHECK_HOST}:${DB_CHECK_PORT} after ${READY_MAX}s"
  exit 1
fi

# Ensure development database exists
PG_DB="${DB_NAME:-glasscode_dev}"
PG_EXISTS_CMD="SELECT 1 FROM pg_database WHERE datname='${PG_DB}'"
PG_DB_EXISTS=$(PGPASSWORD="$DB_CHECK_PASS" "$PSQL_BIN" -h "$DB_CHECK_HOST" -p "$DB_CHECK_PORT" -U "$DB_CHECK_USER" -d postgres -tAc "$PG_EXISTS_CMD" 2>/dev/null || echo "")
if [ "$PG_DB_EXISTS" != "1" ]; then
  echo "🗄️  Creating database '${PG_DB}'..."
  PGPASSWORD="$DB_CHECK_PASS" "$PSQL_BIN" -h "$DB_CHECK_HOST" -p "$DB_CHECK_PORT" -U "$DB_CHECK_USER" -d postgres -c "CREATE DATABASE ${PG_DB};" || true
fi

# Start the backend
dotnet ./publish/backend.dll &

BACKEND_PID=$!

# macOS-compatible listening port diagnostic (use lsof instead of ss)
echo "🧪 Diagnostic: listening ports (expect :$CHOSEN_PORT)"
if command -v lsof &> /dev/null; then
  lsof -nP -iTCP -sTCP:LISTEN | grep -E "(dotnet|backend)" || echo "No listening dotnet ports found yet."
else
  echo "lsof not found; skipping port diagnostic."
fi

# Health check loop
HEALTH_URL="http://localhost:$CHOSEN_PORT/api/health"
MAX_ATTEMPTS=60
for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  printf "[%#-30s] Checking backend health (%d/%d)\r" "" "$i" "$MAX_ATTEMPTS"
  if curl -sSf "$HEALTH_URL" > /dev/null; then
    printf "\n✅ Backend is healthy at %s at attempt %d/%d\n" "$HEALTH_URL" "$i" "$MAX_ATTEMPTS"
    wait $BACKEND_PID
    exit 0
  fi
  sleep 1
 done

printf "\n❌ Backend failed to start properly within the expected time.\n"
echo "🧪 Diagnostic: backend service status"
ps aux | grep -E "dotnet .*backend.dll" | grep -v grep || echo "dotnet backend process not detected."

echo "🧪 Diagnostic: health endpoint verbose output"
curl -v "$HEALTH_URL" || true

kill $BACKEND_PID 2>/dev/null || true
exit 1