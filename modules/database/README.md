# Databases & Data Modelling Module

This module covers database design and implementation, including relational databases and data modeling techniques.

## Structure

```
database/
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

1. **Database Fundamentals**
   - Relational Model
   - Keys and Constraints
   - Normalization
   - ACID Properties

2. **SQL**
   - DDL Statements
   - DML Statements
   - Joins and Subqueries
   - Aggregation and Grouping

3. **Data Modeling**
   - ER Diagrams
   - Entity Relationships
   - Design Patterns
   - Performance Considerations

4. **ORM Integration**
   - Entity Framework Core
   - Eloquent ORM
   - Query Building
   - Migration Strategies

## Color Scheme

- Primary: Purple (#9C27B0)
- Secondary: Light Purple (#CE93D8)
- Accent: Purple (#7B1FA2)

## API Endpoints

- `/api/database/lessons` - Get all Database lessons
- `/api/database/questions` - Get all Database interview questions
- `/api/database/answer` - Submit answers for validation

## GraphQL Schema

```graphql
type DatabaseLesson {
  id: Int!
  topic: String!
  title: String!
  description: String!
  codeExample: String!
  output: String!
}

type DatabaseInterviewQuestion {
  id: Int!
  topic: String!
  type: String!
  question: String!
  choices: [String!]
  correctAnswer: Int
  explanation: String!
}

type Query {
  databaseLessons(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [DatabaseLesson!]!
  databaseInterviewQuestions(topic: String, sortBy: String, sortOrder: String, limit: Int, offset: Int): [DatabaseInterviewQuestion!]!
}

type Mutation {
  submitDatabaseAnswer(questionId: Int!, answerIndex: Int!): AnswerResult!
}
```