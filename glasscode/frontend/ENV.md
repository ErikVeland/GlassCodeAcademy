# Frontend Environment Configuration

This app resolves public and API URLs at build/runtime. Misconfiguration can cause ECONNREFUSED or localhost fetches during CI/production. Configure the variables below according to your deployment.

## Required Variables (Production/CI)

- NEXT_PUBLIC_BASE_URL
  - Public origin of the frontend, no trailing slash.
  - Examples: `https://glasscodeacademy.com`, `https://your-app.vercel.app`
  - Used by server-side code to build absolute URLs.

- NEXT_PUBLIC_API_BASE
  - Base URL of the Node.js backend the frontend talks to, no trailing slash.
  - Examples: `https://api.glasscodeacademy.com`, `https://glasscodeacademy.com` (if proxied)
  - Required for `nodeJsApiClient`. Missing in prod/CI now throws to surface misconfig.

- VERCEL_URL (automatically set on Vercel)
  - If `NEXT_PUBLIC_BASE_URL` is not set, code uses `https://${VERCEL_URL}`.

## Optional Variables

- GRAPHQL_ENDPOINT
  - Full URL to GraphQL. If omitted, the browser uses `/graphql` and the server derives from `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_BASE_URL`.

## Development Defaults

- You can run locally without setting `NEXT_PUBLIC_BASE_URL` by relying on relative fetches, but setting it avoids server-side absolute URL errors.
- Typical dev values:
  - `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
  - `NEXT_PUBLIC_API_BASE=http://localhost:8080`

## Behavior in Code

- `getPublicOriginStrict()`
  - Uses `NEXT_PUBLIC_BASE_URL` or `https://${VERCEL_URL}`. Throws if neither is set.

- `getApiBaseStrict()`
  - Uses `NEXT_PUBLIC_API_BASE`. Throws if not set.

- `nodeJsApiClient`
  - Uses `getApiBaseStrict()`. In development (not production and not CI), falls back to `http://localhost:8080`.
  - In production/CI, throws if `NEXT_PUBLIC_API_BASE` is missing to prevent silent localhost fetches.

- Content loaders (registry/lessons/quizzes)
  - Prefer relative `/api/...` and static `/registry.json`.
  - Gate localhost candidates to dev-only; production/CI will not attempt `http://localhost:*` during prerender.

## Examples

### .env.local (development)
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

### .env.production (self-hosted/CI)
```
NEXT_PUBLIC_BASE_URL=https://glasscodeacademy.com
NEXT_PUBLIC_API_BASE=https://api.glasscodeacademy.com
```

### Vercel
- `VERCEL_URL` is automatically set on preview/production. Optionally set `NEXT_PUBLIC_BASE_URL` for canonical origins.
- Always set `NEXT_PUBLIC_API_BASE` to your backend.

## Verify Configuration

- Run `npm run build` in `frontend/` and ensure there are no `ECONNREFUSED` or localhost fetch attempts in logs.
- At runtime, open your app and check network requests; API calls should target `NEXT_PUBLIC_API_BASE`.