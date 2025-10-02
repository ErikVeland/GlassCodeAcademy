# Fullstack Academy Deployment Guide

This guide provides detailed instructions for deploying the Fullstack Academy application to various platforms.

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
cd dot-net-quiz/backend
docker build -t fullstack-backend .
docker run -p 8080:8080 fullstack-backend
```

**Frontend:**
```bash
cd dot-net-quiz/frontend
docker build -t fullstack-frontend .
docker run -p 3000:3000 fullstack-frontend
```

## Cloud Deployment Options

### Render.com (Recommended)
1. Fork this repository to your GitHub account
2. Create a new Web Service on Render for each component:
   - Backend service using the Docker runtime
   - Frontend service using the Docker runtime
3. Configure environment variables as needed
4. Set up the services to communicate with each other

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
   - Upload the deployment package: `dot-net-quiz/backend/publish.zip`

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
   - Build Command: `cd dot-net-quiz/backend && dotnet publish -c Release -o ./publish`
   - Start Command: `cd dot-net-quiz/backend/publish && dotnet backend.dll`

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
  https://your-app-name.azurewebsites.net/graphql

# Test GraphQL UI
# Visit: https://your-app-name.azurewebsites.net/graphql-ui
```

## Configuration

### CORS Settings
The backend is configured to allow CORS from:
- `http://localhost:3000` (local development)
- `https://your-render-domain.onrender.com` (Render deployment)
- `https://your-custom-domain.com` (custom domain)

To add your frontend domain, update the CORS policy in `dot-net-quiz/backend/Program.cs`.

### Environment Variables
The application uses the following environment variables:
- `ASPNETCORE_ENVIRONMENT` - Set to "Production" for production deployments

## Support
For deployment issues, please check:
1. Azure Free Account limitations: https://azure.microsoft.com/en-us/free/
2. Azure App Service documentation: https://docs.microsoft.com/en-us/azure/app-service/