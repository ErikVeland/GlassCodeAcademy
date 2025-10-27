# bet.glasscode.academy

This folder hosts artifacts and scripts for importing and building your Entain repo to power `bet.glasscode.academy`.

## Quick Start

1. Run the import + build script with your repo URL:

   ```bash
   bash scripts/bet-import-build.sh --repo <git-url> [--branch <branch>] [--dest ./bet.glasscode.academy]
   ```

   Examples:
   - `bash scripts/bet-import-build.sh --repo git@github.com:yourorg/entain.git`
   - `bash scripts/bet-import-build.sh --repo https://github.com/yourorg/entain.git --branch main`

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
   bash scripts/bet-import-build.sh --repo <git-url> --branch main --dest ./bet.glasscode.academy
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
     --sudo
   ```

   - Add `--repo <git-url> [--branch <branch>]` to build from the repo during deploy.
   - Remove `--push-conf` if Nginx is already configured.

3. Verify:

   ```bash
   curl -I http://bet.glasscode.academy/
   curl http://bet.glasscode.academy/health
   ```

### Requirements

- DNS: Point `bet.glasscode.academy` A/AAAA record to your server.
- Nginx: The provided `bet.glasscode.academy.conf` serves static files from `/var/www/bet.glasscode.academy` and includes a `/health` endpoint.
- TLS: If you need HTTPS, issue a certificate (e.g., via Let’s Encrypt) and update your Nginx config accordingly.