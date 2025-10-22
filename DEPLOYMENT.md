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

### Bootstrap Script Flags

The bootstrap script supports additional flags for flexible deployment:

- `--frontend-only`: Skips backend (.NET) setup and only builds and runs the Next.js frontend using the standalone server.
- `--port <PORT>`: Specifies the port for the frontend standalone server (default: `3000`).
- `--validate-json-content`: Also validates legacy JSON content parity (registry) in addition to default DB checks.

Examples:

```bash
# Frontend-only deployment on port 3006
./bootstrap.sh --frontend-only --port 3006

# Full-stack deployment with custom frontend port
./bootstrap.sh --port 8080

# Full-stack deployment with optional JSON content validation
sudo ./bootstrap.sh --validate-json-content --port 3000
```

Health checks:

- Backend health: GraphQL responds
  - `curl -s -X POST http://127.0.0.1:8080/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'`
- Frontend availability: homepage responds
  - `curl -s http://127.0.0.1:<PORT>/`
- Database content (default):
  - `GET /api/modules-db`, `GET /api/lessons-db`, `GET /api/LessonQuiz` return arrays
  - Frontend DB quiz: `GET /api/content/quizzes/{moduleSlug}` includes `"questions": [...]`
- Optional JSON content (enabled by `--validate-json-content`):
  - `GET /api/content/registry` or fallback `GET /registry.json`

Notes and troubleshooting:

- Ensure the frontend systemd unit binds to the configured port. The script generates `ExecStart=/usr/bin/node .next/standalone/server.js -p <PORT>` inside `/etc/systemd/system/<APP_NAME>-frontend.service`.
- If you hit `502 Bad Gateway`, check:
  - `systemctl status glasscode-frontend` and `journalctl -u glasscode-frontend -n 200`
  - `systemctl status glasscode-dotnet` and `journalctl -u glasscode-dotnet -n 200`
  - Confirm ports are listening: `ss -tulpn | grep -E ':8080|:3000|:<PORT>'`
  - Verify backend health with GraphQL: `curl -s -X POST http://127.0.0.1:8080/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'`
  - Verify frontend: `curl -s http://127.0.0.1:<PORT>/`
- NGINX is configured to proxy to `127.0.0.1:<PORT>` for the frontend and `127.0.0.1:8080` for `/api` and `/graphql`. Timeouts are set to 60s to reduce transient 502s.
- The script preflights ports and kills conflicting processes on `8080` and the frontend port before starting services.

The script will stage `.next/standalone`, `.next/static`, and `public` under the frontend working directory used by the service, ensure the systemd unit uses `ExecStart=/usr/bin/node .next/standalone/server.js -p <PORT>`, and configure NGINX accordingly.

### Admin URL Query Parameters

For admin and testing purposes, the frontend recognizes these URL query parameters on the homepage and across the app:

- `?unlock`: Temporarily unlocks all modules regardless of prerequisites while the param is present.
- `?lock`: Temporarily locks all modules except start modules (modules with no prerequisites).
- `?reset` (alias: `?rest`): Resets the app to a virgin state. Clears `localStorage`, `sessionStorage`, and browser caches, then removes admin params and reloads the page.

Usage examples:

```text
https://glasscode.academy/?unlock
https://glasscode.academy/?lock
https://glasscode.academy/?reset
```

Notes:
- `?unlock` and `?lock` are transient and only apply while present in the URL.
- `?reset` will clear all client-side storage keys including quiz progress, achievements, streaks, and preferences, and attempt to clear Service Worker caches where supported.
- After a reset, the URL query parameters are removed automatically to prevent repeated resets on refresh.

### Updating the Application

To update the application to the latest version, use the update script:

```bash
# Download the update script
curl -O https://raw.githubusercontent.com/ErikVeland/GlassCodeAcademy/main/update.sh

# Make it executable
chmod +x update.sh

# Run the update script (DB-first validation by default)
./update.sh

# Optional: also validate legacy JSON content parity
./update.sh --validate-json-content
```

#### Migration-only mode and CLI fallback

- The backend supports a migration-only mode via `RUN_AUTOMATED_MIGRATION_ONLY=1`. This runs the full automated content migration and exits without starting the web server.
- Both `bootstrap.sh` and `update.sh` automatically trigger a full migration if DB endpoints return empty arrays, preferring the API (`POST /api/migration/full-migration`) and falling back to CLI if the API is unreachable.
- The CLI fallback runs the published DLL if available or uses `dotnet run` from the backend project.
- Retries: the fallback retries up to `MIGRATION_CLI_RETRY_MAX` attempts (default `3`) with exponential backoff (2–3s base depending on `FAST_MODE`). After each attempt, scripts re-check DB endpoints for populated data.
- Manual one-off migration:
  - Using DLL: `RUN_AUTOMATED_MIGRATION_ONLY=1 dotnet glasscode/backend/out/backend.dll`
  - Using source: `cd glasscode/backend && RUN_AUTOMATED_MIGRATION_ONLY=1 dotnet run --project backend.csproj`

