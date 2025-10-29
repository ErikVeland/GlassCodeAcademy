# bet.glasscode.academy

This folder hosts artifacts and scripts for importing and building your Entain repo to power `bet.glasscode.academy`.

## Quick Start

1. Run the import + build script with your repo URL:

   ```bash
   bash scripts/bet-import-build.sh --repo <git-url> [--branch <branch>] [--commit <sha>] [--dest ./bet.glasscode.academy]
   ```

   Examples:
   - `bash scripts/bet-import-build.sh --repo git@github.com:yourorg/entain.git`
   - `bash scripts/bet-import-build.sh --repo https://github.com/yourorg/entain.git --branch main`
   - `bash scripts/bet-import-build.sh --repo https://github.com/yourorg/entain.git --branch main --commit 9ab58e63f71fa41ac35e940946bf34d79cacec54`

2. Outputs
   - Source checkout: `bet.glasscode.academy/source`
   - Build artifacts: `bet.glasscode.academy/build`
   - Build metadata: `bet.glasscode.academy/build/build-info.txt`

## Notes

- The script auto-detects package manager and build command:
  - pnpm → `pnpm install` + `pnpm build`
  - yarn → `yarn install` + `yarn build`
  - npm → `npm ci` (or `npm install`) + `npm run build`
  - Output discovery checks `dist`, `build`, `.next`, and `out`.
- If the repo needs custom env vars or secrets, place them under `bet.glasscode.academy/source/.env` or your repo’s expected location before building.
- Optional: I can add an Nginx config to serve the build at `https://bet.glasscode.academy` once you confirm hosting requirements.

## Remote Deployment

Deploy the static build to your server and configure Nginx:

1. Build locally (or let the deploy script build from a repo):

   ```bash
   bash scripts/bet-import-build.sh --repo <git-url> --branch main --commit <sha> --dest ./bet.glasscode.academy
   ```

   This produces `./bet.glasscode.academy/build`.

2. Deploy to remote and push Nginx conf:

   ```bash
   bash scripts/deploy-bet.sh \
     --server <your-server-host-or-ip> \
     --user <ssh-user> \
     --ssh-port 22 \
     --target-root /var/www/bet.glasscode.academy \
     --push-conf \
     --sudo \
     --repo <git-url> \
     --branch main \
     --commit 9ab58e63f71fa41ac35e940946bf34d79cacec54
   ```

   - Add `--repo <git-url> [--branch <branch>]` to build from the repo during deploy.
   - Remove `--push-conf` if Nginx is already configured.

3. Verify:

   ```bash
   curl -I http://bet.glasscode.academy/
   curl http://bet.glasscode.academy/health
   ```

## API Proxy Verification

The BET site uses a same-origin proxy for the Neds Racing API to avoid CORS.

- Neds (GET expected):

  ```bash
  # HTTP redirects to HTTPS
  curl -I 'http://bet.glasscode.academy/api/neds/?method=nextraces&count=10'

  # JSON response via HTTPS
  curl -sS 'https://bet.glasscode.academy/api/neds/?method=nextraces&count=10' | head

  # If needed, mirror browser context headers
  curl -sS 'https://bet.glasscode.academy/api/neds/?method=nextraces&count=10' \
    -H 'Accept: application/json, text/plain, */*' \
    -H 'Accept-Language: en-US,en;q=0.9' \
    -H 'Origin: https://bet.glasscode.academy' \
    -H 'Referer: https://bet.glasscode.academy/' \
    -H 'User-Agent: Mozilla/5.0' | head
  ```

Notes:
- HEAD requests (`curl -I`) to Neds often return `400`. Use GET.
- The Nginx config sets `Host`, `Origin`, and `Referer` so the upstream sees a browser-like request.

- Local backend proxies:

  ```bash
  curl -sS 'https://bet.glasscode.academy/api/health'
  curl -sS -X POST 'https://bet.glasscode.academy/graphql' -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}'
  ```

Troubleshooting:
- `nginx -t && systemctl reload nginx`
- `tail -f /var/log/nginx/bet.glasscode.academy_error.log`
- Confirm DNS and TLS are valid; reissue certs if necessary.

### Requirements

- DNS: Point `bet.glasscode.academy` A/AAAA record to your server.
- Nginx: The provided `bet.glasscode.academy.conf` serves static files from `/var/www/bet.glasscode.academy` and includes a `/health` endpoint.
- TLS: If you need HTTPS, issue a certificate (e.g., via Let’s Encrypt) and update your Nginx config accordingly.