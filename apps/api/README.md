# GlassCode Fastify API (Migration Target)

This service provides a modern TypeScript backend using Fastify. It currently serves content registry and quizzes from static JSON under `content/` to enable a smooth migration from legacy services.

## Commands

- `npm run dev` — start in dev mode (port 8081)
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run compiled server

## Endpoints

- `GET /health` — basic health check
- `GET /api/content/registry` — serves `content/registry.json`
- `GET /api/modules/:slug/quiz` — serves normalized quiz questions from `content/quizzes/*.json`
- `GET /api/modules` — lists module identifiers (slugs) from registry
- `GET /api/modules/:slug/lessons` — lists lessons for a module from `content/lessons/*.json`
- `GET /api/lessons/:id` — fetch a single lesson by numeric id from content

## Frontend Integration

Set `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8081` in `glasscode/frontend/.env.local` to have the frontend proxy to this API during migration. Alternatively, the frontend may fall back to `127.0.0.1:8081` if configured.

## Next Steps

- Add Prisma models and database-backed endpoints
- Migrate write endpoints (admin) with dual-write during rollout
- Expand routes to cover lessons, modules, and progress