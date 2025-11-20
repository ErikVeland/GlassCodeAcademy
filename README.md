# GlassCode Academy - Fullstack Learning & Interview Trainer

[Visit GlassCode Academy](https://glasscode.academy) - Live Demo & Production Site

> **Note**: This documentation has been consolidated. For information about documentation organization, see [DOCUMENTATION_CONSOLIDATION_GUIDE.md](docs/DOCUMENTATION_CONSOLIDATION_GUIDE.md).

## Project Overview

GlassCode Academy is a full-stack educational platform designed to help developers learn and prepare for interviews in modern web technologies. The application provides structured learning resources and realistic interview practise with instant feedback.

For detailed information about the current architecture, see [CURRENT_ARCHITECTURE.md](docs/CURRENT_ARCHITECTURE.md).

For current project status, see [PROJECT_STATUS_SUMMARY.md](docs/PROJECT_STATUS_SUMMARY.md).

> **Note**: This is purely a learning and coding challenge! No real application would (or should) be architored this way. In the real world, you wouldn't run 5+ separate technology stacks just to teach about them. But for the sake of learning and demonstrating proficiency in each technology, we've gone a bit overboard with the architecture. Think of it as an educational extreme sport!

## Features

- **Learning Tracks**: Comprehensive lessons for Next.js, GraphQL, React, Tailwind CSS, Node.js, and SASS
- **Step-by-Step Lessons**: Code examples with expected outputs
- **Interview Quizzes**: Multiple-choice and open-ended questions
  - Tier-weighted difficulty reporting and selection (see docs)
- **Progress Tracking**: Local storage-based progress tracking
- **Gamification**: Certificate rewards for completed modules
- **Modern UI**: Built with Next.js, React, and Tailwind CSS
- **Responsive Design**: Adapts to different screen sizes with a wider layout for better module visibility
- **Enhanced Security**: JWT authentication with role-based access control
- **Structured Logging**: Comprehensive observability
- **Robust Testing**: 100+ automated tests with code coverage requirements
- **WCAG-Compliant Theming**: Dark/Light/Auto theme switching with accessibility compliance

## Technology Stack

### Frontend
- `next@15.3.5`
- `react@19` and `react-dom@19`
- `typescript@5`
- `tailwindcss@4`

### Backend
- `node@18+` with `fastify@5`
- `postgresql` with `sequelize@6`
- `redis` for caching
- `jsonwebtoken` for auth and RBAC
- `pino` for structured logging
- `jest@30` and `supertest@7` for tests
- `zod` for validation

### Developer Workflow
- `npm install` installs all required packages (no manual extras)
- `./start-dev.sh` boots backend on `http://localhost:8080` and frontend on `http://localhost:3000`
 - `./start-dev.sh` boots backend on `http://localhost:8081` and frontend on `http://localhost:3000`
- Type safety: `npm run typecheck` in `glasscode/frontend`
- Linting: `npm run lint` in both frontend and backend

### Documentation
- See `docs/INDEX.md` for a curated entry point that links to the architecture, tech stack, testing instructions, and service READMEs.

### Local Development & Verification

- Backend (apps/api):
  - `cd apps/api && npm ci && npm test && npm run lint`
  - Health scripts: `node scripts/check-db-coverage.js`
- Frontend (glasscode/frontend):
  - `cd glasscode/frontend && npm ci && npm run typecheck && npm run lint && npm run build`
  - Start (standalone build): `PORT=3000 NEXT_PUBLIC_API_BASE=http://localhost:8081 node .next/standalone/server.js`
- Docker Compose (dev):
  - `docker compose up -d` to start `api`, `frontend`, `postgres`, and `redis`
  - Frontend in Compose uses `NEXT_PUBLIC_API_BASE=http://api:8081`
- Services and Ports:
  - Frontend: `http://localhost:3000`
  - API: `http://localhost:8081`
  - PostgreSQL: `localhost:5432` (`postgres`/`postgres`)
  - Redis: `localhost:6379`
- Observability (optional):
  - See `apps/api/docker-compose.yml` for Grafana, Prometheus, Jaeger; Grafana defaults to `http://localhost:3005`

Notes:
- In dev, NextAuth may log a client fetch error if `NEXTAUTH_URL`/`NEXTAUTH_SECRET` are unset; set `.env.local` for full auth.
- Terraform operations require AWS credentials; export an `AWS_PROFILE` or set `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`.

## System Architecture

The application follows a modern full-stack architecture with a Next.js frontend and Node.js/Fastify backend, communicating via a RESTful API. The backend has been standardized to use a monorepo structure with shared packages for better code reuse and maintainability.

```
graph TB
    A[User Browser] --> B[Next.js 15.3.5 Frontend]
    B --> C[Node.js API Client]
    C --> D[RESTful API]
    D --> E[Node.js/Fastify 18+ Backend]
    E --> F[PostgreSQL Database]
    E --> G[Sequelize ORM]
    E --> H[Redis Cache]
    
    I[JWT Authentication] --> E
    J[RBAC System] --> E
    
    K[NGINX Gateway] --> B
    K --> E
    
    L[Quiz Prefetch Service] --> B
    M[Progress Tracking] --> B
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style E fill:#e8f5e8
    style F fill:#fff3e0
    style G fill:#fce4ec
    style H fill:#bbdefb
    style I fill:#c8e6c9
    style J fill:#c8e6c9
    style K fill:#ffecb3
```

## Directory Structure

```
GlassCodeAcademy/
├── apps/
│   ├── api/                     # Node.js/Fastify application
│   │   ├── src/
│   │   │   ├── controllers/     # Route controllers
│   │   │   ├── models/          # Data models
│   │   │   ├── routes/          # API routes
│   │   │   ├── services/        # Business logic services
│   │   │   ├── middleware/      # Custom middleware
│   │   │   ├── plugins/         # Fastify plugins
│   │   │   ├── config/          # Configuration files
│   │   │   └── utils/           # Utility functions
│   │   ├── scripts/             # Utility scripts
│   │   └── server.js            # Application entry point
│   └── frontend/                # Next.js application
├── packages/
│   ├── shared/                  # Shared types, Zod schemas, utilities
│   └── config/                 # Shared configuration, ESLint/Prettier
├── infra/                      # Infrastructure code (Docker, Terraform, etc.)
├── glasscode/
│   └── frontend/               # Next.js application
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # Reusable components
│       │   ├── hooks/          # Custom React hooks
│       │   └── lib/            # Utility functions
│       │       └── api/        # API client and hooks
│       └── public/             # Static assets
├── content/                    # Content files (lessons and quizzes)
│   ├── lessons/                # Lesson content JSON files
│   ├── quizzes/                # Quiz content JSON files
│   └── registry.json           # Content registry
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
└── tests/                      # Test projects (see app-specific test folders)
```

## Implementation Progress

The GlassCode Academy application has made significant progress in implementing enterprise-grade features:

### Security Infrastructure ✅
- JWT authentication with token validation and expiration
- Role-Based Access Control with hierarchical roles (Admin, Instructor, Student, Guest)
- Organization and Team constructs for multi-tenancy
- Policy-based authorization with custom requirements

### Observability ✅
- Structured logging with Pino (JSON format)
- Correlation ID tracking across requests
- Standardized error responses with RFC 7807-style problem details
- Performance timing for operations

### Testing Infrastructure ✅
- Comprehensive test suite
- Code coverage requirements (80% threshold)
- GitHub Actions CI/CD pipeline with automated testing
- Jest and Supertest for backend tests; Playwright for E2E

### Accessibility ✅
- WCAG-compliant dark/light/auto theming
- Semantic colour tokens with smooth transitions
- No first-paint flash prevention
- Keyboard navigation support

For detailed progress tracking, see [IMPLEMENTATION_PROGRESS_TRACKER.md](docs/IMPLEMENTATION_PROGRESS_TRACKER.md).

## Quiz Difficulty & Reporting

We use tier-weighted difficulty targets to keep quizzes aligned with module tiers (e.g., foundational favours beginner content). A reporting script summarizes predicted per-attempt difficulty based on current pools:

- Script: `scripts/quiz-difficulty-report.js`
- Docs: `docs/QUIZ_DIFFICULTY.md`

Run:

```bash
node scripts/quiz-difficulty-report.js
```

This prints pool sizes and predicted beginner/intermediate/advanced counts per module using tier weights and quiz length.

## Security Features

### JWT Authentication
- Token-based authentication with signature validation
- Token expiration and refresh capabilities
- Claims extraction and validation

### Role-Based Access Control (RBAC)
- Hierarchical role system (Admin, Instructor, Student, Guest)
- Policy-based authorization with custom requirements
- Organization and team-based scoping
- Multi-tenancy support

## Observability

### Structured Logging
- Pino-based structured logging with JSON format
- Correlation ID tracking across requests
- Contextual log metadata and error stacks
- Console transport in dev; file/JSON transport in production
- Performance timing and error tracking

### Health Monitoring
- Application health checks
- Database connectivity monitoring
- Rate limit and request metrics
- API response time tracking

## Testing Infrastructure

### Unit Testing
- Jest for unit and service tests
- Built-in mocking utilities and test doubles
- Coverage targets enforced via `npm run test:coverage`
- CI-ready test scripts

### Integration Testing
- Supertest for API endpoint tests
- Database integration tests via Sequelize + PostgreSQL
- Security feature validation (JWT, RBAC, rate limits)
- Performance smoke checks

## Recent Enhancements (November 2025)

### Backend Standardization
- Migrated from Express.js to Fastify for improved performance
- Enhanced Sequelize ORM with better type safety
- Implemented Redis caching for frequently accessed data
- Standardized validation with Zod schemas

### Security Improvements
- Enhanced JWT authentication with improved token handling
- Added role-based access control system
- Created organization and team constructs
- Enhanced authorization policies

### Observability Improvements
- Replaced Winston with Pino for better performance
- Implemented correlation ID tracking
- Standardized error response formats
- Added performance timing to operations

### Performance Optimizations
- Added request compression middleware
- Implemented comprehensive input validation
- Enhanced caching with time-based invalidation
- Added performance monitoring and metrics

### Infrastructure Improvements
- Containerized application with Docker
- Created multi-stage Dockerfile for optimized images
- Implemented docker-compose for local development
- Added CI/CD pipeline with GitHub Actions

### Testing Infrastructure
- Enhanced test project with 100+ passing tests
- Added code coverage requirements (80% threshold)
- Implemented GitHub Actions CI/CD pipeline
- Added security feature integration tests

For detailed progress information, see [PROGRESS_REPORT.md](docs/PROGRESS_REPORT.md) and [IMPLEMENTATION_PROGRESS_TRACKER.md](docs/IMPLEMENTATION_PROGRESS_TRACKER.md).

## Question Schema & Authoring

We've standardized the question schema and added fields to better control multiple-choice presentation and open-ended validation:

- Multiple-choice
  - `fixedChoiceOrder` (boolean): prevents shuffling when order matters
  - `choiceLabels` (string): set to `letters` to render choices as `A. / B. / C. / D.`
- Open-ended
  - `acceptedAnswers` (array of strings): alternative correct phrasings (case-insensitive match)

Authoring guidelines and the full schema live in:
- `docs/QUESTION_TEMPLATE.md`
- `CONTRIBUTING.md`

## Automatic Migration: Letter-Labeled Fixed Order

A migration script updates existing quiz content that references lettered options or includes "All of the above" / "None of the above" to use fixed order with letter labels.

- Dry run (shows what would change):
  ```bash
  node scripts/migrate-lettered-questions.js --dry
  ```
- Apply changes:
  ```bash
  node scripts/migrate-lettered-questions.js
  ```

What it does:
- Scans `content/quizzes/*.json`
- For questions that reference letters in the prompt or choices, or include "All of the above"/"None of the above":
  - Sets `fixedChoiceOrder: true`
  - Sets `choiceLabels: "letters"`

After running, start the app and visit module quiz pages to confirm A/B/C/D prefixes and that affected questions no longer shuffle.

## Technology Modules Implementation

### Backend Technologies

#### Fastify API Modules
- Core modules with structured lessons and interview questions
- RESTful API built with Fastify and Sequelize
- Redis caching for improved performance
- Zod validation for type safety

#### Authentication System
1. **JWT Authentication**: Token-based authentication with signature validation
2. **OAuth Integration**: Support for Google, GitHub, and Apple authentication
3. **Role-Based Access Control**: Hierarchical role system (Admin, Instructor, Student, Guest)

##### API Content Structure
- Courses with modules and lessons
- Interactive quizzes with multiple-choice and open-ended questions
- Progress tracking and completion certificates
- Content versioning and publishing workflows

##### Interview Questions
- 100+ professional multiple-choice and open-ended questions covering core web development concepts
- Tier-weighted difficulty reporting and selection

### Frontend Technologies

#### React Modules
1. **Component-Based Learning**: Lessons on React components, hooks, and state management
2. **Interactive Quizzes**: Interview questions covering React fundamentals and advanced concepts
3. **Technology-Specific Styling**: Blue-themed interface for React content

#### Tailwind CSS Modules
Utility-first CSS framework for rapid UI development

#### Node.js Modules
1. **Server-Side JavaScript**: Lessons on Node.js fundamentals
2. **Interactive Quizzes**: Interview questions covering Node.js concepts
3. **Technology-Specific Styling**: Green-themed interface for Node.js content