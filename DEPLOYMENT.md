# GlassCode Academy Deployment Guide

This guide provides detailed instructions for deploying the GlassCode Academy application to various platforms.

## Docker Deployment (Recommended)

This application is designed for Docker deployment using either docker-compose or individual container deployment.

### Using Docker Compose (Local Development)
```bash
docker-compose up --build
```

This will start both the frontend (on port 3000) and backend (on port 8080) services.

### Individual Container Deployment
Build and run each service separately:

**Backend:**
```bash
cd glasscode/backend
docker build -t fullstack-backend .
docker run -p 8080:8080 fullstack-backend
```

**Frontend:**
```bash
cd glasscode/frontend
docker build -t fullstack-frontend .
docker run -p 3000:3000 fullstack-frontend
```

## Standalone Server Deployment (Recommended)

For production deployments, we recommend using our standalone server setup which runs both the frontend and backend on the same server.

### Prerequisites
- Ubuntu 24.04 LTS server
- Domain name pointing to your server (glasscode.academy)
- SSH access to the server

### Automated Deployment Script

Use the provided bootstrap script to automatically set up your GlassCode Academy server:

```bash
#!/usr/bin/env bash
set -euo pipefail

### CONFIG ###
APP_NAME="glasscode"
DEPLOY_USER="deploy"
APP_DIR="/srv/academy"
REPO="git@github.com:ErikVeland/GlassCodeAcademy.git"
DOMAIN="glasscode.academy"
EMAIL="erik@veland.au"

echo "=== Bootstrap Script for $APP_NAME ==="

### 1. Create deploy user if not exists
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo "Creating deploy user..."
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
fi

### 2. Install base packages
echo "Installing base packages..."
apt-get update
apt-get install -y \
    curl gnupg2 ca-certificates lsb-release apt-transport-https \
    build-essential pkg-config unzip zip jq git \
    nginx certbot python3-certbot-nginx ufw fail2ban

### 3. Install Node.js (20 LTS)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

### 4. Install .NET SDK 9 (fallback to 8 if needed)
echo "Installing .NET..."
curl -sSL https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -o packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm -f packages-microsoft-prod.deb
apt-get update
if ! apt-get install -y dotnet-sdk-9.0 aspnetcore-runtime-9.0; then
    echo ".NET 9 not found, trying .NET 8..."
    apt-get install -y dotnet-sdk-8.0 aspnetcore-runtime-8.0
fi

### 5. Setup directories
echo "Setting up directories..."
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

### 6. Clone or update repo
echo "Fetching repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    sudo -u "$DEPLOY_USER" git clone "$REPO" "$APP_DIR"
else
    cd "$APP_DIR"
    sudo -u "$DEPLOY_USER" git reset --hard
    sudo -u "$DEPLOY_USER" git pull
fi

### 7. Build Backend (.NET)
echo "Building backend..."
cd "$APP_DIR/glasscode/backend"
dotnet restore
dotnet build -c Release

### 8. Build Frontend (Next.js)
echo "Building frontend..."
cd "$APP_DIR/glasscode/frontend"
sudo -u "$DEPLOY_USER" npm install
sudo -u "$DEPLOY_USER" npm run build

### 9. Create systemd services
echo "Creating systemd services..."

cat >/etc/systemd/system/${APP_NAME}-dotnet.service <<EOF
[Unit]
Description=$APP_NAME .NET Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/backend
ExecStart=/usr/bin/dotnet run --no-build --urls http://0.0.0.0:8080
Restart=always
User=$DEPLOY_USER
Environment=DOTNET_ROOT=/usr/share/dotnet
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/systemd/system/${APP_NAME}-frontend.service <<EOF
[Unit]
Description=$APP_NAME Next.js Frontend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/glasscode/frontend
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always
User=$DEPLOY_USER
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reexec
systemctl enable ${APP_NAME}-dotnet ${APP_NAME}-frontend
systemctl restart ${APP_NAME}-dotnet ${APP_NAME}-frontend

### 10. Configure Nginx (www → non-www redirect + reverse proxy)
echo "Configuring Nginx..."
cat >/etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 80;
    server_name $DOMAIN;

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

### 11. Enable TLS
echo "Setting up TLS..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL || true

### 12. Firewall rules
echo "Configuring UFW..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "=== Deployment Complete! ==="
echo "Visit https://$DOMAIN"
```

## Cloud Deployment Options

### Azure App Service Deployment

### Prerequisites
- Azure account (Free tier is sufficient)
- Azure CLI installed (optional, for CLI-based deployment)

### Manual Deployment via Azure Portal

1. **Create Resource Group**
   - Name: `fullstack-academy-rg`
   - Location: `Central US` (or any region supporting free tier)

2. **Create App Service Plan**
   - Name: `fullstack-academy-plan`
   - Operating System: Linux
   - Pricing Tier: Free F1

3. **Create Web App**
   - Name: `fullstack-academy-app` (must be globally unique)
   - Runtime Stack: .NET 9 (STS) or .NET 8 (LTS)
   - Operating System: Linux
   - App Service Plan: Select the plan created above

4. **Deploy Application**
   - Go to your Web App in the Azure Portal
   - Navigate to "Deployment Center"
   - Select "ZIP Deploy"
   - Upload the deployment package: `glasscode/backend/publish.zip`

### GitHub Actions Deployment (Recommended)

1. Fork this repository to your GitHub account
2. Create the Azure resources as described above
3. Get the publishing profile from your Azure Web App:
   - In Azure Portal, go to your Web App
   - Click "Get publish profile" and download the file
4. In your GitHub repository, go to Settings > Secrets and variables > Actions
5. Create a new secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
6. Paste the contents of the publish profile file as the value
7. Push changes to trigger the deployment workflow

## Alternative Deployment Options

### Railway.app
1. Create a free Railway account
2. Create a new project
3. Connect your GitHub repository
4. Configure the service:
   - Framework Preset: .NET
   - Build Command: `cd glasscode/backend && dotnet publish -c Release -o ./publish`
   - Start Command: `cd glasscode/backend/publish && dotnet backend.dll`

## Troubleshooting

### Common Issues

1. **VM Allocation Error**
   - Ensure you're using App Service (not Virtual Machines)
   - Select Linux operating system
   - Use Free F1 pricing tier

2. **Runtime Stack Issues**
   - Use .NET 9 (STS) or .NET 8 (LTS) instead of .NET Core 9.0
   - Ensure Linux is selected as the operating system

3. **Deployment Validation Failed**
   - Try a different region
   - Use a more unique web app name
   - Ensure all resource names follow Azure naming conventions

### Testing Your Deployment

After deployment, test your backend API:
```bash
# Test GraphQL endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ dotNetLessons { id title topic } }"}' \
  https://glasscode.academy/graphql

# Test GraphQL UI
# Visit: https://glasscode.academy/graphql-ui
```

## Configuration

### CORS Settings
The backend is configured to allow CORS from:
- `http://localhost:3000` (local development)
- `https://glasscode.academy` (production deployment)
- `https://your-custom-domain.com` (custom domain)

To add your frontend domain, update the CORS policy in `glasscode/backend/Program.cs`.

### Environment Variables
The application uses the following environment variables:
- `ASPNETCORE_ENVIRONMENT` - Set to "Production" for production deployments

## Support
For deployment issues, please check:
1. Azure Free Account limitations: https://azure.microsoft.com/en-us/free/
2. Azure App Service documentation: https://docs.microsoft.com/en-us/azure/app-service/