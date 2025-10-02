# Fullstack Academy Gateway

This directory contains the gateway configuration that routes requests to the appropriate technology-specific modules.

## Directory Structure

```
gateway/
├── nginx/
│   ├── nginx.conf
│   ├── sites-available/
│   │   ├── react.conf
│   │   ├── laravel.conf
│   │   ├── node.conf
│   │   ├── tailwind.conf
│   │   └── sass.conf
│   └── sites-enabled/
│       ├── react.conf -> ../sites-available/react.conf
│       ├── laravel.conf -> ../sites-available/laravel.conf
│       ├── node.conf -> ../sites-available/node.conf
│       ├── tailwind.conf -> ../sites-available/tailwind.conf
│       └── sass.conf -> ../sites-available/sass.conf
├── docker-compose.yml
├── HOSTS.md
├── README.md
└── ssl/
    └── README.md
```

## Nginx Configuration

The gateway uses Nginx as a reverse proxy to route requests to the appropriate module based on the URL path.

### Main Nginx Configuration (nginx.conf)

The main configuration file sets up the basic Nginx settings and includes site configurations.

### Module Configurations

Each module has its own configuration file in `sites-available/` that defines:
- SSL settings
- Security headers
- Gzip compression
- Proxy settings to route requests to the appropriate service

## Docker Compose Configuration

The gateway uses Docker Compose to manage all services:

### Services
1. **nginx** - The reverse proxy gateway
2. **react-frontend** - React frontend application
3. **react-backend** - React backend API
4. **laravel-app** - Laravel application
5. **node-app** - Node.js application
6. **tailwind-app** - Tailwind CSS static files
7. **sass-app** - SASS static files

## SSL Configuration

For HTTPS support, you'll need SSL certificates. For development, you can generate self-signed certificates:

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=fullstackacademy.local"
```

## Hosts File Configuration

To access the modules locally, add entries to your hosts file as described in [HOSTS.md](HOSTS.md).

## Starting the Gateway

To start all services:

```bash
docker-compose up -d
```

To stop all services:

```bash
docker-compose down
```

## Monitoring and Logging

The gateway includes logging for monitoring:

```bash
# View Nginx logs
docker-compose logs nginx

# View logs for a specific service
docker-compose logs react-frontend
```

## Load Balancing

For production deployments, you can configure load balancing:

```nginx
upstream react_frontend {
    server react-frontend-1:3000;
    server react-frontend-2:3000;
    server react-frontend-3:3000;
}
```

## Caching

Nginx can be configured for caching:

```nginx
# Add to http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g 
                 inactive=60m use_temp_path=off;

# In server block
location / {
    proxy_cache my_cache;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_valid 200 1h;
    proxy_cache_valid any 1m;
    proxy_cache_lock on;
    proxy_pass http://react_frontend;
    # ... other proxy settings
}
```

## Rate Limiting

To prevent abuse, rate limiting can be configured:

```nginx
# Add to http block
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# In location block
location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://react_backend;
    # ... other proxy settings
}
```

## Health Checks

Nginx can perform health checks on upstream servers:

```nginx
upstream react_frontend {
    server react-frontend:3000 max_fails=3 fail_timeout=30s;
}
```

This configuration provides a robust gateway that routes requests to the appropriate technology-specific modules, ensuring each module can be developed and deployed independently while maintaining a unified user experience.