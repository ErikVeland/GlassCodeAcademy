# GlassCode Academy – Production Runbook

This runbook documents the full deployment flow discovered and validated during this session, including scripts, flags, environment requirements, local production simulation, and remote bootstrap/update procedures.

## Overview
- Backend: Node.js/Express (`backend-node`), PostgreSQL via Sequelize.
- Frontend: Next.js 15 (`glasscode/frontend`), served via `next start` in production.
- Orchestration: `bootstrap.sh` for initial setup; `update.sh` for safe updates with rollback.
- Health: Backend `GET /health`, Frontend served on chosen `PORT`.
- Ports: Backend `8080` (configurable), Frontend `3000` default (override via `--port` or `PORT`).
- API Domain: `api.${DOMAIN}` is provisioned to proxy the backend with HTTPS.

## Key Scripts & Flags

### bootstrap.sh
- Purpose: Full server bootstrap: clone repo, write envs, install deps, build frontend, configure services (and NGINX/SSL on Debian/Ubuntu).
- Early flags:
  - `--frontend-only`: skip backend install and checks.
  - `--fast`: skip noncritical validations to speed up install.
  - `--skip-backend-health`: don’t block on backend health.
  - `--skip-lint`, `--skip-typecheck`: skip lint/TS during build.
  - `--skip-content-verification` / `--validate-json-content`: control content checks.
  - `--env-only`: only write `.env.production` files; no build/run.
  - `--port <N>`: set frontend start port.
- Repo management: clones `REPO` into `APP_DIR` if missing; otherwise `git reset --hard && git pull`.
- Backend env: populates `backend-node/.env.production` with DB settings and ports; computes `DATABASE_URL` when missing.
- Frontend build: robust build with retries and cache cleaning.

### update.sh
- Purpose: Safe update on server with backup, service stop/start, migrations, frontend build, health checks, rollback on failure.
- Flags mirror bootstrap: `--fast`, `--frontend-only`, `--skip-content-validation`, `--skip-lint`, `--skip-typecheck`, `--skip-backend-health`, `--validate-json-content`, `--port <N>`.
- Steps:
  1) Stop services and snapshot backups
  2) Pull latest code
  3) Install npm dependencies (root/scripts/frontend/backend)
  4) Run DB migrations (`npm run migrate` in `backend-node`)
  5) Build frontend (`npm run build`)
  6) Restart services and run health checks
  7) Roll back on any failure

## Environment Requirements

### Deployment Basics (.env.production)
- `APP_NAME`, `DEPLOY_USER`, `APP_DIR`, `REPO`, `DOMAIN`, `EMAIL` (for Let’s Encrypt), `FAST_MODE`.

### Frontend (.env.production)
- `NEXT_PUBLIC_API_BASE` (backend public origin)
- `NEXT_PUBLIC_BASE_URL` (frontend public origin)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (required when using NextAuth)
- Optional providers: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `APPLE_*`

### Backend (`backend-node/.env.production`)
- `PORT` (default `8080`)
- Either `DATABASE_URL` OR discrete `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_SSL` (true/false) depending on managed Postgres

Notes:
- Backend requires a valid DB in production. In `NODE_ENV=test`, it uses in-memory SQLite and can start without a real DB.

## Repository & Port Configuration
- `BACKEND_PORT` defaults to `8080` across scripts and NGINX config; override via `.env.production` or flags.
- Health endpoints:
  - Backend: `GET http://127.0.0.1:8080/health` → `{ success: true }`
  - Frontend: served via `next start`; app pages and `/api/content/registry` should succeed when backend is up.

## Local Production Simulation
Use this to validate production-like behavior without a server:

1) Backend (test mode, no DB required)
```
cd backend-node
npm install
NODE_ENV=test PORT=8080 npm start
# Health: curl -f http://127.0.0.1:8080/health
```

2) Frontend (production build and start)
```
cd glasscode/frontend
npm install
npm run build
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8080 \
NEXT_PUBLIC_BASE_URL=http://localhost:3001 \
NEXTAUTH_URL=http://localhost:3001 \
NODE_ENV=production \
npm run start -- -p 3001
# Visit: http://localhost:3001
```

