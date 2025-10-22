# GlassCode Academy Staging Environment

This directory contains scripts and configuration files for deploying and managing the GlassCode Academy application in a staging environment.

## Overview

The staging environment is a near-identical replica of the production environment, used for testing new features and changes before they are deployed to production.

## Deployment Scripts

### staging-deploy.sh
This script sets up a complete staging environment including:
- Installation of required dependencies (Node.js, PostgreSQL, NGINX)
- Creation of deploy user and application directories
- Cloning of the repository
- Database setup and seeding
- Configuration of systemd services
- NGINX reverse proxy setup
- Health checks

To deploy to staging:
```bash
sudo ./staging-deploy.sh
```

### staging-update.sh
This script updates an existing staging environment with the latest changes:
- Pulls the latest code from the repository
- Updates Node.js dependencies
- Runs database migrations
- Restarts services
- Performs health checks

To update staging:
```bash
sudo ./staging-update.sh
```

## Environment Configuration

The staging environment uses the following configuration:

- **Domain**: staging.glasscode.academy
- **Frontend Port**: 3000
- **Backend Port**: 8080
- **Database**: PostgreSQL with dedicated staging database
- **SSL**: Self-signed certificates for staging

## Services

The staging environment runs the following systemd services:

1. **glasscode-node-backend.service** - Node.js backend API
2. **glasscode-node-frontend.service** - Next.js frontend application

## NGINX Configuration

NGINX is configured as a reverse proxy with the following routing:

- `/` - Routes to the frontend application
- `/api/` - Routes to the backend API
- `/graphql` - Routes to the backend GraphQL endpoint (for backward compatibility)

## Health Checks

The deployment scripts perform automated health checks:

- **Backend**: Verifies the `/health` endpoint returns a success response
- **Frontend**: Verifies the root endpoint returns HTML content

## Database

The staging environment uses a dedicated PostgreSQL database:

- **Database Name**: glasscode_staging
- **Username**: glasscode_staging
- **Password**: password (change in production)

## Security

For staging, self-signed SSL certificates are used. In production, you should replace these with valid certificates from a trusted CA.

## Monitoring

Services are monitored through systemd and can be managed using standard systemctl commands:

```bash
# Check service status
systemctl status glasscode-node-backend.service
systemctl status glasscode-node-frontend.service

# View service logs
journalctl -u glasscode-node-backend.service -f
journalctl -u glasscode-node-frontend.service -f
```

## Troubleshooting

Common issues and their solutions:

1. **Service fails to start**: Check the service logs with `journalctl`
2. **Health checks fail**: Verify the application is listening on the correct ports
3. **Database connection issues**: Check database credentials and connectivity
4. **NGINX configuration errors**: Test with `nginx -t` and check error logs

## Rollback

To rollback to a previous version:
1. Use git to checkout the previous commit in the application directory
2. Run the staging-update.sh script to redeploy
3. If database migrations need to be rolled back, you'll need to manually restore from backups