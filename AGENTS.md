# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Repository Overview

GlassCode Academy is a full-stack e-learning platform for developers. It's structured as an NPM workspace monorepo:

- **`apps/web`** — Next.js 15 / React 19 frontend
- **`apps/api`** — Fastify 5 / Node.js backend API
- **`content/`** — Shared lesson and quiz content as JSON files

## Commands

### Root (runs across all workspaces)

```bash
npm run dev        # Start both apps concurrently
npm run build      # Build both apps
npm run lint       # Lint all apps
npm run typecheck  # TypeScript check all apps
npm run test       # Run all tests
```

### Frontend (`apps/web`)

```bash
cd apps/web
npm run dev        # Next.js dev server (port 3000)
npm run build      # Runs copy-content.js + prepare-next.js before next build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npx playwright test                  # Run all e2e tests
npx playwright test tests/e2e/foo.spec.ts  # Run a single e2e test file
```

### Backend (`apps/api`)

```bash
cd apps/api
npm run dev        # tsx src/server.ts (port 8081)
npm run build      # tsc -p tsconfig.build.json
npm run typecheck  # tsc --noEmit
npm run test       # Jest (NODE_ENV=test)
npm run test -- --testPathPattern=foo  # Run a single test file
npm run migrate    # Run DB migrations
npm run seed       # Seed the database
```

### Infrastructure

```bash
docker-compose up -d                     # Start postgres + redis + api + web
docker-compose up -d postgres redis      # Start only DB and cache (for local dev)
```

## Architecture

### Data Flow

```
Browser → Next.js (port 3000) → /api/graphql route → Fastify API (port 8081) → PostgreSQL / Redis
                              → /api/* routes (REST proxies or Next.js-native)
```

The Next.js frontend **does not query the database directly**. All backend communication goes through the Fastify API. The `/api/graphql` Next.js route handler (`apps/web/src/app/api/graphql/route.ts`) is a pure proxy that forwards requests to the backend.

### Apollo / GraphQL

- Apollo Client is instantiated in `apps/web/src/apolloClient.ts` with a `RetryLink` for resilience.
- All GQL queries are defined in `apps/web/src/graphql/queries.ts`.
- The backend URL is resolved dynamically via `getGraphQLEndpoint()` in `apps/web/src/lib/urlUtils.ts` — never hardcode API URLs; use `getApiBaseStrict()` or `getPublicOriginStrict()` from that file.

### Content System

Content lives in `content/lessons/<module-slug>/` and `content/quizzes/<module-slug>.json`. The `GC_CONTENT_MODE` env var controls delivery:

- `file` (default) — reads JSON from disk; SSG is enabled if `ENABLE_BUILD_SSG=true`
- `db` — content served from PostgreSQL via Fastify

The central registry (`content/registry.json`) maps module slugs, short slugs, routes, tiers, and thresholds. Access it only through `apps/web/src/lib/contentRegistry.ts`.

### Routing (Frontend)

- `[shortSlug]` — module overview pages (e.g., `/dotnet`)
- `[shortSlug]/lessons/[lessonOrder]` — individual lessons
- `[shortSlug]/quiz/question/[questionId]` — quiz questions
- `/modules/[moduleSlug]/...` — canonical long-slug routes (redirect to short slugs)
- Static legacy routes (`/programming-fundamentals`, `/dotnet`, etc.) co-exist with the dynamic `[shortSlug]` router

### Backend Structure (`apps/api/src/`)

| Directory   | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| `routes/`   | Fastify route handlers (auth, modules, lessons, quizzes, courses, stats, search) |
| `models/`   | Sequelize ORM models (User, Module, Lesson, Quiz, Course, Role)                  |
| `services/` | Business logic (authService, cacheService, contentService, oauthService)         |
| `utils/`    | Monitoring (OpenTelemetry, Prometheus), cache warming, content versioning        |
| `config/`   | Database (Sequelize + pg) and app configuration                                  |

### Authentication

- Frontend: NextAuth v4 with Google, GitHub, Apple OAuth + Credentials providers (`apps/web/src/lib/authOptions.ts`)
- Backend: JWT tokens issued by Fastify's auth routes, validated on protected endpoints
- The NextAuth session includes a `backendToken` (JWT) and `role` obtained from the Fastify API after OAuth sign-in

## Key Environment Variables

### Frontend (`apps/web`)

| Variable                                             | Purpose                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE`                               | Fastify API base URL (e.g., `http://localhost:8081`)   |
| `NEXT_PUBLIC_BASE_URL`                               | Public-facing frontend URL                             |
| `GC_CONTENT_MODE`                                    | `file` or `db`                                         |
| `ENABLE_BUILD_SSG`                                   | Set to `true` to enable static generation during build |
| `NEXTAUTH_SECRET`                                    | Required for NextAuth session signing                  |
| `NEXTAUTH_URL`                                       | Canonical NextAuth callback URL                        |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | OAuth providers                                        |

### Backend (`apps/api`)

| Variable                                    | Purpose                               |
| ------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`                              | PostgreSQL connection string          |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_ENABLED` | Redis cache connection                |
| `JWT_SECRET`                                | Token signing key                     |
| `NODE_ENV`                                  | `development` / `production` / `test` |

## Content Format

Lessons (`content/lessons/<module-slug>/<lesson-order>.json`) have: `title`, `description`, `codeExample`, `output`, `topic`.

Quiz questions (`content/quizzes/<module-slug>.json`) have: `question`, `type` (`multiple-choice` | `open-ended`), `choices` (array of 4), `correctAnswer` (0–3 index), `explanation`, `topic`, plus optional `fixedChoiceOrder`, `letters`, `acceptedAnswers`.

## Testing

- **E2E**: Playwright (`tests/e2e/`). Dev server auto-starts on port 3000. Prod tests are in `tests/e2e/prod/` and excluded from the default config.
- **API unit tests**: Jest in `apps/api/src/**/__tests__/`. Uses SQLite in test mode.
- **Accessibility**: `@axe-core/playwright` used in `tests/e2e/accessibility-axe.spec.ts`.
