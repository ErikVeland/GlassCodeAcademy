#!/bin/bash

# Exit on error
set -e

DOMAIN="about.glasscode.academy"
CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"

echo "🔧 Configuring Nginx for $DOMAIN..."

# Create Nginx config
cat <<EOF | sudo tee "$CONFIG_FILE"
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOF

# Enable site
if [ ! -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    sudo ln -s "$CONFIG_FILE" "/etc/nginx/sites-enabled/"
fi

# Test and reload
echo "Testing Nginx configuration..."
sudo nginx -t

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Nginx configured successfully!"
echo "To enable HTTPS with Certbot, run:"
echo "sudo certbot --nginx -d $DOMAIN"
