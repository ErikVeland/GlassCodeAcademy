# Academy Bundles: Structure, Packaging, and CMS Controls

## Goals

- Enable portable, whole-site bundling for “Glass Academies” with unique curricula.
- Standardize structure for content, configuration, branding, and assets.
- Provide a backend control panel (CMS) to manage academies, modules, lessons, quizzes, and publishing workflows.
- Support multi-tenant hosting and simple import/export of bundles.

## Bundle Overview

An Academy Bundle is a versioned, portable package containing:
- `manifest` with identity, version, and feature flags
- `config` with branding, theme, navigation, features
- `content` with lessons, quizzes, registry
- `assets` with logos, images, and downloadable resources
- `i18n` translations

### Directory Structure

```
academies/
  <academy-slug>/
    bundle.json           # manifest + registry of components
    config/
      academy.json        # name, slug, locale, feature flags
      theme.json          # tokens, colors, typography, spacing
      navigation.json     # primary/secondary menus and routes
      features.json       # feature flags & module enablement
    content/
      lessons/*.json      # module lesson sets
      quizzes/*.json      # module quizzes (question banks)
      registry.json       # module slugs, titles, routes, ordering
    assets/
      brand/              # logos, icons, favicons
      images/             # lesson and quiz imagery
      downloads/          # PDFs & supplemental materials
    i18n/
      en/*.json           # English translation files
      <locale>/*.json     # additional locales
```

### Bundle Manifest (`bundle.json`)

```json
{
  "name": "GlassCode Academy",
  "slug": "glasscode",
  "version": "1.0.0",
  "schemaVersion": "2025.10",
  "defaultLocale": "en",
  "supportedLocales": ["en"],
  "modules": [
    { "slug": "nextjs-advanced", "title": "Next.js Advanced" },
    { "slug": "graphql-advanced", "title": "GraphQL Advanced" }
  ],
  "features": {
    "certificates": true,
    "progressTracking": true,
    "gamification": true,
    "contentVersioning": true
  },
  "metadata": {
    "createdAt": "2025-10-01T00:00:00Z",
    "lastUpdated": "2025-10-01T00:00:00Z"
  }
}
```

## Content Schema Highlights

- Lessons: see `docs/LESSON_TEMPLATE.md`
- Quizzes: see `docs/QUESTION_TEMPLATE.md` and `CONTRIBUTING.md`
  - Multiple-choice: `fixedChoiceOrder` (boolean), `choiceLabels` (string: `letters`), `correctAnswer` (index)
  - Open-ended: `acceptedAnswers` (array of strings)
  - Shared fields: `topic`, `type`, `question`, `choices`, `explanation`, `sources`, `tags`, `difficulty`

## Modularity: Components to Package

- Academy config: `academy.json`, `theme.json`, `navigation.json`, `features.json`
- Content: `lessons/*.json`, `quizzes/*.json`, `registry.json`
- Assets: `brand/`, `images/`, `downloads/`
- Translations: `i18n/<locale>/*.json`
- Scripts (optional): validation hooks, migration notes

## CMS and Control Panel Scope

The backend control panel should allow authorized admins to manage the following:

### Academy Settings
- `name`, `slug`, `defaultLocale`, `supportedLocales`
- Branding assets: logo, favicon, app icons
- Theme tokens: colors, fonts, typography, spacing, radii
- Navigation: menu items, ordering, visibility, external links
- Feature flags: certificates, progress tracking, gamification, accessibility modes
- SEO: meta title, description, social image, robots directives

### Tracks & Modules
- Create, update, reorder modules and tracks
- Set visibility, prerequisites, and tier/difficulty weighting
- Module metadata: `title`, `description`, `colorScheme`

### Lessons
- CRUD lessons and lesson sections
- Rich text + code blocks + expected output
- Attach images/downloads from assets
- Versioning: draft → review → publish; rollback
- Validation: linting/format checks, link checker, accessibility audit

