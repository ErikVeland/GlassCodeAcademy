# dotNetQuiz GraphQL API

## Overview

This document provides information about the GraphQL API for the dotNetQuiz application. The API has been standardized on GraphQL to provide a more flexible and efficient way to query and mutate data.

## Endpoints

- **GraphQL API**: `/api` or `/graphql`
- **GraphQL Explorer**: `/graphql-ui`

## Schema

The GraphQL schema defines the following main types:

- **Lesson**: Represents a learning lesson with code examples
- **InterviewQuestion**: Represents an interview question (multiple-choice or open-ended)
- **AnswerResult**: Represents the result of answering a question
- **ProgressResult**: Represents a user's progress on a lesson

## Queries

### Lessons

```graphql
# Get all .NET lessons
query {
  dotNetLessons {
    id
    topic
    title
    description
    codeExample
    output
  }
}

# Get Next.js lessons filtered by topic
query {
  nextJsLessons(topic: "Routing") {
    id
    title
    description
  }
}

# Get GraphQL lessons with sorting and pagination
query {
  graphQLLessons(sortBy: "id", sortOrder: "asc", limit: 5, offset: 0) {
    id
    title
  }
}
```

### Interview Questions

```graphql
# Get all .NET interview questions
query {
  dotNetInterviewQuestions {
    id
    topic
    type
    question
    choices
  }
}

# Get Next.js interview questions filtered by topic
query {
  nextJsInterviewQuestions(topic: "Routing") {
    id
    question
    choices
  }
}

# Get GraphQL interview questions with sorting and pagination
query {
  graphQLInterviewQuestions(sortBy: "id", sortOrder: "asc", limit: 5, offset: 0) {
    id
    question
  }
}
```

## Mutations

### Submit Answer

```graphql
# Submit an answer to an interview question
mutation {
  submitAnswer(questionId: 1, answerIndex: 2) {
    isCorrect
    explanation
  }
}
```

### Track Progress

```graphql
# Track progress for a lesson
mutation {
  trackProgress(userId: 1, lessonId: 3, module: "dotnet") {
    userId
    lessonId
    module
    status
  }
}
```

## Filtering, Sorting, and Pagination

All collection queries support the following parameters:

- **topic**: Filter by topic name
- **sortBy**: Field to sort by
- **sortOrder**: Sort direction ("asc" or "desc")
- **limit**: Maximum number of items to return
- **offset**: Number of items to skip

## Migration from REST

The application has been standardized on GraphQL, replacing the previous REST API. The GraphQL endpoint `/api` is provided for backward compatibility with the same URL pattern as the previous REST API.

Benefits of this migration:

1. **Reduced over-fetching**: Clients can request exactly the data they need
2. **Fewer round trips**: Multiple resources can be fetched in a single request
3. **Strongly typed schema**: Better documentation and tooling support
4. **Introspection**: Self-documenting API