# GlassCode Academy Documentation Index

Use this index to navigate all project docs. It reflects the current Node.js backend + Next.js frontend state, with optional GraphQL.

## Quick Start
- Dev boot: `./start-dev.sh`
- Frontend dev: `cd glasscode/frontend && npm install && npm run dev`
- Backend dev: `cd backend-node && npm install && npm run dev`

## Core Docs
- Project Overview: `/README.md`
- Frontend Guide: `/glasscode/frontend/README.md`
- Backend Guide: `/backend-node/README.md`
- REST API Reference: `/backend-node/API_DOCUMENTATION.md`
- Tech Stack: `/docs/TECH_STACK.md`
- Architecture: `/docs/CURRENT_ARCHITECTURE.md`
- Testing Instructions: `/docs/TESTING_INSTRUCTIONS.md`

## Key Files and References
- Dev orchestrator: `/start-dev.sh`
- Frontend build (Docker): `/glasscode/frontend/build.sh`
- Frontend config (GraphQL proxy + rewrites): `/frontend/next.config.ts`
- GraphQL endpoint resolution: `/frontend/src/lib/urlUtils.ts`
- Apollo Client setup (optional GraphQL): `/frontend/src/apolloClient.ts`

## Migration and CI
- Migration Guide: `/MIGRATION_GUIDE.md`
- Backend migration notes: `/backend-node/MIGRATION_SUMMARY.md`
- Phase 2 summary: `/backend-node/PHASE2_SUMMARY.md`
- CI/CD (backend): `/backend-node/CI_CD.md` (if present)

## Health and Observability
- Backend health: `GET http://localhost:8080/api/health`
- Logging: Winston at `/backend-node/src/utils/logger.js`

## Notes on GraphQL
- GraphQL is optional. Most reads/writes use REST.
- Frontend proxies `/graphql` via `frontend/next.config.ts` when backend exposes it.
- Fallback behavior: if GraphQL is unreachable, stats/summaries use the content registry.

## Conventions
- Node.js 18+, PostgreSQL
- Next.js 15.3.x, React 19, TypeScript 5
- Jest + Supertest for backend tests
- Tailwind + Sass for styling

## Where to Start
1. Read `/README.md` for an overview.
2. Follow `/docs/TESTING_INSTRUCTIONS.md` to validate locally.
3. Use `/backend-node/API_DOCUMENTATION.md` when integrating or verifying endpoints.
4. See `/docs/CURRENT_ARCHITECTURE.md` for data flow and monorepo layout.