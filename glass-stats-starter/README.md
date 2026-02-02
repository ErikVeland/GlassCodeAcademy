# GlassStats Starter

A minimal standalone app showcasing the “GlassStats” dev-progress dashboard UI.

This repo contains the extracted parts from the main app:

- Stats page UI: [stats/page.tsx](file:///Users/veland/GlassCodeAcademy/glass-stats-starter/src/app/stats/page.tsx)
- Stats hook: [useAppStats.ts](file:///Users/veland/GlassCodeAcademy/glass-stats-starter/src/hooks/useAppStats.ts)
- Progress tracker: [AppProgressTracker.tsx](file:///Users/veland/GlassCodeAcademy/glass-stats-starter/src/components/AppProgressTracker.tsx)
- Local API (mock): [api/stats/route.ts](file:///Users/veland/GlassCodeAcademy/glass-stats-starter/src/app/api/stats/route.ts)

## Run

```bash
cd glass-stats-starter
npm install
npm run dev
```

Visit:

- `/stats` for the dashboard

## Using your real data

Replace the implementation in [api/stats/route.ts](file:///Users/veland/GlassCodeAcademy/glass-stats-starter/src/app/api/stats/route.ts) to read from:

- your own DB/API, or
- a `stats.json` stored in S3/CDN, or
- your monorepo’s content registry endpoints.
