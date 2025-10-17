# GlassCode Academy - Improvement Design Document (Enhanced)

## 📋 Executive Summary

This document extends the current improvement plan to transform GlassCode Academy into a competitive, enterprise-grade eLearning platform. It adds concrete architecture, data models, workflows, and CI/CD, security, and analytics implementations required for modular "Academies", a robust CMS, full user authorisation, and persistent progress tracking. It also includes migration, SLOs, disaster recovery, and a staged delivery plan.

## 📊 Current Implementation Status

**Overall Progress: 25-30% Complete**
**Last Assessment: October 17 2025**

### Implementation Overview
GlassCode Academy currently operates as a functional educational platform with strong frontend foundations but significant gaps in enterprise-grade infrastructure. The project demonstrates good architectural thinking and has solid content management, but requires systematic implementation of DevOps practices, comprehensive testing, monitoring, security hardening, and a proper data layer.

### Phase Completion Status

| Phase | Progress | Status | Key Achievements | Critical Gaps |
|-------|----------|--------|------------------|---------------|
| **Phase 1: Foundation & Quality** | 60% | 🟡 Partial | Frontend testing suite, Error boundaries | Backend testing (0%), Structured logging |
| **Phase 2: DevOps & Automation** | 10% | 🔴 Not Started | Documentation exists | No CI/CD, No containerization, No IaC |
| **Phase 3: Monitoring & Observability** | 20% | 🔴 Minimal | Basic performance tracking | No monitoring stack, No alerting, No tracing |
| **Phase 4: Advanced Features** | 40% | 🟡 Partial | Progress tracking hooks | No user database, No CMS, No search |

### Strengths Identified
- ✅ Robust Frontend Architecture: Next.js with TypeScript, comprehensive component library
- ✅ Error Handling: Global error boundaries and comprehensive try-catch implementations
- ✅ Content Structure: Well-organised JSON-based lesson and quiz system
- ✅ Performance Monitoring: Core Web Vitals tracking and performance hooks
- ✅ User Experience: Progress tracking and streak management functionality

### Critical Infrastructure Gaps
- ❌ Backend Testing: Zero test coverage in .NET Core backend
- ❌ CI/CD Pipeline: No automated testing or deployment workflows
- ❌ Production Monitoring: No observability stack (Prometheus, Grafana, logging, tracing)
- ❌ Database Integration: Still using JSON files for all data persistence
- ❌ Security & Compliance: No documented security model, DPA, data residency, or audit logging
- ❌ Backend Dashboard: No dashboard, no modularisation, no support for editing, no support for exportable "Academies" - full portable websites
- ❌ Search & Discovery: No search index or API for course discovery
- ❌ Notification & Messaging: No email/in-app notifications
- ❌ Community Layer: No discussions, Q&A, or collaboration
- ❌ Monetisation: No subscriptions or licensing model
- ❌ Accessibility & i18n: No formalised compliance plan or localisation framework

---

## 🎯 Implementation Phases

### Phase 1: Foundation & Quality (Weeks 1-4)
**Priority**: Critical
**Dependencies**: JSON structure fixes

#### 1.1 Comprehensive Testing Implementation
**Objective**: Establish robust testing foundation
**Current Status**: 50% Complete - Frontend implemented, Backend missing

**Backend Testing** ❌ Not Implemented (0% coverage)
- **Unit Tests**: Controllers, Services, GraphQL resolvers
  Target: 80%+ code coverage
  Framework: xUnit, Moq, FluentAssertions
  Location: `glasscode/backend/Tests/`

- **Integration Tests**: GraphQL endpoints, data loading
  Validate GraphQL schema compliance, data contracts, and health endpoints.

- **Contract Tests**: Pact for consumer/provider agreements between frontend and backend.

- **Static Analysis & Security**: Roslyn analyzers, .editorconfig ruleset, OWASP Dependency Check.

**Frontend Testing** ✅ Well Implemented (≈80% coverage)
- Unit tests (Jest + React Testing Library), E2E (Playwright) with deterministic fixtures and data seeding.

