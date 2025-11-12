# CI/CD Setup for GlassCode Academy Node.js Backend

This document describes the CI/CD setup for the Node.js backend of GlassCode Academy.

## GitHub Actions Workflows

### CI Workflow (`ci.yml`)
- Runs on every push and pull request to the `main` branch
- Sets up Node.js environment
- Installs dependencies with `npm ci`
- Runs linting with `npm run lint`
- Runs tests with `npm test`
- Runs security audit with `npm audit`

### Code Quality Workflow (`code-quality.yml`)
- Runs ESLint and Prettier checks
- Runs security scanning

### Docker Workflow (`docker.yml`)
- Builds and pushes Docker images to DockerHub
- Runs on pushes to `main` branch and tags

### CD Workflow (`cd.yml`)
- Deploys to staging environment on pushes to `main` branch
- Deploys to production environment on tagged releases

## Environment Variables

The following environment variables need to be set in GitHub Actions:

- `DOCKERHUB_USERNAME` - DockerHub username
- `DOCKERHUB_TOKEN` - DockerHub access token

## Deployment Scripts

### Health Check (`scripts/health-check.js`)
A Node.js script that performs a health check on the running application by calling the `/health` endpoint.

### Deployment (`scripts/deploy.sh`)
A bash script that handles the deployment process:
1. Checks dependencies
2. Creates deployment directory
3. Copies application files
4. Installs production dependencies
5. Runs database migrations
6. Starts the application with PM2
7. Runs health check

## Manual Deployment

To manually deploy the application:

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Run the deployment script
./scripts/deploy.sh
```

## Monitoring

The application uses Winston for logging and PM2 for process management. Logs are stored in `/var/log/glasscode-backend-node/`.

## Rollback

To rollback to a previous version:
1. Stop the current application: `pm2 stop glasscode-backend-node`
2. Deploy the previous version using the deployment script
3. Verify the deployment with the health check