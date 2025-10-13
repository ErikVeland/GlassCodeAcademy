# GlassCode Academy Deployment Guide

This guide provides detailed instructions for deploying the GlassCode Academy application to various platforms.

## Content Management

All lesson content is organized in the [content/lessons/](file:///Users/veland/GlassCodeAcademy/content/lessons) directory with each module having its own JSON file containing all lessons for that technology.

## Standalone Server Deployment (Recommended)

For production deployments, we recommend using our standalone server setup which runs both the frontend and backend on the same server.

### Prerequisites
- Ubuntu 24.04 LTS server
- Domain name pointing to your server (glasscode.academy)
- SSH access to the server

### Configuration

Before running the deployment scripts, you can customize the deployment by creating a `.env` file:

```bash
# Copy the example configuration file
cp .env.example .env

# Edit the configuration for your environment
nano .env
```

The available configuration options are:
- `APP_NAME`: Application name (used for service names)
- `DEPLOY_USER`: System user to run the application
- `APP_DIR`: Directory where the application will be installed
- `REPO`: Git repository to clone
- `DOMAIN`: Domain name for the application
- `EMAIL`: Email for SSL certificate registration

### Automated Deployment Script

Use the provided bootstrap script to automatically set up your GlassCode Academy server:

```bash
# Download the bootstrap script
curl -O https://raw.githubusercontent.com/ErikVeland/GlassCodeAcademy/main/bootstrap.sh

# Make it executable
chmod +x bootstrap.sh

# Run the script
./bootstrap.sh
```

Or run it directly:
```bash
curl -s https://raw.githubusercontent.com/ErikVeland/GlassCodeAcademy/main/bootstrap.sh | bash
```

The bootstrap script will:
1. Install all required dependencies (Node.js, .NET, NGINX, etc.)
2. Create a dedicated deploy user
3. Clone the repository
4. Build both frontend and backend applications
5. Set up systemd services for automatic startup
6. Configure NGINX as a reverse proxy
7. Set up SSL certificates with Let's Encrypt
8. Configure firewall rules
9. Perform health checks

### Updating the Application

To update the application to the latest version, use the update script:

```bash
# Download the update script
curl -O https://raw.githubusercontent.com/ErikVeland/GlassCodeAcademy/main/update.sh

# Make it executable
chmod +x update.sh

# Run the update script
./update.sh
```

The update script will:
1. Backup the current installation
2. Pull the latest changes from the repository
3. Update the global.json file with the current .NET SDK version
4. Update dependencies and rebuild the application
5. Restart services
6. Perform health checks

### Manual Steps (if not using bootstrap)

If you prefer to set up the server manually, follow these steps:

1. **Create deploy user**
   ```bash
   sudo adduser --disabled-password --gecos "" deploy
   sudo usermod -aG sudo deploy
   ```

2. **Install dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # .NET
   curl -sSL https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -o packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   sudo apt-get update
   sudo apt-get install -y dotnet-sdk-9.0 aspnetcore-runtime-9.0
   ```

3. **Clone repository**
   ```bash
   sudo -u deploy git clone git@github.com:ErikVeland/GlassCodeAcademy.git /srv/academy
   ```

4. **Build applications**
   ```bash
   # Backend
   cd /srv/academy/glasscode/backend
   sudo -u deploy dotnet restore
   sudo -u deploy dotnet build -c Release
   
   # Frontend
   cd /srv/academy/glasscode/frontend
   sudo -u deploy npm ci
   sudo -u deploy npm run build
   ```

5. **Set up systemd services**
   Create `/etc/systemd/system/glasscode-dotnet.service` and `/etc/systemd/system/glasscode-frontend.service` as shown in the bootstrap script.

6. **Configure NGINX**
   Create NGINX configuration as shown in the bootstrap script.

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

4. **Frontend systemd service is masked (fails to start)**
   - Symptom:
     ```
     Failed to restart glasscode-frontend.service: Unit glasscode-frontend.service is masked.
     ```
   - Cause: The unit is masked (e.g., via `systemctl mask`) and cannot be started or restarted.
   - Fix:
     ```bash
     # Unmask and reload
     sudo systemctl unmask glasscode-frontend
     sudo systemctl daemon-reload
     
     # Ensure unit uses Next standalone server
     # ExecStart=/usr/bin/node .next/standalone/server.js -p 3000
     sudo sed -i 's|ExecStart=.\+|ExecStart=/usr/bin/node .next/standalone/server.js -p 3000|' /etc/systemd/system/glasscode-frontend.service
     sudo systemctl daemon-reload
     
     # Restart service
     sudo systemctl restart glasscode-frontend
     ```
   - Diagnostics:
     ```bash
     sudo systemctl status glasscode-frontend --no-pager
     journalctl -u glasscode-frontend -n 100 --no-pager
     ls -l /etc/systemd/system/glasscode-frontend.service
     ```
   - Note: Our deployment scripts automatically unmask `${APP_NAME}-frontend` and `${APP_NAME}-dotnet` before enabling/restarting, and create/update the frontend unit to use the Next standalone server when needed.

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