Notes:
- Optional JSON registry validation is gated by `--validate-json-content` and uses `scripts/validate-content.js` to check `registry.json` schema and content parity.

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
   sudo -u deploy git clone https://github.com/ErikVeland/GlassCodeAcademy.git /home/deploy/glasscode
   ```

4. **Build applications**
   ```bash
   # Build frontend
   cd /home/deploy/glasscode/glasscode/frontend
   sudo -u deploy npm install
   sudo -u deploy npm run build
   
   # Build backend
   cd /home/deploy/glasscode/glasscode/backend
   sudo -u deploy dotnet publish -c Release -o out
   ```

5. **Set up systemd services**
   ```bash
   # Create frontend service
   sudo tee /etc/systemd/system/glasscode-frontend.service > /dev/null <<EOF
[Unit]
Description=GlassCode Academy Frontend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/glasscode/glasscode/frontend
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

   # Create backend service
   sudo tee /etc/systemd/system/glasscode-dotnet.service > /dev/null <<EOF
[Unit]
Description=GlassCode Academy Backend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/glasscode/glasscode/backend
ExecStart=/usr/bin/dotnet /home/deploy/glasscode/glasscode/backend/out/backend.dll
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

   # Enable and start services
   sudo systemctl daemon-reload
   sudo systemctl enable glasscode-frontend
   sudo systemctl enable glasscode-dotnet
   sudo systemctl start glasscode-frontend
   sudo systemctl start glasscode-dotnet
   ```

6. **Configure NGINX**
   ```bash
   sudo tee /etc/nginx/sites-available/glasscode > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location /graphql {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
EOF

   # Enable site
   sudo ln -s /etc/nginx/sites-available/glasscode /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Security Configuration

### JWT Authentication Setup

The application uses JWT tokens for authentication. To configure JWT:

1. Set the following environment variables:
   ```bash
   Jwt__Issuer=GlassCodeAcademy
   Jwt__Audience=GlassCodeAcademyUsers
   Jwt__Secret=YourSuperSecretKeyHere
   ```

2. For production deployments, ensure the secret is stored securely and not in version control.

### Role-Based Access Control

The application implements a role-based access control system with the following roles:
- **Admin**: Full access to all features
- **Instructor**: Access to content management features
- **Student**: Access to learning content
- **Guest**: Limited access to public content

Roles are configured in the PostgreSQL database and can be managed through the admin interface.

### Database Security

1. Use strong passwords for database connections
2. Configure PostgreSQL to only accept connections from localhost or trusted networks
3. Regularly update PostgreSQL to the latest stable version
4. Implement proper backup and recovery procedures

### Logging and Monitoring

The application uses Serilog for structured logging with the following features:
- Console and file output
- JSON formatting for structured logs
- Correlation ID tracking for request tracing
- Performance timing for operations
- Error categorization and grouping

To configure logging levels:
```bash
# Set log level for different environments
Logging__LogLevel__Default=Information
Serilog__MinimumLevel__Default=Information
```

## Testing and Quality Assurance

### Automated Testing

The application includes comprehensive automated tests:
- Unit tests for core business logic
- Integration tests for API endpoints
- Security feature tests
- Performance benchmarks

To run tests:
```bash
# Run backend tests
cd glasscode/backend
dotnet test Backend.Tests

# Run tests with code coverage
dotnet test Backend.Tests --collect:"XPlat Code Coverage" --settings Backend.Tests/coverlet.runsettings
```

### Code Coverage Requirements

The project enforces a minimum code coverage threshold of 80%. The CI/CD pipeline will fail builds that don't meet this requirement.

### Health Checks

The application provides health check endpoints:
- `/api/health`: Overall application health
- GraphQL endpoint health check
- Database connectivity verification

## Performance Optimization

### Caching Strategy

The application uses Redis for caching:
- Frequently accessed data is cached to reduce database load
- Cache expiration is configured based on data volatility
- Cache warming strategies are implemented for critical data

### Database Optimization

- Proper indexing on frequently queried fields
- Connection pooling for efficient database access
- Query optimization for complex operations
- Regular database maintenance tasks

### Frontend Optimization

- Server-side rendering for improved initial load times
- Static asset optimization and compression
- Code splitting for reduced bundle sizes
- Lazy loading for non-critical components

## Monitoring and Observability

### Log Analysis

Structured logs are written to:
- Console output for development
- Log files with daily rotation
- JSON format for easy parsing and analysis

### Performance Monitoring

- Response time tracking for all endpoints
- Database query performance monitoring
- Cache hit/miss ratios
- Memory and CPU usage tracking

### Error Tracking

- Centralized error logging with context
- Error categorization and grouping
- Alerting for critical errors
- Performance degradation detection

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check systemd service status
   - Verify ports are listening
   - Check NGINX configuration
   - Review service logs

2. **Database Connection Issues**
   - Verify database is running
   - Check connection string configuration
   - Ensure proper firewall rules
   - Validate database credentials

3. **Authentication Failures**
   - Verify JWT configuration
   - Check token validity and expiration
   - Review role assignments
   - Confirm user permissions

### Log Locations

- Application logs: `/var/log/glasscode/`
- Systemd service logs: `journalctl -u glasscode-frontend` and `journalctl -u glasscode-dotnet`
- NGINX logs: `/var/log/nginx/`

### Health Check Commands

```bash
# Check frontend service
systemctl status glasscode-frontend

# Check backend service
systemctl status glasscode-dotnet

# Check database connectivity
curl -s http://127.0.0.1:8080/api/health

# Check GraphQL endpoint
curl -s -X POST http://127.0.0.1:8080/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'
```