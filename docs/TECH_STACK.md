# GlassCode Academy Tech Stack

This document outlines the technology stack used in the GlassCode Academy application and how the different components integrate with each other.

For a complete overview of the current architecture, see [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md).

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend
        A[Next.js 15.3.5] --> B[React 19.0.0]
        B --> C[Tailwind CSS]
        C --> D[TypeScript]
    end

    subgraph Backend
        E[Node.js/Fastify 18+]
        F[PostgreSQL Database]
        G[Prisma ORM]
        H[Redis Cache]
    end

    subgraph Infrastructure
        I[NGINX Gateway]
        J[Systemd Services]
    end

    A -- REST API --> E
    E --> F
    E --> G
    E --> H
    H -.-> E
    I --> A
    I --> E

    subgraph Development
        K[Visual Studio Code]
        L[Git]
        M[Node.js 18+]
    end

    subgraph Deployment
        N[Systemd Services]
        O[NGINX Configuration]
        P[SSL/TLS Setup]
    end

    A --> N
    E --> N
    I --> O
    O --> P
```

## Technology Components

### Frontend Technologies

1. **Next.js 15.3.5**
   - React framework with App Router
   - Server-side rendering and static site generation
   - API routes for backend integration
   - Built-in optimization features

2. **React 19.0.0**
   - Component-based UI library
   - Hooks for state management
   - Server Components for performance

3. **Tailwind CSS**
   - Utility-first CSS framework
   - Responsive design system
   - Technology-specific color schemes

4. **TypeScript**
   - Static typing for JavaScript
   - Improved developer experience
   - Better error detection

### Backend Technologies

1. **Node.js/Fastify 18+**
   - JavaScript runtime with Fastify framework
   - High-performance web server
   - Built-in middleware support
   - Logging with Pino (JSON, timestamped)

2. **PostgreSQL Database**
   - Primary database for all content and user data
   - Pure database approach with no JSON file dependencies
   - Prisma ORM for data access

3. **Prisma ORM**
   - Type-safe ORM for PostgreSQL
   - Auto-generated client with full type safety
   - Migration support
   - Query optimization

4. **Redis Cache**
   - In-memory data structure store
   - Caching for frequently accessed data
   - Session storage
   - Rate limiting

5. **Zod Validation**
   - TypeScript-first schema declaration and validation library
   - Shared schemas between frontend and backend
   - Runtime validation with static type inference

6. **Testing**
   - Jest for unit tests
   - Supertest for API integration tests
   - Coverage via `npm run test:coverage`

### Development Tools

1. **Visual Studio Code**
   - Primary development environment
   - Extensions for Node.js and TypeScript
   - Integrated terminal and debugging

2. **Git**
   - Version control system
   - Collaboration workflow

3. **Node.js 18+**
   - Backend and frontend development runtime
   - Package management with npm
   - Content validation and import scripts

### Infrastructure & Deployment

1. **NGINX Gateway**
   - Reverse proxy configuration
   - SSL/TLS termination
   - Load balancing

2. **Systemd Services**
   - Service management on Linux
   - Automatic startup and monitoring
   - Process management

3. **PM2 Process Manager**
   - Node.js process management
   - Cluster mode for load balancing
   - Automatic restart on failures

4. **Docker Containers**
   - Containerized deployment
   - Consistent environments across dev/staging/production
   - Easy scaling and deployment

### Local Verification & Dev

#### Verified Services and Ports
- Frontend (Next.js): `http://localhost:3000`
- Backend API (Fastify): `http://localhost:8081`
- PostgreSQL: `localhost:5432` (default user/password: `postgres`)
- Redis: `localhost:6379`

#### Docker Compose (Dev)
- Root `docker-compose.yml` defines `api`, `frontend`, `postgres`, and `redis` services with health checks.
- Frontend points to API via `NEXT_PUBLIC_API_BASE=http://api:8081` when run inside Compose.
- Observability: `apps/api/docker-compose.yml` contains Grafana/Prometheus/Jaeger services which can be run separately.

#### Quick Checks
- Backend (apps/api):
  - `npm ci && npm test && npm run lint`
  - Build step is N/A by design (scripts run directly; CI compiles TypeScript when needed).
- Frontend (glasscode/frontend):
  - `npm ci && npm run typecheck && npm run lint && npm run build`
  - Start (standalone output): `PORT=3000 node .next/standalone/server.js`

