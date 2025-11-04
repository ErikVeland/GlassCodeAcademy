#!/usr/bin/env bash
set -euo pipefail

# Deployment script to be run on the glasscode server
# This script sets up the bet.glasscode.academy site

echo "🔧 Setting up bet.glasscode.academy deployment"

# Create web root directory
sudo mkdir -p /var/www/bet.glasscode.academy

# Copy build files
sudo cp -r /tmp/bet-build/* /var/www/bet.glasscode.academy/

# Copy Nginx configuration
sudo cp /tmp/bet.glasscode.academy.conf /etc/nginx/sites-available/bet.glasscode.academy.conf

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bet.glasscode.academy.conf /etc/nginx/sites-enabled/bet.glasscode.academy.conf

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete: https://bet.glasscode.academy/"