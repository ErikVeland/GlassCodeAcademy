# Migration Guide: GraphQL to Node.js REST API

This guide provides instructions for migrating from the existing GraphQL API to the new Node.js REST API.

## Overview

The new Node.js backend provides RESTful endpoints that replace the existing GraphQL API. This guide will help you understand the mapping between GraphQL queries/mutations and REST endpoints.

## Authentication

### GraphQL (Old)
```graphql
mutation {
  register(input: { email: "user@example.com", password: "password123", firstName: "John", lastName: "Doe" }) {
    user {
      id
      email
      firstName
      lastName
    }
    token
  }
}

mutation {
  login(input: { email: "user@example.com", password: "password123" }) {
    user {
      id
      email
      firstName
      lastName
    }
    token
  }
}
```

### REST (New)
```javascript
// Register
const response = await nodeJsApiClient.register({
  email: "user@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe"
});

// Login
const response = await nodeJsApiClient.login({
  email: "user@example.com",
  password: "password123"
});
```

## Profile Management

### GraphQL (Old)
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    username
    roles {
      id
      name
    }
  }
}

mutation {
  updateProfile(input: { firstName: "Jane", lastName: "Smith" }) {
    id
    firstName
    lastName
  }
}
```

### REST (New)
```javascript
// Get profile
const response = await nodeJsApiClient.getProfile();

// Update profile
const response = await nodeJsApiClient.updateProfile({
  firstName: "Jane",
  lastName: "Smith"
});
```

## Course Data

### GraphQL (Old)
```graphql
query {
  courses {
    id
    title
    description
    slug
    isPublished
    order
    difficulty
    estimatedHours
  }
}

query {
  course(id: 1) {
    id
    title
    description
    modules {
      id
      title
      lessons {
        id
        title
      }
    }
  }
}
```

### REST (New)
```javascript
// Get courses with pagination
const response = await nodeJsApiClient.getCourses(1, 10);

// Get course by ID
const response = await nodeJsApiClient.getCourseById(1);

// Get modules by course ID
const response = await nodeJsApiClient.getModulesByCourseId(1);

// Get lessons by module ID
const response = await nodeJsApiClient.getLessonsByModuleId(1);
```

## Quiz Data

### GraphQL (Old)
```graphql
query {
  moduleQuiz(moduleSlug: "programming") {
    questions {
      id
      question
      choices
      correctAnswer
      explanation
      topic
      difficulty
    }
  }
}
```

### REST (New)
```javascript
// Get quizzes by lesson ID
const response = await nodeJsApiClient.getQuizzesByLessonId(1);

// Submit quiz answers
const response = await nodeJsApiClient.submitQuizAnswers(1, {
  answers: [
    {
      quizId: 1,
      selectedAnswer: 0
    }
  ]
});
```

## Progress Tracking

### GraphQL (Old)
```graphql
query {
  userProgress(courseId: 1) {
    completedLessons
    totalLessons
    progressPercentage
  }
}

mutation {
  updateUserLessonProgress(input: { lessonId: 1, isCompleted: true }) {
    id
    isCompleted
  }
}
```

### REST (New)
```javascript
// Get course progress
const response = await nodeJsApiClient.getCourseProgress(1);

// Get lesson progress
const response = await nodeJsApiClient.getLessonProgress(1);

// Update lesson progress
const response = await nodeJsApiClient.updateLessonProgress(1, {
  isCompleted: true
});

// Get progress summary
const response = await nodeJsApiClient.getProgressSummary();
```

## API Client Usage

### Installation
The new API client is already included in the frontend codebase at `src/lib/api/nodeJsApiClient.ts`.

### Usage in Components
```javascript
import { useAuth, useCourses, useCourse } from '@/lib/api/hooks';

// In your component
const { isAuthenticated, login, logout } = useAuth();
const { courses, loading, error } = useCourses(1, 10);
const { course } = useCourse(1);
```

## Environment Configuration

### GraphQL (Old)
```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/graphql
```

### REST (New)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

## Error Handling

### GraphQL (Old)
```javascript
try {
  const result = await client.mutate({
    mutation: LOGIN_MUTATION,
    variables: { input: { email, password } }
  });
  
  if (result.errors) {
    // Handle GraphQL errors
  }
} catch (error) {
  // Handle network errors
}
```

### REST (New)
```javascript
const response = await nodeJsApiClient.login({ email, password });

if (!response.success) {
  // Handle API errors
  console.error(response.error?.message);
}
```

## Testing

### GraphQL (Old)
```javascript
// Mocking GraphQL responses
const mockGraphQLResponse = {
  data: {
    login: {
      user: { id: 1, email: 'test@example.com' },
      token: 'mock-token'
    }
  }
};
```

### REST (New)
```javascript
// Mocking REST responses
const mockRestResponse = {
  success: true,
  data: {
    user: { id: 1, email: 'test@example.com' },
    token: 'mock-token'
  }
};
```

## Migration Steps

1. **Update Environment Variables**
   - Replace `NEXT_PUBLIC_GRAPHQL_ENDPOINT` with `NEXT_PUBLIC_API_BASE`
   - Set `NEXT_PUBLIC_API_BASE` to your Node.js backend URL (e.g., `http://localhost:8080`)

2. **Replace GraphQL Client**
   - Remove Apollo Client dependencies
   - Remove GraphQL query/mutation files
   - Import and use the new Node.js API client

3. **Update Components**
   - Replace GraphQL hooks with REST hooks
   - Update data fetching logic
   - Update error handling

4. **Update Authentication**
   - Replace GraphQL authentication with REST authentication
   - Update token storage and management

5. **Update Progress Tracking**
   - Replace GraphQL progress queries with REST endpoints
   - Update progress submission logic

6. **Update Quiz Functionality**
   - Replace GraphQL quiz queries with REST endpoints
   - Update quiz submission logic

7. **Testing**
   - Update test mocks to use REST responses
   - Update test assertions
   - Run all tests to ensure functionality

## Benefits of Migration

1. **Simplified API**: REST APIs are generally simpler to understand and use than GraphQL
2. **Better Performance**: REST endpoints can be optimized for specific use cases
3. **Easier Debugging**: REST APIs are easier to debug with standard tools
4. **Reduced Bundle Size**: No need for GraphQL client libraries
5. **Better Caching**: REST endpoints can leverage HTTP caching more effectively
6. **Standard Tooling**: REST APIs work with standard HTTP tools and proxies

## Support

For any issues during migration, please refer to:
- `src/lib/api/nodeJsApiClient.ts` for API client implementation
- `src/lib/api/hooks.ts` for React hooks
- `src/lib/api/__tests__/` for test examples
- This migration guide for mapping reference