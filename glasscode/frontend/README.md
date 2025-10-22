# GlassCode Academy Frontend

This is the frontend application for the GlassCode Academy project, built with Next.js 15, React 19, and TypeScript.

## Standalone Server Deployment (Recommended)

For production deployments, we recommend using our standalone server setup which runs both the frontend and backend on the same server.

### Prerequisites
- Ubuntu 24.04 LTS server
- Domain name pointing to your server (glasscode.academy)
- SSH access to the server

### Automated Deployment Script

Use the provided bootstrap script to automatically set up your GlassCode Academy server. See the main DEPLOYMENT.md file for details.

## Cloud Deployment Options

### Render.com (Recommended)

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render for the frontend component:
   - Use the Node.js runtime
   - Set the root directory to `glasscode/frontend`
   - Configure environment variables as needed

### Local Development

1. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:8080
   ```

2. Install and validate:
   ```bash
   npm install
   npm run typecheck
   npm run lint
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The application runs at `http://localhost:3000`.

## Features

- Responsive design with Tailwind CSS
- GraphQL integration with Apollo Client
- Step-by-step lessons with code examples
- Interactive interview quizzes
- Progress tracking
- Dedicated sections for all learning modules
- Wider layout to accommodate multiple modules better
- Technology-specific styling for each module

## Technology Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Apollo Client for GraphQL

## Directory Structure

```
src/
├── app/
│   ├── graphql/
│   ├── interview/
│   ├── lessons/
│   ├── nextjs/
│   ├── laravel/
│   │   ├── lessons/
│   │   └── interview/
│   ├── react/
│   │   ├── lessons/
│   │   └── interview/
│   ├── tailwind/
│   │   ├── lessons/
│   │   └── interview/
│   ├── node/
│   │   ├── lessons/
│   │   └── interview/
│   ├── sass/
│   │   ├── lessons/
│   │   └── interview/
│   └── page.tsx
├── components/
└── apolloClient.ts
```

## Frontend Technologies Implementation

### .NET, Next.js, and GraphQL Modules
- Core modules with structured lessons and interview questions

### Laravel Modules
Located in `src/app/laravel/`
- Lessons in `src/app/laravel/lessons/page.tsx`
- Interview quizzes in `src/app/laravel/interview/page.tsx`
- Interactive lesson viewer with code examples and expected outputs
- Multiple-choice and open-ended question formats
- Red-themed interface for Laravel content

### React Modules
Located in `src/app/react/`
- Lessons in `src/app/react/lessons/page.tsx`
- Interview quizzes in `src/app/react/interview/page.tsx`
- Interactive lesson viewer with code examples and expected outputs
- Multiple-choice and open-ended question formats
- Blue-themed interface for React content

### Tailwind CSS Modules
Utility-first CSS framework for rapid UI development

### Node.js Modules
Located in `src/app/node/`
- Lessons in `src/app/node/lessons/page.tsx`
- Interview quizzes in `src/app/node/interview/page.tsx`
- Interactive lesson viewer with code examples and expected outputs
- Multiple-choice and open-ended question formats
- Green-themed interface for Node.js content

### SASS Modules
CSS preprocessor with variables, nesting, and mixins

## Setup Instructions

1. Install Node.js 18+
2. Navigate to the frontend directory
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

The frontend will start on `http://localhost:3000`

## GraphQL Integration

Apollo Client is configured, but GraphQL is optional in this project. The frontend proxies `/graphql` to the backend only if a GraphQL service is available. When GraphQL is unreachable, feature code falls back to the content registry for stats and summaries.

### Configuration
- Apollo Client setup in `src/apolloClient.ts`
- Endpoint derived by `getGraphQLEndpoint()` and proxied via `next.config.ts`
- `NEXT_PUBLIC_API_BASE` controls the proxy destination during development

### Queries (if backend provides GraphQL)
- Examples: `programmingLessons`, `programmingInterviewQuestions`, `programmingLesson(id)`
- Other legacy query names may exist in code history; the stats hook falls back gracefully

### Mutations
- Mutation usage is currently minimal; most write operations go through REST APIs

## Styling

The application uses Tailwind CSS for styling with technology-specific color schemes:
- Blue: React content
- Teal: Tailwind CSS content
- Green: Node.js content
- Pink: SASS content
- Purple: Next.js content
- Pink: GraphQL content
- Red: Laravel content

