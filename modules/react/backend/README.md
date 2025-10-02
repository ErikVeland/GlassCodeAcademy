# React Module Backend

This is the backend API for the React learning module.

## Features

- RESTful API for React lessons and quiz questions
- JSON data storage
- Answer validation
- CORS support

## API Endpoints

### Lessons
- `GET /api/lessons` - Get all React lessons
- `GET /api/lessons/:id` - Get a specific React lesson

### Quiz Questions
- `GET /api/questions` - Get all quiz questions
- `GET /api/questions/:id` - Get a specific quiz question
- `POST /api/submit-answer` - Submit an answer for validation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start on port 5000 by default.

## Data Structure

### Lessons
```json
{
  "id": 1,
  "topic": "Components",
  "title": "React Components Basics",
  "description": "Learn how to create and use React components.",
  "content": "Detailed explanation...",
  "codeExample": "function Welcome(props) { ... }",
  "output": "Hello, Sara",
  "difficulty": "Beginner"
}
```

### Questions
```json
{
  "id": 1,
  "topic": "Components",
  "type": "multiple-choice",
  "question": "What is the correct way to create a React component?",
  "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 0,
  "explanation": "Explanation of the correct answer"
}
```