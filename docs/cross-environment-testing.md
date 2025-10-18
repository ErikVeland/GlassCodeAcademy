# Cross-Environment Testing for Database Operations

This document explains how to test database operations across different environments for the GlassCode Academy application.

## Overview

Cross-environment testing ensures that database operations work consistently across:
- Local development environment
- Staging environment
- Production environment

## Automated Tests

### Backend Integration Tests

The backend includes specific tests for cross-environment compatibility:

1. **CrossEnvironmentTests.cs** - Tests that verify application behavior across environments
2. **Database endpoint tests** - Verify that database-first APIs work correctly
3. **Fallback mechanism tests** - Ensure JSON fallback still works when database is unavailable

### Running Backend Tests

```bash
# Navigate to the backend tests directory
cd glasscode/backend

# Run all tests
dotnet test

# Run specific cross-environment tests
dotnet test --filter "FullyQualifiedName~CrossEnvironmentTests"
```

## Script-Based Testing

### Node.js Test Script

A Node.js script is available to test database operations across environments:

```bash
# Test local environment (default)
node scripts/test-database-operations.js

# Test specific environment
node scripts/test-database-operations.js local
node scripts/test-database-operations.js staging
node scripts/test-database-operations.js production

# Test all environments
node scripts/test-database-operations.js all
```

### Test Endpoints

The script tests the following endpoints:
- `/api/health` - Overall application health
- `/api/lessons-db` - Database-based lessons API
- `/api/LessonQuiz` - Database-based quiz API
- `/api/modules-db` - Database-based modules API

## Environment Configuration

### Local Development

- Database: PostgreSQL running locally
- Connection string: Configured in `appsettings.json`
- Content path: Local content directory

### Staging/Production

- Database: Remote PostgreSQL instance
- Connection string: Environment variables
- Content path: Configured via environment variables

## Database Migration Testing

### Automated Migration Service

The `AutomatedMigrationService` can be tested across environments:

1. **Local testing**: Run migration against local database
2. **Staging testing**: Run migration against staging database
3. **Production testing**: Validate migration status (read-only)

### Migration Controller

The `/api/migration` endpoints allow for migration testing:

- `POST /api/migration/full-migration` - Perform full migration
- `GET /api/migration/status` - Check migration status

## Validation Process

### Content Parity Validation

The content validation service ensures consistency between:
- Database content
- JSON file content

### Health Checks

Regular health checks verify:
- Database connectivity
- Content availability
- API responsiveness

## Troubleshooting

### Common Issues

1. **Connection timeouts**: Check database connectivity in each environment
2. **Authentication failures**: Verify database credentials
3. **Content not found**: Ensure content paths are correctly configured

### Environment-Specific Debugging

1. **Local**: Check PostgreSQL service status and connection string
2. **Staging**: Verify environment variables and network connectivity
3. **Production**: Check logs and monitoring alerts

## Best Practices

1. **Test early and often** across all environments
2. **Use the same database schema** in all environments
3. **Maintain consistent configuration** through environment variables
4. **Monitor database performance** in each environment
5. **Validate content parity** regularly