#!/bin/bash

# Simple build script for Next.js frontend
# This script helps avoid BuildKit issues by using explicit docker build commands

echo "Building Next.js frontend..."

# Build the Docker image
docker build -t nextjs-frontend .

if [ $? -eq 0 ]; then
    echo "Build successful!"
else
    echo "Build failed!"
    exit 1
fi