#### Notes
- The frontend may log a non-blocking NextAuth client error in development if `NEXTAUTH_URL`/`NEXTAUTH_SECRET` are not set. This does not prevent general navigation; set these in `.env.local` for full auth flows.
- Terraform validation currently requires AWS credentials; run plan/apply with a valid `AWS_PROFILE` or environment keys.

## Modernization Milestone Achieved ✅

### Backend Technology Modernization (Completed November 2025)
GlassCode Academy has successfully completed a major architectural transformation by migrating to a unified Node.js/Fastify backend. This modernization addressed all the issues identified in the previous architecture:

#### Migration Results:
- ✅ **Backend Modernization**: Migrated from Express.js to Fastify for improved performance
- ✅ **ORM Upgrade**: Replaced Sequelize with Prisma for better type safety
- ✅ **Validation Standardization**: Replaced Joi with Zod for consistent validation
- ✅ **Caching Implementation**: Added Redis for improved performance
- ✅ **Database-First Approach**: Complete migration from hybrid JSON/database approach to pure database
- ✅ **Containerization**: Docker-based deployment for consistent environments
- ✅ **Unified Content Management**: Admin dashboard in Next.js for all content creation and editing

#### Benefits Achieved:
- ✅ **Improved Performance**: Fastify provides better performance than Express.js
- ✅ **Enhanced Type Safety**: Prisma and Zod provide better TypeScript integration
- ✅ **Reduced Operational Complexity**: Single backend technology stack
- ✅ **Improved Maintainability**: Consistent development patterns and practices
- ✅ **Enhanced Developer Productivity**: Unified JavaScript/TypeScript experience
- ✅ **Simplified CI/CD Pipeline**: Streamlined workflows with single project configuration
- ✅ **Better Performance**: Lower memory footprint and faster startup times
- ✅ **Easier Scaling**: Containerized deployment with PM2 process management

## Integration Flow

1. **Frontend to Backend Communication**
   - Frontend sends REST API requests to the Node.js/Fastify backend
   - Backend processes requests, queries PostgreSQL through Prisma ORM, and uses Redis cache
   - Responses are returned as JSON to the frontend

2. **Data Flow**
   - User interactions trigger REST API requests
   - Requests are routed to appropriate backend endpoints
   - Data is fetched from PostgreSQL database or Redis cache
   - Responses flow back through the API layer to the frontend

3. **Module Architecture**
   - All technology modules served by single Node.js/Fastify backend
   - Content managed through unified database schema
   - Shared services and components across all modules

4. **Development Workflow**
   - Code changes are committed to Git
   - Local development using Docker Compose
   - Production deployment using container orchestration
   - NGINX handles SSL/TLS and reverse proxy
   - Services run as containers on the server

## Benefits of This Architecture

1. **Educational Focus**
   - Single backend technology for comprehensive learning
   - Real-world technology stack examples
   - Hands-on experience with modern development practices

2. **Modular Design**
   - Each technology module is self-contained
   - Independent development and deployment
   - Easy to add new learning modules

3. **Performance & Simplicity**
   - Database-first approach for fast content delivery
   - Lightweight and efficient
   - Caching layer for improved response times

4. **Production-Ready Infrastructure**
   - NGINX gateway for professional deployment
   - Containerized services for reliability
   - SSL/TLS support for security

5. **Developer Experience**
   - Type safety with TypeScript
   - Hot reloading during development
   - Multiple IDE support (VS Code, Visual Studio)
   - Comprehensive debugging tools

## Benefits of Modernization

1. **Improved Performance**
   - Fastify provides better performance than Express.js
   - Redis caching for frequently accessed data
   - Optimized database queries with Prisma

2. **Enhanced Type Safety**
   - Prisma provides full type safety for database operations
   - Zod validation with static type inference
   - Shared schemas between frontend and backend

3. **Reduced Complexity**
   - Single backend technology stack
   - Elimination of cross-technology integration challenges
   - Simplified debugging and troubleshooting

4. **Lower Maintenance Costs**
   - Fewer technologies to maintain and update
   - Reduced dependency management overhead
   - Simplified security patching

5. **Improved Developer Productivity**
   - Consistent development patterns across the entire codebase
   - Reduced context switching between different technologies
   - Easier onboarding for new team members

6. **Better Scalability**
   - Containerized deployment for easier scaling
   - Consistent performance characteristics
   - Simplified load balancing and clustering

7. **Enhanced Reliability**
   - Fewer points of failure
   - Consistent error handling and logging
   - Simplified monitoring and observability