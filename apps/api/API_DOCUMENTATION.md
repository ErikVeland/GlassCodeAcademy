# GlassCode Academy Node.js API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

### Register
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token"
  }
}
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token"
  }
}
```

## Courses

### Get All Courses
```
GET /courses
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `sort` (optional) - Sort field (default: 'order')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Web Development Fundamentals",
      "description": "Learn the fundamentals of web development",
      "slug": "web-fundamentals",
      "isPublished": true,
      "order": 1,
      "difficulty": "Beginner",
      "estimatedHours": 10
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Course by ID
```
GET /courses/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Web Development Fundamentals",
    "description": "Learn the fundamentals of web development",
    "slug": "web-fundamentals",
    "isPublished": true,
    "order": 1,
    "difficulty": "Beginner",
    "estimatedHours": 10,
    "modules": [
      {
        "id": 1,
        "title": "HTML Basics",
        "description": "Introduction to HTML",
        "slug": "html-basics",
        "order": 1,
        "isPublished": true,
        "lessons": [
          {
            "id": 1,
            "title": "HTML Structure",
            "slug": "html-structure",
            "order": 1,
            "content": {
              "type": "html",
              "content": "<p>HTML stands for HyperText Markup Language</p>"
            },
            "isPublished": true,
            "difficulty": "Beginner",
            "estimatedMinutes": 30
          }
        ]
      }
    ]
  }
}
```

## Modules

### Get Module by ID
```
GET /modules/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "HTML Basics",
    "description": "Introduction to HTML",
    "slug": "html-basics",
    "order": 1,
    "isPublished": true,
    "lessons": [
      {
        "id": 1,
        "title": "HTML Structure",
        "slug": "html-structure",
        "order": 1,
        "content": {
          "type": "html",
          "content": "<p>HTML stands for HyperText Markup Language</p>"
        },
        "isPublished": true,
        "difficulty": "Beginner",
        "estimatedMinutes": 30
      }
    ]
  }
}
```

### Get All Quizzes for a Module by Slug
```
GET /modules/{slug}/quiz
```

This endpoint retrieves all quizzes for a specific module identified by its slug. It aggregates quizzes from all lessons within the module. The endpoint supports both full slugs (e.g., "programming-fundamentals") and short slugs (e.g., "programming").

**Path Parameters:**
- `slug` - The slug of the module (e.g., "programming-fundamentals", "react-fundamentals", or short forms like "programming", "web", "graphql")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lesson_id": 1,
      "question": "What does HTML stand for?",
      "topic": "html",
      "difficulty": "Beginner",
      "choices": [
        "HyperText Markup Language",
        "HighText Machine Language",
        "HyperText and Links Markup Language",
        "None of these"
      ],
      "fixedChoiceOrder": false,
      "choiceLabels": "letters",
      "acceptedAnswers": null,
      "explanation": "HTML stands for HyperText Markup Language",
      "industryContext": "HTML is the standard markup language for documents designed to be displayed in a web browser.",
      "tags": ["basics", "web"],
      "questionType": "multiple-choice",
      "estimatedTime": 30,
      "correctAnswer": 0,
      "quizType": "multiple-choice",
      "sources": [
        {
          "title": "MDN Web Docs",
          "url": "https://developer.mozilla.org/en-US/docs/Web/HTML"
        }
      ],
      "sort_order": 1,
      "isPublished": true
    },
    {
      "id": 2,
      "lesson_id": 1,
      "question": "What is the correct HTML element for the largest heading?",
      "topic": "html",
      "difficulty": "Beginner",
      "choices": [
        "<h6>",
        "<heading>",
        "<h1>",
        "<head>"
      ],
      "fixedChoiceOrder": false,
      "choiceLabels": "letters",
      "acceptedAnswers": null,
      "explanation": "The <h1> element is used for the most important heading.",
      "industryContext": "HTML heading elements are used to define headings and subheadings in web pages.",
      "tags": ["basics", "headings"],
      "questionType": "multiple-choice",
      "estimatedTime": 20,
      "correctAnswer": 2,
      "quizType": "multiple-choice",
      "sources": [],
      "sort_order": 2,
      "isPublished": true
    }
  ]
}
```

**Supported Short Slugs:**
- `programming` → `programming-fundamentals`
- `web` → `web-fundamentals`
- `graphql` → `graphql-advanced`

**Error Responses:**
- `404 Not Found` - Module with the specified slug does not exist
- `500 Internal Server Error` - Unexpected server error

**Example Requests:**
```bash
# Using full slug
curl -X GET http://localhost:8080/api/modules/programming-fundamentals/quiz

# Using short slug
curl -X GET http://localhost:8080/api/modules/programming/quiz
```

## Lessons

### Get Lesson by ID
```
GET /lessons/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "HTML Structure",
    "slug": "html-structure",
    "order": 1,
    "content": {
      "type": "html",
      "content": "<p>HTML stands for HyperText Markup Language</p>"
    },
    "isPublished": true,
    "difficulty": "Beginner",
    "estimatedMinutes": 30
  }
}
```

### Get Lesson Quizzes
```
GET /lessons/{lessonId}/quizzes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "What does HTML stand for?",
      "topic": "html",
      "difficulty": "Beginner",
      "choices": ["A", "B", "C", "D"],
      "correctAnswer": 0
    }
  ]
}
```

## Progress

### Get User Course Progress
```
GET /progress/courses/{courseId}
```

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "completedLessons": 5,
    "totalLessons": 10,
    "progressPercentage": 50.00,
    "startedAt": "2023-01-01T00:00:00.000Z",
    "completedAt": null
  }
}
```

### Update User Lesson Progress
```
POST /progress/lessons/{lessonId}
```

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Request Body:**
```json
{
  "isCompleted": true,
  "timeSpentMinutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isCompleted": true,
    "timeSpentMinutes": 30,
    "startedAt": "2023-01-01T00:00:00.000Z",
    "completedAt": "2023-01-01T00:30:00.000Z"
  }
}
```

### Get User Lesson Progress
```
GET /progress/lessons/{lessonId}
```

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isCompleted": true,
    "timeSpentMinutes": 30,
    "startedAt": "2023-01-01T00:00:00.000Z",
    "completedAt": "2023-01-01T00:30:00.000Z"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - JWT token missing or invalid
- `ACCESS_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `INTERNAL_ERROR` - Unexpected server error
- `CONFLICT_ERROR` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests