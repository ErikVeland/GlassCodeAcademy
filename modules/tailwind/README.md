# Tailwind CSS Module

This is the Tailwind CSS learning module, built with pure HTML and Tailwind CSS via CDN.

## Features

- Responsive design using Tailwind CSS utility classes
- Interactive lessons with code examples
- Quiz system with multiple-choice questions
- Implementation of the Fullstack Academy Design System
- Mobile-friendly interface
- No build step required (uses CDN)

## Pages

1. **Home Page** (`index.html`) - Overview of the module
2. **Lessons Page** (`lessons.html`) - List of all lessons
3. **Lesson Detail Page** (`lesson-detail.html`) - Detailed lesson content
4. **Quiz Page** (`quiz.html`) - Interactive quiz

## Design System Implementation

This module implements the Fullstack Academy Design System with:
- Consistent color palette (indigo as primary color for Tailwind CSS)
- Responsive grid layout
- Accessible components
- Mobile-first approach
- Custom Tailwind configuration

## Setup

Simply open `index.html` in a web browser to view the module.

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

The module uses static HTML with mock data. In a real implementation, it would connect to a backend API.

### Lessons
```json
{
  "id": 1,
  "topic": "Basics",
  "title": "Utility-First Fundamentals",
  "description": "Learn the core concepts of utility-first CSS with Tailwind.",
  "content": "Detailed explanation...",
  "codeExample": "<div class=\"p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4\">...",
  "difficulty": "Beginner"
}
```

### Questions
```json
{
  "id": 1,
  "topic": "Basics",
  "type": "multiple-choice",
  "question": "What is the primary benefit of utility-first CSS?",
  "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 0,
  "explanation": "Explanation of the correct answer"
}
```

## Customization

The module uses Tailwind CSS via CDN with a custom configuration that:
- Sets up the Fullstack Academy color palette
- Configures the Inter font as the primary font
- Extends the theme with custom colors

To customize further, you can modify the `tailwind.config` script in each HTML file.
