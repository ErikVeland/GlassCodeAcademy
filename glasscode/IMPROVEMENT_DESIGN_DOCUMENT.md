# GlassCode Academy — Improvement Design Document

This document consolidates current findings across security, performance, reliability, and developer experience, and records concrete fixes and next steps.

## Current State Summary

- Misconfigured GraphQL endpoint
  - Risk: `localhost` host fails for production users.
  - State: Fixed in frontend `getGraphQLEndpoint()` to use `/graphql` (browser) and absolute `${NEXT_PUBLIC_API_BASE}/graphql` (server) with strict env checks.
  - Next: Ensure `NEXT_PUBLIC_API_BASE` is set in prod and avoid hardcoded `localhost` in API routes.

- ESLint/TypeScript in builds
  - State: Enforced (`ignoreDuringBuilds: false`, `ignoreBuildErrors: false`) in `next.config.ts`.
  - Next: Reinstate lint in CI: run `eslint --max-warnings=0` and fail on violations.

- Content-Security-Policy (CSP)
  - Risk: Nginx `react.conf` allows `'unsafe-inline'` which reduces XSS protection.
  - State: Added hardened headers in Next (HSTS, COOP, CORP, Referrer-Policy, X-Content-Type-Options) and a strict CSP in Report-Only to guide migration.
  - Next: Implement nonce/hash-based CSP in Next (custom Document with nonces), then remove `'unsafe-inline'` in Nginx and switch Report-Only -> Enforce.

- SSR data strategy
  - Risk: `ApolloWrapper` as a client provider at the root encourages CSR and hurts SEO/TTFB.
  - Next: Adopt server-side data for SEO-critical pages; consider `@apollo/experimental-nextjs-app-support` with `ApolloNextAppProvider` and RSC-friendly patterns.

- Backend CORS/AllowedHosts
  - State: `AllowedHosts: "*"` in `backend/appsettings.json`; CORS allows several dev origins.
  - Next: Restrict `AllowedHosts` to production domain(s) and refine CORS to specific origins.

- Performance optimizations
  - State: `images.minimumCacheTTL` increased to `86400`. Dev proxy for `/graphql` is present.
  - Next: Use SSR/streaming for lesson/overview pages, audit bundles, code-split, and configure CDN/edge caching.

- Reliability & Observability
  - Next: Add Sentry (frontend/backend), structured logging, health endpoints, Apollo errorLink reporting, circuit breakers, and tuned timeouts.

- DX & CI/CD
  - Next: CI gates for lint/tests, GraphQL codegen for typed queries, environment vars (`NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_SITE_URL`) and sitemap derivation, precommit hooks (lint-staged + prettier + eslint).

## Concrete Fixes Completed in This Session

- Frontend `getGraphQLEndpoint()` uses `/graphql` in the browser and `${NEXT_PUBLIC_API_BASE}/graphql` on the server; removed implicit reliance on `localhost`.
- Added security headers in `next.config.ts` (HSTS, COOP, CORP, Referrer-Policy, X-Content-Type-Options) and CSP (strict in Report-Only, safe baseline enforced).
- Increased image cache TTL to `86400`.

## Concrete Fixes To Prioritize (Remaining)

- Remove `'unsafe-inline'` from Nginx CSP and adopt nonce/hashes; align Next nonce-based CSP.
- Replace client-only Apollo pattern with server-side fetching for SEO-critical pages.
- Reinstate lint/type checks in CI and precommit; keep strict TypeScript.
- Lock down backend `AllowedHosts` and CORS to production origins.

## Implementation Notes

- Environment: set `NEXT_PUBLIC_API_BASE` to public HTTPS base (e.g., `https://yourdomain.com`).
- Rewrites: `/graphql` -> `${NEXT_PUBLIC_API_BASE}/graphql` in `next.config.ts` (dev proxy fallback `http://127.0.0.1:8080`).
- CSP migration: introduce request-scoped nonces in Next `_document` and apply them to `next/script`.

## Next Steps

1) Confirm production domain and proxy layout; configure `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_SITE_URL`.
2) Migrate to nonce-based CSP in Next and remove `'unsafe-inline'` in Nginx.
3) Replace `ApolloWrapper` with server-side patterns on SEO-critical routes.
4) Add Sentry, CI gates (lint/tests), and GraphQL codegen.