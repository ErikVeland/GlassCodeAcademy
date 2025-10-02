#!/bin/bash

# Fullstack Academy Backend Deployment Script

echo "Building Fullstack Academy Backend..."
dotnet publish -c Release -o ./publish

echo "Build completed. Files are in the 'publish' directory."
echo "You can now deploy these files to your preferred .NET hosting platform."

echo "For Azure App Service deployment:"
echo "1. Zip the contents of the 'publish' directory"
echo "2. Deploy using Azure CLI or the Azure Portal"

echo "For other platforms, refer to the README.md file for specific instructions."