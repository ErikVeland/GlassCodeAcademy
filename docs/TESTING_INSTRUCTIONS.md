# GlassCode Academy Testing Instructions

This guide covers how to validate the current project using the Node.js backend and Next.js frontend.

## Prerequisites
- Node.js 18+
- PostgreSQL (local or remote)
- Git
- A modern browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### One-command dev boot
```bash
./start-dev.sh
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

### Manual setup

Backend (Node):
```bash
cd backend-node
npm install
cp .env.example .env
# Update DATABASE_URL, JWT_SECRET, etc.
npm run dev
```

Frontend (Next.js):
```bash
cd glasscode/frontend
npm install
# Create .env.local with the backend base
printf "NEXT_PUBLIC_API_BASE=http://localhost:8080\n" > .env.local
npm run dev
```

## Static Checks (Frontend)
- `npm run typecheck` — verifies TypeScript types across app and tests
- `npm run lint` — enforces code quality

## Automated Tests (Backend)
```bash
cd backend-node
npm test                 # run unit/integration tests
npm run test:coverage    # run tests with coverage
```

## Manual Verification

### Layout & Navigation
- Open `http://localhost:3000`
- Verify consistent header/footer width and responsive layout
- Navigate technology modules and ensure pages render without errors

### Theme Switching
- Toggle dark/light mode and verify persistence after refresh
- Confirm system preference detection when localStorage is cleared

### Modules & Content
- React: `/react/lessons`, `/react/interview`
- Tailwind: `/tailwind/lessons`, `/tailwind/interview`
- Node: `/node/lessons`, `/node/interview`
- SASS: `/sass/lessons`, `/sass/interview`
- Programming Fundamentals: `/programming/lessons`, `/programming/quiz`

### Admin Pages
- Admin: `/admin`
- Edit pages: `/admin/lessons/[id]/edit`, `/admin/modules/[id]/edit`, `/admin/quizzes/[id]/edit`

## Notes on GraphQL
- GraphQL is optional. The frontend proxies `/graphql` to the backend if available.
- When GraphQL is unreachable, stats and summaries fall back to the content registry.

## Troubleshooting
- Kill ports in use:
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3000,3001 | xargs kill -9
```
- Ensure `NEXT_PUBLIC_API_BASE` is set in `glasscode/frontend/.env.local`
- Check backend health: `GET http://localhost:8080/api/health`

## Success Criteria
- Frontend compiles and runs locally (`npm run dev`)
- Typecheck and lint pass without errors
- Backend tests pass; coverage meets targets
- Module pages render; theme switching works and persists
- Admin pages load and update content states