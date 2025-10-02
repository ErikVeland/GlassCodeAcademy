# Node.js Module Frontend

This is the frontend for the Node.js learning module, built with plain HTML, CSS, and JavaScript.

## Features

- Responsive design using CSS Grid and Flexbox
- Interactive lessons with code examples
- Quiz system with multiple-choice questions
- Implementation of the Fullstack Academy Design System
- Mobile-friendly interface

## Pages

1. **Home Page** (`index.html`) - Overview of the module
2. **Lessons Page** (`lessons.html`) - List of all lessons
3. **Lesson Detail Page** (`lesson-detail.html`) - Detailed lesson content
4. **Quiz Page** (`quiz.html`) - Interactive quiz

## Design System Implementation

This frontend implements the Fullstack Academy Design System with:
- Consistent color palette (green as primary color for Node.js)
- Responsive grid layout
- Accessible components
- Mobile-first approach

## Setup

Simply open `index.html` in a web browser to view the frontend.

For development, you can use any local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

## Data Structure

The frontend uses static HTML with mock data. In a real implementation, it would connect to the backend API.

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