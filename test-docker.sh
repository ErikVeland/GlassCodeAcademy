#!/bin/bash

# Test Docker build locally before deploying to Render.com

echo "Testing Docker build locally..."

# Build the Docker image
echo "Building Docker image..."
docker build -t fullstack-academy-test .

if [ $? -eq 0 ]; then
    echo "Docker build successful!"
    echo "You can now test the image locally with:"
    echo "  docker run -p 8080:8080 fullstack-academy-test"
    echo ""
    echo "To deploy to Render.com:"
    echo "1. Push your changes to GitHub"
    echo "2. Connect your repository to Render.com"
    echo "3. Select Docker as the runtime"
else
    echo "Docker build failed. Please check the error messages above."
fi