## Development

### Adding New Pages

To add new pages:
1. Create a new directory in `src/app/`
2. Add a `page.tsx` file with the page content
3. Use Apollo Client hooks for data fetching

### Modifying Styles

To modify styles:
1. Use Tailwind CSS classes in component files
2. For custom styles, modify `src/app/globals.css`

## Testing

### Static checks
- `npm run typecheck` to verify TypeScript types across app and tests
- `npm run lint` to enforce code quality

### Local verification
1. Start the backend (`cd ../../backend-node && npm run dev`)
2. Start the frontend (`npm run dev`)
3. Open `http://localhost:3000` and validate module pages

### Manual module verification
- React: `/react/lessons` and `/react/interview`
- Tailwind: `/tailwind/lessons` and `/tailwind/interview`
- Node: `/node/lessons` and `/node/interview`
- SASS: `/sass/lessons` and `/sass/interview`

Note: Jest types are installed for tests, but the frontend does not define a `npm test` script; use typecheck/lint and pages for verification.

## Admin Dashboard

The admin UI uses typed models in `src/types/admin.ts` and proxy routes to the backend.

### Shared Types

```ts
export interface AdminModule { id: number; title: string; slug: string; description?: string; order: number; isPublished: boolean; courseId?: number; }

export type LessonDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface AdminLesson { id: number; title: string; slug: string; order: number; difficulty: LessonDifficulty; estimatedMinutes?: number; isPublished: boolean; moduleId: number; content?: string; metadata?: string; }

export type QuestionType = 'multiple-choice' | 'open-ended' | 'true-false' | 'coding';

export interface AdminQuiz { id: number; question: string; topic?: string; difficulty: LessonDifficulty; choices?: string[] | string; explanation?: string; industryContext?: string; tags?: string[] | string; questionType: QuestionType; estimatedTime?: number; correctAnswer?: number | string | null; quizType?: string; sources?: string[] | string; sortOrder?: number; isPublished: boolean; lessonId: number; }

export interface AdminCourse { id: number; title: string; }
```

### API Routes

- `GET /api/modules-db` → `AdminModule[]`
- `GET /api/modules-db/[id]` → `AdminModule`
- `PUT /api/modules-db/[id]` → updates module

- `GET /api/lessons-db` → `AdminLesson[]`
- `GET /api/lessons-db/[id]` → `AdminLesson`
- `PUT /api/lessons-db/[id]` → updates lesson; `content` and `metadata` are JSON strings

- `GET /api/LessonQuiz` → `AdminQuiz[]`
- `GET /api/LessonQuiz/[id]` → `AdminQuiz`
- `PUT /api/LessonQuiz/[id]` → updates quiz; `choices`, `tags`, `sources` accept string or JSON array; `correctAnswer` may be `number | null`

### Pages

- `/admin` dashboard overview
- `/admin/lessons/[id]/edit` lesson editor
- `/admin/modules/[id]/edit` module editor
- `/admin/quizzes/[id]/edit` quiz editor

### Hooks and Effects

- Data fetchers memoized with `useCallback`; effects depend on stable callbacks (`[fetchData]`).
- Input handlers guard state presence and normalize union types for JSON fields.

## Environment & Endpoints

- Set `NEXT_PUBLIC_API_BASE` to the public origin of your backend, e.g. `https://api.yourdomain.com` or `https://yourdomain.com` when the backend shares the same host.
- GraphQL requests resolve using `getGraphQLEndpoint()`:
  - Browser: `/graphql` (rewritten by Next to the backend via `next.config.ts`).
  - Server-side: `${NEXT_PUBLIC_API_BASE}/graphql` strictly derived from environment.
- In development, `next.config.ts` rewrites `/graphql` to `http://127.0.0.1:8080/graphql`.

## Stats Fallback Behavior

- The stats hook attempts GraphQL first (lessons and interview questions across modules).
- If GraphQL is unreachable or returns empty data, it falls back to the content registry via `ContentRegistryLoader`.
- The fallback computes totals, difficulty/topic distributions, and module breakdowns from static JSON content (`/content/lessons/*.json`, `/content/quizzes/*.json`).
- This ensures the dashboard retains meaningful metrics even when the backend is down.