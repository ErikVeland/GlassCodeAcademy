#!/bin/bash

# Simple build script for .NET backend
# This script helps avoid BuildKit issues by using explicit docker build commands

echo "🏗️  Building .NET backend..."

# Build the Docker image
docker build -t dotnet-backend .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi