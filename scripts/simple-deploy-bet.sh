#!/usr/bin/env bash
set -euo pipefail

# Simple deployment script for bet.glasscode.academy
# This script copies the build files to the remote server

SERVER="194.195.248.217"
USER="ubuntu"
SSH_PORT="22"
TARGET_ROOT="/var/www/bet.glasscode.academy"
SOURCE_DIR="$(pwd)/bet.glasscode.academy/build"

echo "📂 Using build artifacts: $SOURCE_DIR"

# Check if build directory exists
if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "❌ Build directory not found: $SOURCE_DIR"
  exit 1
fi

# Sync build to remote target root
echo "🚀 Deploying files to $USER@$SERVER:$TARGET_ROOT"
rsync -avz --delete -e "ssh -p $SSH_PORT" "$SOURCE_DIR/" "$USER@$SERVER:$TARGET_ROOT/"

# Copy Nginx configuration
echo "🔧 Copying Nginx configuration"
scp -P "$SSH_PORT" "$(pwd)/bet.glasscode.academy.conf" "$USER@$SERVER:/tmp/bet.glasscode.academy.conf"
ssh -p "$SSH_PORT" "$USER@$SERVER" "sudo mv /tmp/bet.glasscode.academy.conf /etc/nginx/sites-available/bet.glasscode.academy.conf"

# Enable site and reload Nginx
echo "🔄 Enabling site and reloading Nginx"
ssh -p "$SSH_PORT" "$USER@$SERVER" "sudo ln -sf /etc/nginx/sites-available/bet.glasscode.academy.conf /etc/nginx/sites-enabled/bet.glasscode.academy.conf"
ssh -p "$SSH_PORT" "$USER@$SERVER" "sudo nginx -t && sudo systemctl reload nginx"

echo "🎉 Deployment complete: https://bet.glasscode.academy/"