**Implementation Steps**
1. Create backend test projects: `GlassCode.Backend.UnitTests`, `GlassCode.Backend.IntegrationTests`.
2. Add coverage thresholds in CI (minimum 80% lines/branches).
3. Add Pact contract tests for GraphQL schema using snapshot verification.
4. Introduce `Testcontainers` for ephemeral PostgreSQL and Redis in integration tests.
5. Add code quality gates: `dotnet format`, analyzers, linting for TypeScript.

**Example: xUnit Test Skeleton**
```csharp
using Xunit;
using FluentAssertions;
using GlassCode.Backend.Services;
using Microsoft.Extensions.Logging.Abstractions;

public class DataServiceTests
{
    [Fact]
    public void GetLessonById_ReturnsLesson()
    {
        var svc = new DataService(new NullLogger<DataService>());
        var lesson = svc.GetLessonById("lesson-101");
        lesson.Should().NotBeNull();
        lesson!.Id.Should().Be("lesson-101");
    }
}
```

#### 1.2 Enhanced Error Handling & Logging
**Objective**: Implement comprehensive error handling and structured logging
**Current Status**: 70% Complete - Frontend excellent, Backend basic

**Backend Improvements**
- Global exception middleware with correlation IDs (`X-Correlation-Id`).
- Structured logging with Serilog sinks: Console, File (rolling), Seq or Application Insights.
- Standardised error shape with problem details (`RFC 7807`).

**Example: Serilog Bootstrap (Program.cs)**
```csharp
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();
```

**Example: Global Exception Middleware**
```csharp
using System.Net;
using System.Text.Json;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var id = context.TraceIdentifier;
            var payload = new
            {
                type = "https://glasscode/errors/unexpected",
                title = "Unexpected server error",
                status = 500,
                traceId = id,
                detail = "An unexpected error occurred."
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
```

Add middleware in `Program.cs`:
```csharp
app.UseMiddleware<GlobalExceptionMiddleware>();
```

#### 1.3 Security Baseline
- Centralised auth via OAuth/OIDC (Google, GitHub, Apple) with PKCE.
- RBAC roles: `Admin`, `Instructor`, `Student`, `Guest`.
- Secrets via Azure Key Vault or AWS Secrets Manager (no secrets in repo).
- TLS 1.3, HSTS, strict CSP, Samesite cookies, CSRF protection on forms.
- Data protection keys stored in Redis for multi-instance deployments.

**Role Policy Example (ASP.NET Core)**
```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireInstructor", policy => policy.RequireRole("Instructor","Admin"));
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
});
```

---

### Phase 2: DevOps, Automation & IaC (Weeks 5-8)
**Priority**: High
**Dependencies**: Phase 1 completion

#### 2.1 CI/CD Pipeline Implementation
**Objective**: Automate testing, building, scanning, and deployment

**GitHub Actions Workflows**
- CI: build, unit/integration tests, Playwright E2E, coverage upload, CodeQL, Trivy/Snyk scans.
- CD: environment matrix (dev → staging → prod) with manual approval for prod.
- Preview Environments: per-PR ephemeral deployments (Vercel for frontend, Azure Web Apps or Kubernetes namespace for backend).

**Example: `.github/workflows/ci.yml`**
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - name: Restore
        run: dotnet restore ./backend
      - name: Build
        run: dotnet build ./backend --configuration Release --no-restore
      - name: Test
        run: dotnet test ./backend --collect:"XPlat Code Coverage" --results-directory coverage
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: coverage
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --prefix frontend
      - run: npm run lint --prefix frontend
      - run: npm run test --prefix frontend
      - run: npm run build --prefix frontend
      - name: Playwright E2E
        run: npm run e2e --prefix frontend
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: 'csharp, javascript'
      - uses: github/codeql-action/analyze@v3
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@0.24.0
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'table'
          severity: 'CRITICAL,HIGH'
