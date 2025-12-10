#!/bin/bash

# Exit on error
set -e

DOMAIN="about.glasscode.academy"
CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"

echo "🔧 Configuring Nginx for $DOMAIN..."

# Create Nginx config
cat <<EOF | sudo tee "$CONFIG_FILE"
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS origin with HTTP/2
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_read_timeout 60s;
    }

    # Cloudflare real client IP
    real_ip_header CF-Connecting-IP;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}
EOF

# Enable site
if [ ! -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    sudo ln -s "$CONFIG_FILE" "/etc/nginx/sites-enabled/"
fi

# Test and reload
echo "Testing Nginx configuration..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]; then
  sudo nginx -t
  echo "Reloading Nginx..."
  sudo systemctl reload nginx
else
  echo "⚠️ SSL certificate not present yet. Skipping nginx reload. Run certbot next."
fi

echo "✅ Nginx configured successfully!"
echo "To issue Let's Encrypt certificates, run:"
echo "sudo certbot --nginx -d $DOMAIN"
echo "If using Cloudflare Origin CA, place cert/key at /etc/ssl/cloudflare/$DOMAIN.{crt,key} and update ssl_certificate paths accordingly, then reload Nginx."
