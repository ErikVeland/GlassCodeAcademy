#!/bin/bash
set -euo pipefail
DOMAIN=${1:-about.glasscode.academy}
EMAIL=${2:-erik@veland.au}
TOKEN=${CLOUDFLARE_API_TOKEN:-}
if [ -z "$TOKEN" ]; then echo "CLOUDFLARE_API_TOKEN required"; exit 1; fi
echo 3231 | sudo -S apt-get update -y
echo 3231 | sudo -S apt-get install -y certbot python3-certbot-nginx python3-certbot-dns-cloudflare
echo 3231 | sudo -S bash scripts/setup-nginx.sh
echo "dns_cloudflare_api_token = $TOKEN" | sudo tee /etc/letsencrypt/cloudflare.ini >/dev/null
echo 3231 | sudo -S chmod 600 /etc/letsencrypt/cloudflare.ini
echo 3231 | sudo -S certbot --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini -d "$DOMAIN" --agree-tos -m "$EMAIL" --non-interactive --keep-until-expiring
echo 3231 | sudo -S nginx -t
echo 3231 | sudo -S systemctl reload nginx