### Quizzes & Question Banks
- CRUD quizzes and questions
- Multiple-choice controls:
  - `fixedChoiceOrder` toggle
  - `choiceLabels` (`letters`)
  - Time limit, passing score, pool size/selection rules
  - Difficulty weighting and tags
  - “All/None of the above” placement enforcement
- Open-ended controls:
  - `acceptedAnswers` management (normalize case/whitespace)
  - Hints, rubric, auto-evaluation toggle

### Content Registry & Routing
- Manage `registry.json` (module slugs, route paths, ordering)
- Preview URL generation per module/lesson/quiz

### Localization
- Locale enablement and default locale
- Per-lesson and per-question translations
- Translation workflows and completeness tracking

### Publishing Workflow
- Draft/review/approved/published states
- Scheduled publishing and release notes
- Audit logs for changes and approvals

### Governance & Roles
- Roles: Admin, Editor, Reviewer, Viewer
- Permissions: per-area fine-grained ACL
- Audit trails and exportable logs

### Integrations
- Analytics: provider keys, events, dashboards
- Domain & gateway settings (multi-tenant mapping)
- Webhooks for publish/deploy events

## Runtime & Multi-Tenancy

- The frontend and GraphQL backend load academy resources by `academySlug` (from env, subdomain, or request context).
- Content resolvers read from `academies/<slug>/content` with registry-driven routing.
- Theme and navigation are injected via `academy/<slug>/config` into the frontend layout.
- Isolation: no cross-academy references; assets are scoped.

## Packaging & Operations

### Import/Export
- Export: zip `academies/<slug>` → distributable bundle
- Import: unpack into `academies/<slug>` and validate

### Validation
- Schema checks for `bundle.json`, `registry.json`, lessons, quizzes
- Route validation and link checks
- Accessibility audit on lessons content

### Suggested Scripts
- `scripts/create-academy-bundle.js` – scaffold from template
- `scripts/validate-bundle.js` – schema + route checks (reuses content validators)
- `scripts/export-academy-bundle.js` – zip with manifest
- `scripts/import-academy-bundle.js` – unpack + register
- `scripts/migrate-lettered-questions.js` – question order and labels

## Example Configs

### `config/academy.json`
```json
{
  "name": "Acme Frontend Academy",
  "slug": "acme-frontend",
  "defaultLocale": "en",
  "supportedLocales": ["en", "es"],
  "features": {
    "certificates": true,
    "progressTracking": true,
    "gamification": false,
    "contentVersioning": true
  }
}
```

### `config/theme.json`
```json
{
  "colors": {
    "primary": "#1E88E5",
    "secondary": "#4FC3F7",
    "accent": "#1565C0"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "scale": "minorThird"
  },
  "radius": {
    "sm": 6,
    "md": 10,
    "lg": 16
  }
}
```

### `config/navigation.json`
```json
{
  "primary": [
    { "label": "Home", "href": "/" },
    { "label": "Lessons", "href": "/lessons" },
    { "label": "Quizzes", "href": "/interview" }
  ],
  "secondary": [
    { "label": "About", "href": "/about" },
    { "label": "Support", "href": "/support" }
  ]
}
```

## Backend Implementation Notes

- Extend GraphQL schema with admin mutations/queries:
  - `academy(slug)`; `academies()`
  - `updateAcademySettings(input)`
  - `createModule(input)`, `updateModule(input)`, `deleteModule(id)`
  - `createLesson(input)`, `updateLesson(input)`, `publishLesson(id)`
  - `createQuestion(input)`, `updateQuestion(input)`, `publishQuiz(id)`
  - `addTranslation(input)`, `updateTranslation(input)`
  - `uploadAsset(file)`
- Store content in JSON for portability; optionally back with a database for audit/versioning.
- Enforce validation via pipeline: schema → lint → accessibility → routes.

## Portability Guidelines

- Avoid hard-coded module ids or cross-academy asset paths.
- Use `registry.json` for slugs, titles, and route mappings.
- Keep assets relative under `assets/` and reference by path.
- Normalize question authoring with `fixedChoiceOrder`, `choiceLabels: "letters"`, and `acceptedAnswers` where applicable.
- Document breaking changes and migrations in the bundle manifest.

