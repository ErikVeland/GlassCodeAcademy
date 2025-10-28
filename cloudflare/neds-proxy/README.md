# Neds Proxy Worker

Cloudflare Worker that proxies Neds Racing API requests and returns JSON with appropriate headers. This helps restore live data when direct server egress is blocked or rate-limited by upstream.

## Deploy

1. Install Wrangler:
   ```bash
   npm i -g wrangler
   ```

2. Login and publish:
   ```bash
   wrangler login
   cd cloudflare/neds-proxy
   wrangler publish
   ```

3. Note the deployed URL (e.g., `https://neds-proxy.<your>.workers.dev`).

4. Configure the frontend:
   - In `bet-deploy/source/.env`, set:
     ```
     VITE_NEDS_PROXY_BASE=https://neds-proxy.<your>.workers.dev/rest/v1/racing/
     ```
   - Rebuild and deploy frontend.

## Optional: Custom Domain

If you have a Cloudflare zone, set `routes` in `wrangler.toml` and publish to a custom domain like `neds-proxy.glasscode.academy`.

Update Nginx to proxy `/api/neds-proxy/` to the Worker URL if you prefer server-side routing:

```
location ^~ /api/neds-proxy/ {
  proxy_pass https://neds-proxy.<your>.workers.dev/;
  proxy_set_header Host neds-proxy.<your>.workers.dev;
  proxy_ssl_server_name on;
  proxy_redirect off;
  proxy_read_timeout 10s;
  proxy_connect_timeout 10s;
}
```