```

#### 2.3 Infrastructure as Code (IaC)
- Terraform modules for: Resource Groups, Postgres (managed), Redis, Storage (blob), App Services or AKS, Key Vault, CDN.
- GitHub OIDC → Cloud provider for secretless CI deployments.

---

### Phase 3: Monitoring, Observability & SRE (Weeks 9-12)
**Priority**: Medium

#### 3.1 Observability Stack
- **Metrics**: Prometheus scraping .NET metrics, Grafana dashboards.
- **Tracing**: OpenTelemetry SDK exporting to Jaeger or Application Insights.
- **Logging**: Serilog → OpenSearch/ELK or Application Insights.
- **Alerting**: Grafana Alerting for SLO breaches (latency, error rate, saturation).

**OpenTelemetry Setup (Program.cs)**
```csharp
builder.Services.AddOpenTelemetry()
    .WithMetrics(b => b.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation())
    .WithTracing(b => b.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation())
    .StartWithHost();
```

#### 3.2 SLOs and Error Budgets
- **Availability SLO**: 99.9% monthly for API and lesson CDN. Error budget 43m/month.
- **Latency SLO**: p95 API < 200ms, p99 < 400ms.
- **Release Policy**: Freeze if error budget spent; focus on reliability work.

#### 3.3 Performance Optimisation
- Response caching and ETags for content endpoints.
- GraphQL query complexity limits and depth limiting.
- Redis caching for content metadata and session state.
- Image optimisation pipeline and code splitting on the frontend.
- Lighthouse CI integration in PRs.

---

### Phase 4: Advanced Features (Weeks 13-20)
**Priority**: High (product competitiveness)

#### 4.1 Authentication & Authorisation
- OAuth/OIDC integration with refresh tokens and revocation list.
- RBAC and policy-based authorisation with per-Academy scoping.
- Organisation and Team constructs for multi-tenancy.

**Core Tables (PostgreSQL)**
```sql
CREATE TABLE organisations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  auth_provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id uuid REFERENCES users(id),
  role_id uuid REFERENCES roles(id),
  organisation_id uuid REFERENCES organisations(id),
  PRIMARY KEY (user_id, role_id, organisation_id)
);
```

#### 4.2 CMS (Authoring, Workflow, Versioning)
**Content Model Hierarchy**: Academy → Track → Course → Module → Lesson → Quiz → Question
- Versioned content with draft, review, published states.
- Rich editor (Markdown + code blocks + media uploads).
- Preview environment per version.
- Review workflow with approvers, comments, and audit log.
- Assets in Blob Storage with signed URLs.

**Content Tables (excerpt)**
```sql
CREATE TABLE academies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  visibility text NOT NULL DEFAULT 'private' -- private, public, unlisted
);

