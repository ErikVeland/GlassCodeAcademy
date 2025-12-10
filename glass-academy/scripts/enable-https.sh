#!/bin/bash

set -euo pipefail

DOMAIN=${1:-about.glasscode.academy}
EMAIL=${2:-erik@veland.au}

echo "🔐 Enabling HTTPS for $DOMAIN"

if ! command -v certbot >/dev/null 2>&1; then
  echo "Installing Certbot..."
  echo 3231 | sudo -S apt-get update -y
  echo 3231 | sudo -S apt-get install -y certbot python3-certbot-nginx
fi

echo "Configuring Nginx..."
echo 3231 | sudo -S bash scripts/setup-nginx.sh

echo "Requesting Let\'s Encrypt certificate..."
echo 3231 | sudo -S certbot --nginx -d "$DOMAIN" --redirect -m "$EMAIL" --agree-tos -n || {
  echo "⚠️ Certbot failed (likely due to Cloudflare proxy/HTTP-01)."
  echo "Options:"
  echo "  1) Temporarily turn off Cloudflare proxy (gray cloud) and re-run this script."
  echo "  2) Use DNS-01 challenge with certbot-dns-cloudflare (requires API token)."
  exit 1
}

echo "Validating Nginx config..."
echo 3231 | sudo -S nginx -t
echo 3231 | sudo -S systemctl reload nginx

echo "✅ HTTPS enabled for $DOMAIN"
echo "Test: curl -I https://$DOMAIN | head -n 20"
