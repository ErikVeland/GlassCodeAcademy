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