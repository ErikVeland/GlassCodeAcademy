# Laravel Module Backend

This is the backend API for the Laravel learning module.

## Features

- RESTful API for Laravel lessons and quiz questions
- Database storage with SQLite
- Eloquent ORM models
- API endpoints for frontend integration

## API Endpoints

### Lessons
- `GET /api/lessons` - Get all Laravel lessons
- `GET /api/lessons/{id}` - Get a specific Laravel lesson

### Quiz Questions
- `GET /api/questions` - Get all quiz questions
- `GET /api/questions/{id}` - Get a specific quiz question
- `POST /api/submit-answer` - Submit an answer for validation

## Setup

1. Install PHP 8.1+ and Composer
2. Install dependencies:
   ```bash
   composer install
   ```

3. Copy and configure the environment file:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Run migrations and seed the database:
   ```bash
   php artisan migrate --seed
   ```

5. Start the development server:
   ```bash
   php artisan serve
   ```

The server will start on port 8000 by default.

## Data Structure

### Lessons
```json
{
  "id": 1,
  "topic": "Routing",
  "title": "Basic Routing in Laravel",
  "description": "Learn how to define routes in Laravel applications.",
  "content": "Detailed explanation...",
  "code_example": "Route::get('/welcome', function () { ... });",
  "output": "Welcome to Laravel!",
  "difficulty": "Beginner"
}
```

### Questions
```json
{
  "id": 1,
  "topic": "Routing",
  "type": "multiple-choice",
  "question": "What is the correct way to define a route in Laravel?",
  "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct_answer": 1,
  "explanation": "Explanation of the correct answer"
}
```