---

For authoring specifics, see `docs/QUESTION_TEMPLATE.md` and `CONTRIBUTING.md`. For difficulty, see `docs/QUIZ_DIFFICULTY.md`.

## Scaffolding Workflow (Proposed)

Goals: quickly spin up a new portable academy, wire runtime, and validate content.

- New Academy (CLI)
  - `node scripts/create-academy-bundle.js --slug acme-frontend --name "Acme Frontend Academy" --locale en --template default`
  - Creates `academies/acme-frontend/` with `bundle.json`, `config/*`, `content/*`, `assets/*`, `i18n/*`.
- Validation
  - `node scripts/validate-bundle.js --slug acme-frontend`
  - Checks manifest, registry, lessons, quizzes, routes, links, accessibility.
- Export / Import
  - Export: `node scripts/export-academy-bundle.js --slug acme-frontend --out dist/`
  - Import: `node scripts/import-academy-bundle.js --file dist/acme-frontend.zip`
- Dev Wiring
  - Set `ACADEMY_SLUG=acme-frontend` in frontend and backend env.
  - Frontend loads theme/navigation from `config/` and content via GraphQL resolvers.
- Local Preview
  - Start services; navigate with `?academy=acme-frontend` or subdomain mapping.

These commands are placeholders to be implemented once the full design is finalized.

## Backend Extension Strategy (Proposed)

Extend the GraphQL/backend to support multi-tenant academies, admin controls, and bundle portability.

- GraphQL Schema
  - Queries: `academy(slug)`, `academies()`, `modules(academySlug)`, `lessons(academySlug,module)`, `quiz(academySlug,module)`
  - Admin Mutations: `updateAcademySettings`, `createModule`, `updateModule`, `deleteModule`, `createLesson`, `updateLesson`, `publishLesson`, `createQuestion`, `updateQuestion`, `publishQuiz`, `addTranslation`, `updateTranslation`, `uploadAsset`
  - Authorization: role-based directives or middleware for Admin/Editor/Reviewer.
- Content Loaders
  - Resolve `academySlug` from subdomain/env/request.
  - Read `academies/<slug>/content` and `config` with registry-driven routing.
  - Normalize questions with `fixedChoiceOrder`, `choiceLabels: "letters"`, and `acceptedAnswers`.
- Versioning & Workflow
  - Draft → Review → Approved → Published states.
  - Keep audit trail (who/when/what), with rollback to previous versions.
- Storage Options
  - Phase 1: JSON on disk for portability and simple export/import.
  - Phase 2: Database-backed indexes for versioning, audit logs, and search.
  - Suggested tables: `academies`, `modules`, `lessons`, `quizzes`, `questions`, `assets`, `translations`, `versions`, `change_logs`.
- Assets & Translations
  - Asset storage: local `assets/` or object storage (S3-compatible) scoped by academy.
  - Translation files per locale with completeness tracking and workflows.
- Multi-Tenancy
  - Subdomain → `academySlug` mapping.
  - Strict isolation in resolvers; enforce slug scoping for all queries/mutations.
- Events & Webhooks
  - Emit `content.published`, `content.updated`, `bundle.exported/imported`.
  - Optional job queue for indexing, cache warming, and analytics.
- Caching & Indexing
  - Cache content by `{academySlug, version}` in-memory or distributed cache.
  - Index search on `lessons` and `questions` using tags, topics, difficulty.
- Validation Pipeline
  - Schema → lint → accessibility → routes → link checks before publish.

## Roadmap & Phases (Placeholder)

- Phase 1: Docs and schemas; basic CLI scaffolding; academy-aware resolvers.
- Phase 2: Admin GraphQL API; RBAC; validation pipeline; import/export.
- Phase 3: Full CMS UI; versioning, scheduling, audit logs; search and analytics.
- Phase 4: Multi-locale publishing; asset CDN integration; plugin architecture.