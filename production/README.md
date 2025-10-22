# Production Deployment

This directory contains scripts and documentation for deploying GlassCode Academy to production environment.

## Deployment Scripts

### [production-deploy.sh](production-deploy.sh)
Initial deployment script that sets up the entire production environment:
- Installs Node.js, PostgreSQL, and Nginx
- Creates deployment user and application directories
- Clones the repository and installs dependencies
- Configures database with secure credentials
- Sets up PM2 process management
- Configures Nginx reverse proxy with SSL

### [production-update.sh](production-update.sh)
Update script for deploying new versions with rollback capability:
- Creates timestamped backups of current deployment
- Updates code from repository
- Installs dependencies and runs migrations
- Restarts services and performs health checks
- Automatically rolls back on failure

## Prerequisites

- Ubuntu 20.04+ server
- Domain names configured (API and frontend)
- DNS records pointing to server IP
- SSH access with sudo privileges

## Initial Deployment

1. Copy [production-deploy.sh](production-deploy.sh) to server
2. Make executable: `chmod +x production-deploy.sh`
3. Run as a user with sudo privileges: `./production-deploy.sh`

## Updates

1. Copy [production-update.sh](production-update.sh) to server
2. Make executable: `chmod +x production-update.sh`
3. Run as deploy user or with sudo: `./production-update.sh`

## Monitoring

Services are managed by PM2:
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all
```

## Backup Management

Backups are automatically created during updates and stored in `/srv/academy-backups/`. By default, the 5 most recent backups are retained.

To restore from a specific backup:
```bash
# Stop services
pm2 stop all

# Restore from backup
sudo rm -rf /srv/academy-node
sudo cp -r /srv/academy-backups/backup_timestamp /srv/academy-node
sudo chown -R deploy:deploy /srv/academy-node

# Restart services
pm2 restart all
```

## Security Considerations

- Environment variables are randomly generated during initial deployment
- SSL certificates are automatically provisioned with Let's Encrypt
- Database passwords are securely generated
- Services run under dedicated deploy user
- Firewall should be configured to restrict access

## Troubleshooting

### Service Issues
Check PM2 logs:
```bash
pm2 logs
```

### Database Issues
Connect to PostgreSQL:
```bash
sudo -u postgres psql glasscode_prod
```

### Network Issues
Check Nginx configuration:
```bash
sudo nginx -t
sudo systemctl status nginx
```