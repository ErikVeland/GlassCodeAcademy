#!/bin/bash

# Exit on error
set -e

APP_DIR="/var/www/about-glasscode-academy"
REPO_URL="https://github.com/ErikVeland/GlassCodeAcademy.git" # Replace with actual repo URL if different

echo "🚀 Starting deployment..."

# 1. Clone or pull repo
if [ -d "$APP_DIR" ]; then
  echo "📂 Updating existing repository..."
  cd "$APP_DIR"
  git pull
else
  echo "📂 Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build app
echo "🏗️ Building application..."
npm run build

# 4. Start/Restart with PM2
echo "🚀 Starting with PM2..."
if pm2 list | grep -q "glass-academy"; then
  pm2 restart glass-academy
else
  pm2 start npm --name "glass-academy" -- run start -- -p 3000
  pm2 save
fi

echo "✅ Deployment complete! App running on port 3000."
