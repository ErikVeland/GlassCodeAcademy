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

echo "🔧 Starting backend on port 8080..."
echo "🔗 GraphQL endpoint: http://localhost:8080/graphql"
echo "🔗 GraphQL UI: http://localhost:8080/graphql-ui"
echo "🔗 Health check: http://localhost:8080/api/health"
echo ""
echo "⏹️  Press Ctrl+C to stop the backend"

# Start the backend
dotnet ./publish/backend.dll