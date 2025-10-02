# TypeScript Module

This module covers TypeScript, a typed superset of JavaScript that compiles to plain JavaScript.

## Structure

```
typescript/
├── README.md
├── backend/
│   ├── data/
│   │   ├── lessons.json
│   │   └── questions.json
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       └── pages/
└── Dockerfile
```

## Topics Covered

1. **Basic Types**
   - Primitive Types
   - Arrays and Tuples
   - Enums
   - Any, Void, Null, Undefined

2. **Interfaces and Classes**
   - Interface Declaration
   - Class Implementation
   - Inheritance
   - Access Modifiers

3. **Functions**
   - Function Types
   - Optional and Default Parameters
   - Rest Parameters
   - Overloads

4. **Generics**
   - Generic Types
   - Generic Constraints
   - Utility Types

## Color Scheme

- Primary: Blue (#2196F3)
- Secondary: Light Blue (#4FC3F7)
- Accent: Blue (#1E88E5)

## API Endpoints

- `/api/typescript/lessons` - Get all TypeScript lessons
- `/api/typescript/questions` - Get all TypeScript interview questions
- `/api/typescript/answer` - Submit answers for validation

## GraphQL Schema

```graphql
type TypescriptLesson {
  id: Int!
  topic: String!
  title: String!
  description: String!
  codeExample: String!
  output: String!
}

type TypescriptInterviewQuestion {
  id: Int!
  topic: String!
  type: String!
  question: String!
  choices: [String!]
  correctAnswer: Int
  explanation: String!
}

type Query {
  typescriptLessons(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [TypescriptLesson!]!
  typescriptInterviewQuestions(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [TypescriptInterviewQuestion!]!
}

type Mutation {
  submitTypescriptAnswer(questionId: Int!, answerIndex: Int!): AnswerResult!
}
```