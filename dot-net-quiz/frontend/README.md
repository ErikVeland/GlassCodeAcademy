# Fullstack Academy Frontend

This is the frontend application for the Fullstack Academy project, built with Next.js 15, React 19, and TypeScript.

## Docker Deployment (Recommended)

This application is designed for Docker deployment using either docker-compose or individual container deployment.

### Using Docker Compose (Local Development)
```bash
docker-compose up --build
```

This will start both the frontend (on port 3000) and backend (on port 8080) services.

### Individual Container Deployment
Build and run each service separately:

**Frontend:**
```bash
cd dot-net-quiz/frontend
docker build -t fullstack-frontend .
docker run -p 3000:3000 fullstack-frontend
```

## Cloud Deployment Options

### Render.com (Recommended)

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render for the frontend component:
   - Use the Docker runtime
   - Set the root directory to `dot-net-quiz/frontend`
   - Configure environment variables as needed

### Local Development

1. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:5022
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:3000.

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

The frontend uses Apollo Client to communicate with the backend GraphQL API.

### Configuration
- Apollo Client configuration in `src/apolloClient.ts`
- GraphQL queries and mutations in page components

### Queries Used
- `dotNetLessons`, `nextJsLessons`, `graphQLLessons`, `laravelLessons`
- `reactLessons`, `tailwindLessons`, `nodeLessons`, `sassLessons`
- `dotNetInterviewQuestions`, `nextJsInterviewQuestions`, `graphQLInterviewQuestions`, `laravelInterviewQuestions`
- `reactInterviewQuestions`, `tailwindInterviewQuestions`, `nodeInterviewQuestions`, `sassInterviewQuestions`

### Mutations Used
- `submitAnswer` - Submit answers for questions
- `submitLaravelAnswer` - Submit answers for Laravel questions
- `submitReactAnswer` - Submit answers for React questions
- `submitTailwindAnswer` - Submit answers for Tailwind questions
- `submitNodeAnswer` - Submit answers for Node.js questions
- `submitSassAnswer` - Submit answers for SASS questions
- `trackProgress` - Track user progress

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

To test the application:
1. Start the backend server
2. Start the frontend development server
3. Navigate to `http://localhost:3000`
4. Test all modules including the new technology sections

### Testing Technology Modules

1. Navigate to `/react/lessons` and `/react/interview` to view React content
2. Navigate to `/tailwind/lessons` and `/tailwind/interview` to view Tailwind CSS content
3. Navigate to `/node/lessons` and `/node/interview` to view Node.js content
4. Navigate to `/sass/lessons` and `/sass/interview` to view SASS content
5. Verify that content loads correctly
6. Test quiz functionality with answer submission