CREATE TABLE courses (
  id uuid PRIMARY KEY,
  academy_id uuid REFERENCES academies(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  language text NOT NULL DEFAULT 'en-AU'
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES courses(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  body_markdown text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft', -- draft, in_review, published
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### 4.3 Persistent Progress Tracking
- Track lesson/module/course completion, timestamps, attempts, quiz scores, time spent.
- Leaderboards (optional), badges, certificate generation.
- Event-driven ingestion for analytics (progress events queued to Kafka/Event Hub).

**Progress Tables (excerpt)**
```sql
CREATE TABLE progress (
  user_id uuid REFERENCES users(id),
  lesson_id uuid REFERENCES lessons(id),
  completed boolean NOT NULL DEFAULT false,
  completion_pct numeric(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  lesson_id uuid REFERENCES lessons(id),
  score numeric(5,2) NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz
);
```

**API Endpoints (REST example)**
```text
GET    /api/courses?academy={slug}
GET    /api/courses/{id}
GET    /api/lessons/{id}
POST   /api/progress
GET    /api/progress?user={id}&course={id}
POST   /api/quiz-attempts
GET    /api/quiz-attempts?user={id}&lesson={id}
```

#### 4.4 Search & Discovery
- Elasticsearch/OpenSearch index: lessons, courses, tags, language, difficulty.
- Incremental indexing on publish events.
- Search API with filters (academy, track, difficulty, tags, duration, language).

#### 4.5 Community & Collaboration
- Per-lesson discussions (threaded), instructor announcements, pinned FAQs.
- Moderation tools, report abuse, soft-delete, audit log.
- Notification system (email + in-app) with digest preferences.

#### 4.6 Accessibility & Internationalisation
- WCAG 2.1 AA: colour contrast checks, keyboard navigation, ARIA labels, focus order.
- i18n: locale routing, translation JSONs, pluralisation, RTL support.
- Video support: captions (VTT), downloadable transcripts, audio descriptions where relevant.

#### 4.7 Monetisation (Optional)

#### 4.8 Backend Dashboard & Academy Portability (Critical, Short-Term Priority)

**Current State**
- ❌ No backend dashboard for administrators or instructors.
- ❌ No modular separation of academies or courses for export/import.
- ❌ No editing interface for managing lessons or courses.
- ❌ No ability to generate standalone exportable academies (full static or portable deployments).

**Objective**
Build a modular, extensible backend dashboard allowing content creators, admins, and instructors to manage and export complete "Academies" as portable, self-contained websites.

**Implementation Strategy**

##### A. Backend Dashboard (Phase 4 Short-Term)
- Framework: React-based SPA served from backend (Next.js Admin route or standalone React app using Vite/Chakra).
- Authentication: Role-based (`Admin`, `Instructor`).
- Views: Courses, Lessons, Quizzes, Progress Analytics, Content Approval, Academy Settings.
- Integrate with existing GraphQL endpoints or REST APIs for CRUD operations.
- Add WebSocket or SignalR support for real-time updates on content saves or validation feedback.

**Directory Structure**
```text
/backend
  /Admin
    /Controllers
      DashboardController.cs
    /Views (if Razor)
    /ClientApp (React)
      /components
      /pages
      /hooks
```

**Dashboard API Design**
```text
GET    /api/admin/academies
POST   /api/admin/academies
PUT    /api/admin/academies/{id}
DELETE /api/admin/academies/{id}
GET    /api/admin/lessons?academy={id}
POST   /api/admin/lessons
PUT    /api/admin/lessons/{id}
DELETE /api/admin/lessons/{id}
```

**Backend Implementation**
- Create a modular service layer `AcademyManagerService` with CRUD for Courses, Lessons, Quizzes.
- Add GraphQL admin mutations (`createAcademy`, `publishAcademy`, `exportAcademy`).
- Extend role middleware to limit admin endpoints.

**Admin Dashboard Features**
- Content tree navigation (Academy → Course → Module → Lesson).
- Markdown editor with syntax highlighting and preview (Monaco or CodeMirror).
- Media upload panel (integrated with blob storage).
- Version history and diff comparison between drafts and published lessons.
- Inline validation of metadata (slug, title, tags, duration).
- Live preview using frontend rendering engine (via iframe or isolated preview route).

##### B. Modularisation & Exportable Academies
To enable organisations or instructors to **export** and self-host academies as portable static websites.

**Implementation Phases**
1. **Phase 1 (Backend groundwork):**
   - Store academy metadata (title, slug, theme, author, logo, description).
   - Implement a packaging API endpoint `/api/admin/academies/{id}/export`.
   - Package JSON content + assets + generated HTML templates.

2. **Phase 2 (Static Generation Engine):**
   - Introduce a CLI tool `glasscode-exporter` (Node.js + Next.js static export).
   - Uses Next.js `getStaticProps` to generate lesson pages.
   - Generates a static site folder `/exports/{academy-slug}`.
   - Bundle JSON content, media, and CSS theme.

   **Command Example:**
   ```bash
   npx glasscode-exporter build --academy=fullstack-basics --output=./exports/fullstack-basics
   ```

3. **Phase 3 (Import & Sync):**
   - Add `/api/admin/academies/import` for reimporting exported academies.
   - Verify schema and dependencies on import.
   - Add delta updates for incremental sync.

4. **Phase 4 (Portable Web Build Integration):**
   - Enable one-click export from dashboard (“Export Academy” button).
   - Generate a zipped static site ready for S3, GitHub Pages, or Vercel deploy.

**Benefits**
- Facilitates open educational resource sharing.
- Enables partners to host their own academies without backend dependencies.
- Reduces vendor lock-in; improves data sovereignty.
- Provides offline-ready content archives for institutions.

**Technology Stack**
- React + Next.js Admin Dashboard (or Vite + TypeScript SPA).
- GraphQL Admin API with fine-grained permissions.
- Next.js static export for full Academy builds.
- Zip archive + metadata manifest (`manifest.json`).
- Local preview server (`npx glasscode-exporter serve`).

**Example Manifest**
```json
{
  "academy": "Fullstack Fundamentals",
  "version": "1.0.3",
  "exported_at": "2025-11-01T00:00:00Z",
  "courses": [
    { "title": "Intro to .NET", "slug": "dotnet-intro" },
    { "title": "Next.js Deep Dive", "slug": "nextjs-advanced" }
  ],
  "assets": ["images/banner.png", "videos/intro.mp4"],
  "theme": "dark",
  "generator": "glasscode-exporter@1.0.0"
}
```

##### C. Short-Term Implementation Timeline
| Week | Deliverable | Description |
|------|--------------|-------------|
| Week 1 | Backend Admin API | CRUD endpoints for academies, courses, lessons |
| Week 2 | Admin Frontend MVP | React dashboard with content listing, edit forms |
| Week 3 | Academy Export CLI | CLI to export academies as static sites |
| Week 4 | One-Click Export UI | Integrated export button and preview |
| Week 5 | Import/Sync | Ability to re-import academy archives |

##### D. Long-Term Enhancements
Once the dashboard and export features are stable:
- Add content version diffing.
- Support academy theming and templating.
- Add analytics view (per lesson/course performance).
- Integrate real-time collaboration (multi-author editing).

This dashboard + export system is **core infrastructure**. Messaging, community, and monetisation are **long-term** after dashboard maturity. It provides the operational backbone for all subsequent platform growth.


- Stripe subscriptions (monthly/annual), coupons, tax handling (GST).
- Course licensing for organisations with seat management.
- Instructor payout statements and revenue share reporting.

---

## 🏗️ Technical Architecture

### Current Architecture
```
Frontend (Next.js) → Backend (.NET Core) → JSON Files
```

### Target Architecture
```
Frontend (Next.js)
      ↘
       API Gateway (.NET Core GraphQL/REST) → Auth Service (OIDC, RBAC)
        ↘                                    → CMS Service (Content + Assets)
         → PostgreSQL (User, Progress, CMS)  → Redis (Cache, Sessions, DataProtection)
          ↘                                   → Blob Storage (Media, Exports)
           → Search (Elasticsearch)          → Queue (Kafka/Event Hub)
CDN (Static Assets) ↖
```

### Cross-Cutting Concerns
- Feature flags (Unleash or LaunchDarkly).
- Rate limiting and API keys for partners.
- Schema registry for events.
- Background jobs (Hangfire/Quartz/Azure Functions).
- Idempotency keys for POST endpoints.
- Data retention policies and anonymisation for old analytics.

---

## 🔐 Security, Privacy & Compliance

- Data minimisation; PII stored only where necessary.
- GDPR/Australian Privacy compliance: export and delete endpoints for user data.
- DPA template and privacy policy, cookie consent banner.
- Audit logs for admin actions (immutable append-only store).
- Regular dependency scanning and penetration tests.
- Backups: encrypted, tested restores monthly.

**Data Export Endpoint Shape (example)**
```text
GET /api/users/{id}/export
→ returns: profile.json, progress.json, quiz-attempts.json, certificates.zip
```

---

## 📈 Analytics & Reporting

- Event taxonomy: `lesson_viewed`, `lesson_completed`, `quiz_started`, `quiz_completed`, `streak_updated`, `badge_awarded`.
- ETL to warehouse (BigQuery/Snowflake/Redshift or Postgres OLAP schema).
- Instructor dashboards: completion funnels, drop-off charts, time-on-task, quiz difficulty analysis.
- Learner dashboards: streaks, badges, recommendations, estimated time to complete tracks.
- Cohort analysis for releases and A/B tests (Optimizely or open-source alternatives).

---

## 📦 Migration Strategy

### Data Migration
1. **Dual-read**: Serve content from JSON while writing new/updated content to DB.
2. **Backfill jobs**: Migrate existing JSON content into DB with checksums.
3. **Cutover**: Flip read path to DB once parity tests pass; keep JSON as backup for a release cycle.

### Deployment Strategy
- **Blue-Green** deployments with health checks and automated rollback.
- **Feature flags** for risky changes.
- **Canary** releases for 5% traffic before full cutover.

### Disaster Recovery
- **RPO**: ≤ 15 minutes (streaming WAL backups).
- **RTO**: ≤ 60 minutes (automated infra recreation via Terraform).
- Quarterly DR drills.

---

## 🧪 Quality Gates & DORA Metrics

- Build must pass unit, integration, and E2E tests.
- Coverage ≥ 80% lines and branches (backend and frontend).
- Lint rules enforced; type checks required.
- DORA metrics tracked: Deployment Frequency (daily), Lead Time (<2 hours), Change Failure Rate (<5%), MTTR (<30 minutes).

---

## 📊 Success Metrics

| Metric | Current Status | Target | Priority |
|--------|----------------|--------|----------|
| Test Coverage | FE: ≈80%, BE: 0% | ≥80% both | Critical |
| Deployment Time | Manual (hours) | <30 minutes automated | High |
| Error Visibility | Console logs only | Structured logging + metrics + tracing | High |
| Page Load Time | Unknown | <2 seconds (p75) | Medium |
| Uptime Monitoring | None | >99.9% | Medium |
| API Latency | Unknown | p95 < 200ms | High |
| Data Export/Deletion | None | Implemented + audited | High |

---

## 🗺️ Roadmap & Timeline

| Phase | Duration | Key Deliverables | Success Criteria |
|-------|----------|------------------|------------------|
| Phase 1 | 4 weeks | Backend tests, Serilog, Security baseline | 80% coverage, RFC7807 errors, RBAC policies |
| Phase 2 | 4 weeks | CI/CD, Containers, IaC | Automated deploys, IaC-reviewed envs |
| Phase 3 | 4 weeks | Observability, SLOs, Perf | Dashboards, alerts, Lighthouse CI |
| Phase 4 | 8 weeks | Auth, CMS, Progress, Search | OAuth+RBAC, versioned CMS, persistent progress, search |
| Phase 5 | 4+ weeks | Community, Notifications, Monetisation | Discussions live, email digests, subscriptions |

---

## ✅ Immediate Actions (Next 2 Weeks)

1. Spin up Postgres and Redis locally and introduce EF Core DbContext with initial migrations.
2. Add Serilog and global exception middleware; standardise problem details.
3. Create backend test projects and wire into CI with coverage gates.
4. Add GitHub Actions CI, CodeQL, and Trivy scans.
5. Define content schema in SQL and add minimal CRUD endpoints for Courses and Lessons.
6. Introduce OpenTelemetry for traces and metrics; ship to local Jaeger and Prometheus.

---

## 🧩 Appendices

### A. Example EF Core DbContext
```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Academy> Academies => Set<Academy>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Progress> Progress => Set<Progress>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
}
```

### B. Rate Limiting (ASP.NET Core)
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 50;
    });
});
app.UseRateLimiter();
```

### C. Frontend i18n (Next.js) – Folder Shape
```text
/frontend
  /locales
    /en-AU
      common.json
    /es-ES
      common.json
  next.config.js
```

### D. Event Taxonomy (Examples)
```text
lesson_viewed: { userId, lessonId, academyId, ts }
lesson_completed: { userId, lessonId, academyId, ts, timeSpentSec }
quiz_started: { userId, lessonId, attemptId, ts }
quiz_completed: { userId, lessonId, attemptId, ts, score }
streak_updated: { userId, streakDays, ts }
badge_awarded: { userId, badgeId, ts }
```

---

**Document Version**: 2.1
**Last Updated**: October 17 2025
**Next Review**: After Phase 2 completion
**Owner**: Development Team
