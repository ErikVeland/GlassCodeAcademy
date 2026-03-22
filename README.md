# GlassCode Academy

GlassCode Academy is a full-stack educational platform designed to help developers learn and prepare for interviews in modern web technologies. The application provides structured learning resources and realistic interview practice with instant feedback.

## Architecture

The project is structured as a monorepo using NPM workspaces:

- **`apps/web`**: Next.js 15+ frontend application.
- **`apps/api`**: Node.js/Fastify backend API.
- **`content`**: Shared content (lessons, quizzes) in JSON format.

### Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript.
- **Backend**: Fastify, Node.js, Sequelize, PostgreSQL, Redis.
- **Infrastructure**: Docker, Docker Compose.

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development environment (Frontend, Backend, Database, Redis):

   ```bash
   docker-compose up -d
   ```

   Alternatively, to run services locally without Docker for code (DB/Redis still recommended via Docker):

   ```bash
   # Start DB & Redis
   docker-compose up -d postgres redis

   # Start Apps
   npm run dev
   ```

### Development Scripts

- `npm run dev`: Start both frontend and backend in development mode.
- `npm run build`: Build both applications.
- `npm run lint`: Lint all applications.
- `npm run test`: Run tests across the workspace.

## Documentation

Key references in the `docs/` directory:

| Doc                                              | Purpose                                      |
| ------------------------------------------------ | -------------------------------------------- |
| [Architecture](docs/CURRENT_ARCHITECTURE.md)     | System design, data flow, tech stack         |
| [Authentication](docs/AUTHENTICATION_SYSTEM.md)  | Auth flow, NextAuth, JWT, OAuth setup        |
| [Contributing](docs/CONTRIBUTING.md)             | Dev workflow, branch conventions, PR process |
| [Content Structure](docs/CONTENT_STRUCTURE.md)   | Lesson/quiz JSON schema and registry format  |
| [Testing](docs/TESTING_INSTRUCTIONS.md)          | E2E and unit test setup                      |
| [Production Runbook](docs/PRODUCTION_RUNBOOK.md) | Deploy flow, env setup, DB migrations        |
| [Performance](docs/PERFORMANCE_OPTIMIZATION.md)  | Caching, prefetch, and optimization notes    |
| [Health Check](docs/HEALTH_CHECK.md)             | API health endpoints and monitoring          |

## License

MIT
