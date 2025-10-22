#!/bin/bash

# Database migration script for CI/CD environments
# This script runs the database migrations using the main application

set -e  # Exit on any error

echo "🚀 Starting database migration process..."

# Check if we're in the right directory
if [ ! -d "glasscode/backend" ]; then
    echo "❌ Error: glasscode/backend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set environment variables for migration
export RUN_AUTOMATED_MIGRATION_ONLY=1
export ASPNETCORE_ENVIRONMENT=Development

# If CONNECTION_STRING is not set, use default
if [ -z "$CONNECTION_STRING" ]; then
    export CONNECTION_STRING="Host=localhost;Database=glasscode_test;Username=postgres;Password=postgres;Port=5432"
    echo "⚠️  Using default connection string"
else
    echo "✅ Using provided connection string"
fi

echo "📋 Connection string: $CONNECTION_STRING"

# Navigate to backend directory
cd glasscode/backend

# Check if dotnet is available
if ! command -v dotnet &> /dev/null; then
    echo "❌ Error: .NET SDK not found"
    exit 1
fi

echo "🔧 .NET version: $(dotnet --version)"

# Restore dependencies
echo "📦 Restoring .NET dependencies..."
dotnet restore

# Run the migration using the main application with migration-only mode
echo "🏃 Running database migration..."
dotnet run --project backend.csproj

echo "✅ Database migration completed successfully!"