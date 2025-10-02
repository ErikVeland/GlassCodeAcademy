# Vue.js Module

This module covers Vue.js, a progressive JavaScript framework for building user interfaces.

## Structure

```
vue/
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

1. **Core Concepts**
   - Vue Instance and Lifecycle
   - Template Syntax
   - Computed Properties and Watchers
   - Conditional Rendering
   - List Rendering

2. **Components**
   - Component Basics
   - Props and Events
   - Slots
   - Dynamic Components

3. **Composition API**
   - Reactive References
   - Computed Properties
   - Watchers
   - Lifecycle Hooks

4. **Tooling**
   - Vue CLI
   - Single File Components
   - DevTools

## Color Scheme

- Primary: Green (#4CAF50)
- Secondary: Light Green (#8BC34A)
- Accent: Green (#43A047)

## API Endpoints

- `/api/vue/lessons` - Get all Vue lessons
- `/api/vue/questions` - Get all Vue interview questions
- `/api/vue/answer` - Submit answers for validation

## GraphQL Schema

```graphql
type VueLesson {
  id: Int!
  topic: String!
  title: String!
  description: String!
  codeExample: String!
  output: String!
}

type VueInterviewQuestion {
  id: Int!
  topic: String!
  type: String!
  question: String!
  choices: [String!]
  correctAnswer: Int
  explanation: String!
}

type Query {
  vueLessons(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [VueLesson!]!
  vueInterviewQuestions(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [VueInterviewQuestion!]!
}

type Mutation {
  submitVueAnswer(questionId: Int!, answerIndex: Int!): AnswerResult!
}
```