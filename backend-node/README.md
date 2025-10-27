# GlassCode Academy Node.js Backend

This is the new Node.js backend for GlassCode Academy, replacing the previous .NET implementation.

## Features

- RESTful API for courses, modules, lessons, and quizzes
- User authentication with JWT
- Progress tracking
- PostgreSQL database integration
- Docker containerization
- Comprehensive test suite

## Tech Stack

- Node.js 18+
- Express.js
- PostgreSQL with Sequelize ORM
- JWT for authentication
- Joi for validation
- Jest for testing
- Docker for containerization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Docker (optional, for containerization)

### Installation

1. Clone the repository
2. Navigate to the backend-node directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Update the environment variables in `.env` as needed

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Docker

To run the application with Docker:

```bash
docker-compose up
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user

### Courses
- `GET /api/courses` - Get all courses (paginated)
- `GET /api/courses/:id` - Get specific course

### Modules
- `GET /api/modules/:id` - Get specific module

### Lessons
- `GET /api/lessons/:id` - Get specific lesson
- `GET /api/lessons/:lessonId/quizzes` - Get quizzes for a lesson

### Progress
- `GET /api/progress/courses/:courseId` - Get user progress for a course
- `POST /api/progress/lessons/:lessonId` - Update lesson progress
- `GET /api/progress/lessons/:lessonId` - Get lesson progress

## Environment Variables

- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

MIT

## Debugging

To diagnose production content issues (empty courses/lessons), you can run a DB summary script:

- `NODE_ENV=production node backend-node/scripts/debug-db.js`

This prints the effective database configuration and counts of published/total courses, modules, lessons, and quizzes. Use it to verify that the API and seeding processes point to the same database.