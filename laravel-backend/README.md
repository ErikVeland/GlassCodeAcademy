# Laravel Backend for Fullstack Academy

This is the Laravel backend module for Fullstack Academy that provides RESTful API endpoints for Laravel-specific content. The Laravel backend represents a complete, standalone Laravel application structure that is integrated with the .NET backend through a sophisticated pattern.

## Features

- RESTful API for Laravel lessons and interview questions
- Database structure definition (migrations)
- Eloquent ORM model definitions
- API rate limiting
- JSON response format

## API Endpoints

These endpoints represent the intended RESTful API structure for the Laravel backend:

### Lessons
- `GET /api/laravel/lessons` - List all Laravel lessons
- `GET /api/laravel/lessons/{id}` - Get a specific Laravel lesson

### Interview Questions
- `GET /api/laravel/questions` - List all Laravel interview questions
- `GET /api/laravel/questions/{id}` - Get a specific Laravel interview question
- `POST /api/laravel/questions/{id}/answer` - Submit an answer to a question

### Progress Tracking
- `POST /api/laravel/progress` - Track user progress

## Setup Instructions

To run the Laravel backend as a standalone service:

1. Install PHP 8.2+ and Composer
2. Run `composer install` to install dependencies
3. Copy `.env.example` to `.env` and configure your database
4. Run `php artisan key:generate` to generate an application key
5. Run `php artisan migrate` to create database tables
6. Run `php artisan serve` to start the development server

## Database Schema

### Laravel Lessons
- id (integer, primary key)
- topic (string, nullable)
- title (string)
- description (text)
- code_example (text) - *Note: This field is named codeExample in the GraphQL API*
- output (text)
- timestamps (created_at, updated_at)

### Laravel Interview Questions
- id (integer, primary key)
- topic (string, nullable)
- type (string, nullable)
- question (text, nullable)
- choices (json, nullable)
- correct_answer (integer, nullable) - *Note: This field is named correctAnswer in the GraphQL API*
- explanation (text, nullable)
- timestamps (created_at, updated_at)

## Integration with .NET Backend

The Laravel backend is integrated with the .NET backend through a sophisticated pattern:

1. **Standalone Structure**: The Laravel application maintains its complete structure with models, controllers, and routes
2. **Content Synchronization**: Laravel content is exported as JSON files that mirror the database structure
3. **GraphQL Integration**: The .NET backend loads content from JSON files and exposes it through GraphQL
4. **Future Migration Path**: This structure enables a smooth migration path to a fully Laravel-powered backend

## Fullstack Academy Technology Ecosystem

While this Laravel backend focuses specifically on Laravel content, it's part of a broader technology ecosystem in Fullstack Academy that includes:

### Backend Technologies
- .NET, Next.js, and GraphQL (core modules)
- Laravel (this module)

### Frontend Technologies
- React learning modules
- Tailwind CSS learning modules
- Node.js learning modules
- SASS learning modules

All content is unified through the .NET backend's GraphQL API, which serves as the single source of truth for all technology modules in the platform.