## Remote Bootstrap (Production Server)
Prereqs: Ubuntu/Debian server, DNS to `DOMAIN`, Postgres reachable, SSH access.

1) SSH to server and clone or let bootstrap clone:
```
ssh <user>@<host>
cd /opt && git clone <REPO> GlassCodeAcademy || true
cd GlassCodeAcademy
```

2) Create `.env.production` with deployment basics and URLs:
```
APP_NAME=glasscode
DEPLOY_USER=<user>
APP_DIR=/opt/GlassCodeAcademy
REPO=<repo-url>
DOMAIN=glasscode.academy
EMAIL=<you@example.com>
NEXT_PUBLIC_API_BASE=https://api.glasscode.academy
NEXT_PUBLIC_BASE_URL=https://glasscode.academy
NEXTAUTH_URL=https://glasscode.academy
NEXTAUTH_SECRET=<generate>
BACKEND_PORT=8080
```

3) Backend DB config in `.env.production` (or provide interactively):
```
DB_DIALECT=postgres
DB_HOST=<db-host>
DB_PORT=5432
DB_NAME=<db-name>
DB_USER=<db-user>
DB_PASSWORD=<db-pass>
DB_SSL=true
# Or DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

4) Run full bootstrap:
```
sudo -E bash bootstrap.sh --fast
```

TLS issuance notes:
- Certificates are issued separately for `glasscode.academy`/`www.glasscode.academy` and `api.glasscode.academy` to match Nginx configs.
- The bootstrap prefers the Nginx plugin and falls back to webroot paths aligned with server blocks:
  - Apex/www: `--webroot -w /var/www/glasscode.academy -d glasscode.academy -d www.glasscode.academy`
  - API: `--webroot -w /var/www/api.glasscode.academy -d api.glasscode.academy`
- This approach avoids interactive `--expand` prompts and ensures cert paths used by Nginx remain consistent.
- For env-only (preparing `.env` files): `sudo -E bash bootstrap.sh --env-only`
- Effects:
  - Provisions Nginx for `www.${DOMAIN}`, `${DOMAIN}` (frontend), and `api.${DOMAIN}` (backend)
  - Obtains TLS certificates for `www.${DOMAIN}`, `${DOMAIN}`, and `api.${DOMAIN}` via Let’s Encrypt
  - Starts backend and frontend services and validates health

## Remote Update
From the server repo directory:
```
sudo -E bash update.sh --fast
```
- Optional: `--frontend-only`, `--skip-lint`, `--skip-typecheck`, `--skip-backend-health`, `--validate-json-content`, `--port 3000`
- Effects:
  - Ensures Nginx config is in place for `${DOMAIN}` and `api.${DOMAIN}`
  - Restarts backend and frontend in the correct order with health checks

## Verification
- Systemd: `systemctl status glasscode-backend glasscode-frontend`
- Logs: `journalctl -u glasscode-backend -n 200 --no-pager`
- Backend health: `curl -f https://api.glasscode.academy/health`
- Frontend app: open `https://glasscode.academy`
- GraphQL rewrites (if used): frontend `/graphql` → backend `${NEXT_PUBLIC_API_BASE}/graphql` per `next.config.ts`
 - API origin: frontend uses `NEXT_PUBLIC_API_BASE=https://api.${DOMAIN}` for all backend requests

## Operational Notes
- Node.js 18+ required.
- Re-run `bootstrap.sh` safely; it merges envs and reinstalls missing base packages.
- Free occupied ports before starting (`lsof -ti:8080 | xargs -r kill -9`).
- CORS/HTTPS: ensure `NEXT_PUBLIC_API_BASE` is HTTPS to avoid mixed content.
- Rollback: `update.sh` performs rollback on health failures.

---
This document is intended to be the authoritative deployment reference for GlassCode Academy. Keep `.env` files updated and secure; rotate secrets regularly.