# Frontend Environment Configuration

This app relies on a few env vars that affect SSR fetches and routing.

Recommended setup for local development:

```
# .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8080
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
NEXT_PUBLIC_DEBUG=true
```

Notes:
- `NEXT_PUBLIC_BASE_URL` must match the running frontend dev port. SSR routes derive absolute URLs from this.
- `NEXT_PUBLIC_API_BASE` should point directly to the backend origin used by SSR. Avoid mixing with the public origin.
- `NEXT_PUBLIC_GRAPHQL_ENDPOINT` can be absolute or proxied path; keep it consistent with your proxy rules.
- `NEXT_PUBLIC_DEBUG` gates verbose logs and enables the StatusBanner even when everything is healthy.

Quiz content fallback (development only):
- The quizzes API (`/api/content/quizzes/[moduleSlug]`) first queries the backend at `NEXT_PUBLIC_API_BASE`.
- If the backend returns zero questions, the route will attempt a file-based fallback from `../../content/quizzes/[moduleSlug].json` relative to the frontend project root.
- Keep quiz JSON files in `content/quizzes/` using the standard question template. This ensures interview questions are available while backend content is being populated.

Common pitfalls:
- Mismatched `NEXT_PUBLIC_BASE_URL` and dev server port causes SSR fetches to fail or be incorrectly proxied.
- Using public origin helpers where backend API base is required leads to mixed-origin issues. Prefer `API_BASE` for server-side fetches.
- Inline scripts with CSP: ensure CSP allows required inline scripts or replace them with modules and nonces.

Health endpoints:
- Frontend: `GET /health` should respond with a simple OK and optionally proxy backend health.
- Registry: `GET /api/content/registry` returns the content registry and is a good proxy readiness signal.