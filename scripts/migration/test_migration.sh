#!/bin/bash

# Script to test the complete migration process locally
set -e

echo "🚀 Starting local migration test..."

# Start PostgreSQL if not already running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "📦 Starting PostgreSQL..."
    docker run --name glasscode-postgres -e POSTGRES_PASSWORD=glasscode -e POSTGRES_USER=glasscode -e POSTGRES_DB=glasscode -p 5432:5432 -d postgres:16
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 10
else
    echo "✅ PostgreSQL is already running"
fi

# Apply schema
echo "📋 Applying database schema..."
psql "postgres://glasscode:glasscode@localhost:5432/glasscode" -f /Users/veland/GlassCodeAcademy/scripts/migration/01_schema.sql

# Run importer
echo "📥 Running content importer..."
export DATABASE_URL="postgres://glasscode:glasscode@localhost:5432/glasscode"
export CONTENT_ROOT="/Users/veland/GlassCodeAcademy/content"
export SOURCE_SNAPSHOT="$(git rev-parse --short HEAD 2>/dev/null || echo local)"

cd /Users/veland/GlassCodeAcademy/scripts && node migration/importer.js

# Run verification
echo "🔍 Verifying migration..."
cd /Users/veland/GlassCodeAcademy/scripts && node migration/verify_migration.js

echo "✅ Local migration test completed successfully!"