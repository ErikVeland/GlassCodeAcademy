# Node.js Module Backend

This is the backend API for the Node.js learning module.

## Features

- RESTful API for Node.js lessons and quiz questions
- EJS templating for server-side rendering
- JSON data storage
- Answer validation
- CORS support

## API Endpoints

### Web Routes
- `GET /` - Home page
- `GET /lessons` - List all lessons
- `GET /lessons/:id` - Show a specific lesson
- `GET /quiz` - Quiz page

### API Routes
- `GET /api/lessons` - Get all Node.js lessons
- `GET /api/lessons/:id` - Get a specific Node.js lesson
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

The server will start on port 3000 by default.

## Data Structure

### Lessons
```json
{
  "id": 1,
  "topic": "Basics",
  "title": "Node.js Fundamentals",
  "description": "Learn the basics of Node.js and its runtime environment.",
  "content": "Detailed explanation...",
  "codeExample": "const http = require('http'); ...",
  "output": "Server running at http://127.0.0.1:3000/",
  "difficulty": "Beginner"
}
```

### Questions
```json
{
  "id": 1,
  "topic": "Basics",
  "type": "multiple-choice",
  "question": "What is Node.js?",
  "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 1,
  "explanation": "Explanation of the correct answer"
}
```