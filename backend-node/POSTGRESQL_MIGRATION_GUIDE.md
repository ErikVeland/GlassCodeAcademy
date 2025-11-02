# PostgreSQL Migration Guide

## Overview

This guide walks through migrating the GlassCode Academy backend from SQLite (development) to PostgreSQL (production).

**Current State**: SQLite database (`database.sqlite`)  
**Target State**: PostgreSQL 14+ database  
**Estimated Time**: 2-3 hours

---

## Prerequisites

### 1. Install PostgreSQL

#### macOS (Homebrew):
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
psql --version
# Expected: psql (PostgreSQL) 14.x
```

#### macOS (PostgreSQL.app):
1. Download from https://postgresapp.com/
2. Move to Applications
3. Open PostgreSQL.app
4. Click "Initialize" to create default database

#### Docker Alternative:
```bash
# Create docker-compose.postgres.yml
docker compose -f docker-compose.postgres.yml up -d
```

See "Docker Setup" section below for complete configuration.

---

## Step 1: Database Setup

### Create Database and User

```bash
# Connect to PostgreSQL
psql postgres

# In psql prompt:
CREATE DATABASE glasscode_dev;
CREATE USER glasscode_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE glasscode_dev TO glasscode_user;

# For PostgreSQL 15+, also grant schema privileges:
\c glasscode_dev
GRANT ALL ON SCHEMA public TO glasscode_user;

# Exit psql
\q
```

### Verify Connection

```bash
# Test connection
psql -U glasscode_user -d glasscode_dev -h localhost

# Should connect without errors
# Exit with \q
```

---

## Step 2: Update Configuration

### Update `.env` File

```bash
# Backup current .env
cp .env .env.sqlite.backup

# Update database configuration
# Change from:
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# To:
DB_DIALECT=postgres
DATABASE_URL=postgresql://glasscode_user:secure_password_here@localhost:5432/glasscode_dev

# Or use individual parameters:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_dev
DB_USER=glasscode_user
DB_PASSWORD=secure_password_here
DB_DIALECT=postgres

# Keep these settings:
DB_SYNC=false
DB_SYNC_ALTER=false
```

### Update `src/config/database.js`

The configuration should already support PostgreSQL. Verify it looks like this:

```javascript
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (Heroku, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else if (dialect === 'postgres') {
  // PostgreSQL configuration
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'glasscode_dev',
    username: process.env.DB_USER || 'glasscode_user',
    password: process.env.DB_PASSWORD || '',
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // SQLite configuration (default for development)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: env === 'development' ? console.log : false,
  });
}

module.exports = sequelize;
```

---

## Step 3: Install PostgreSQL Dependencies

```bash
# Install pg and pg-hstore packages
npm install pg pg-hstore

# Verify installation
npm list pg
npm list pg-hstore
```

---

## Step 4: Run Migrations

### Check Migration Status

```bash
# Install sequelize-cli if not already installed
npm install --save-dev sequelize-cli

# Check which migrations exist
ls migrations/
```

### Create Sequelize Config (if needed)

Create `.sequelizerc` in project root:

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src', 'config', 'database.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

### Run Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Expected output:
# Sequelize CLI [Node: 18.x.x, CLI: 6.x.x, ORM: 6.x.x]
# 
# Loaded configuration file "src/config/database.js".
# Using environment "development".
# == 20240101000000-create-users: migrating =======
# == 20240101000000-create-users: migrated (0.234s)
# == 20240102000000-create-courses: migrating =======
# == 20240102000000-create-courses: migrated (0.156s)
# ...
```

### Verify Migrations

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Connect to database and verify tables
psql -U glasscode_user -d glasscode_dev

# In psql:
\dt

# Should list all tables:
# users, courses, modules, lessons, quizzes, etc.

# Check specific table structure
\d users

# Exit
\q
```

---

## Step 5: Data Migration (Optional)

If you have existing data in SQLite that needs to be migrated:

### Export SQLite Data

```bash
# Create export directory
mkdir -p data_export

# Export users
sqlite3 database.sqlite <<EOF
.headers on
.mode csv
.output data_export/users.csv
SELECT * FROM users;
.quit
EOF

# Repeat for other tables as needed
```

### Import to PostgreSQL

```bash
# Connect to PostgreSQL
psql -U glasscode_user -d glasscode_dev

# Import users (example)
\copy users FROM 'data_export/users.csv' CSV HEADER;

# Verify import
SELECT COUNT(*) FROM users;

# Exit
\q
```

### Alternative: Use pgloader

```bash
# Install pgloader (macOS)
brew install pgloader

# Create migration script
cat > migrate.load <<EOF
LOAD DATABASE
     FROM sqlite://./database.sqlite
     INTO postgresql://glasscode_user:secure_password_here@localhost/glasscode_dev
     WITH include drop, create tables, create indexes, reset sequences
     SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# Run migration
pgloader migrate.load
```

---

## Step 6: Test the Application

### Start the Application

```bash
# Start server
npm start

# Expected output:
# Database connection has been established successfully.
# Skipping sequelize.sync in production; schema managed by migrations.
# Server is running on port 8080
```

### Run Tests

```bash
# Run all tests
npm test

# Should see all tests passing with PostgreSQL
```

### Test API Endpoints

```bash
# Test health check
curl http://localhost:8080/health

# Test registration
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

---

## Step 7: Performance Optimization

### Create Indexes

```sql
-- Connect to database
psql -U glasscode_user -d glasscode_dev

-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Verify indexes
\di

-- Exit
\q
```

### Configure Connection Pooling

Update database.js pool settings for production:

```javascript
pool: {
  max: 20,      // Increased from 5
  min: 5,       // Increased from 0
  acquire: 30000,
  idle: 10000,
}
```

---

## Step 8: Common Issues and Solutions

### Issue 1: Column Type Mismatches

**Problem**: JSON fields behave differently

**SQLite**: Stores JSON as TEXT  
**PostgreSQL**: Uses JSONB type

**Solution**: Update models to use proper JSON type:

```javascript
// In model definition
{
  metadata: {
    type: DataTypes.JSON,  // Not JSONB, Sequelize handles this
    allowNull: true,
    defaultValue: {},
  }
}
```

### Issue 2: Boolean Fields

**Problem**: SQLite uses 0/1, PostgreSQL uses TRUE/FALSE

**Solution**: Sequelize handles this automatically, but verify:

```javascript
// Use boolean type explicitly
{
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}
```

### Issue 3: Timestamp Defaults

**Problem**: Different default timestamp handling

**Solution**: Use Sequelize defaults:

```javascript
{
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}
```

### Issue 4: Auto-increment IDs

**Problem**: Sequences not reset after manual inserts

**Solution**: Reset sequences after data import:

```sql
-- Reset all sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), 
  COALESCE((SELECT MAX(id) FROM users), 1), true);
```

### Issue 5: Case Sensitivity

**Problem**: PostgreSQL is case-sensitive for table/column names

**Solution**: Sequelize should handle this, but verify model definitions use snake_case for database fields and camelCase for JavaScript properties.

---

## Docker Setup (Alternative)

### Create docker-compose.postgres.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: glasscode-postgres
    environment:
      POSTGRES_DB: glasscode_dev
      POSTGRES_USER: glasscode_user
      POSTGRES_PASSWORD: secure_password_here
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U glasscode_user -d glasscode_dev"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: glasscode-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@glasscode.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - backend

volumes:
  postgres_data:

networks:
  backend:
    driver: bridge
```

### Start PostgreSQL with Docker

```bash
# Start PostgreSQL
docker compose -f docker-compose.postgres.yml up -d

# Check status
docker compose -f docker-compose.postgres.yml ps

# View logs
docker compose -f docker-compose.postgres.yml logs -f postgres

# Access psql in container
docker compose -f docker-compose.postgres.yml exec postgres psql -U glasscode_user -d glasscode_dev
```

### Access pgAdmin (Optional)

1. Open http://localhost:5050
2. Login with admin@glasscode.com / admin
3. Add server:
   - Name: GlassCode Dev
   - Host: postgres
   - Port: 5432
   - Database: glasscode_dev
   - Username: glasscode_user
   - Password: secure_password_here

---

## Production Deployment

### Environment Variables

For production, update `.env.production`:

```bash
NODE_ENV=production
DB_DIALECT=postgres
DATABASE_URL=postgresql://user:password@production-host:5432/glasscode_prod

# Or individual parameters
DB_HOST=production-db-host.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=glasscode_prod
DB_USER=glasscode_prod_user
DB_PASSWORD=very_secure_password

# Connection pool for production
DB_POOL_MAX=50
DB_POOL_MIN=10
```

### AWS RDS Setup

See `terraform/modules/rds/` for infrastructure as code.

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan

# Apply infrastructure
terraform apply

# Get RDS endpoint
terraform output rds_endpoint
```

### Database Backups

```bash
# Create backup
pg_dump -U glasscode_user -h localhost -d glasscode_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U glasscode_user -h localhost -d glasscode_dev < backup_20240101_120000.sql
```

### Automated Backups

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -U glasscode_user -h localhost glasscode_prod | gzip > /backups/glasscode_$(date +\%Y\%m\%d).sql.gz
```

---

## Verification Checklist

- [ ] PostgreSQL 14+ installed and running
- [ ] Database and user created
- [ ] `.env` updated with PostgreSQL credentials
- [ ] `pg` and `pg-hstore` packages installed
- [ ] All migrations run successfully
- [ ] All tables created (`\dt` in psql)
- [ ] Indexes created for performance
- [ ] Application starts without errors
- [ ] All tests passing
- [ ] API endpoints responding correctly
- [ ] Data migrated (if applicable)
- [ ] Backup strategy configured
- [ ] Production environment variables set

---

## Rollback Plan

If issues occur, rollback to SQLite:

```bash
# Restore SQLite .env
cp .env.sqlite.backup .env

# Restart application
npm start

# Verify functionality
npm test
```

---

## Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create database and user
3. ✅ Update `.env` configuration
4. ✅ Install pg dependencies
5. ✅ Run migrations
6. ✅ Test application
7. ✅ Create indexes
8. ✅ Configure backups
9. ✅ Update production deployment
10. ✅ Monitor performance

---

**Status**: Ready to migrate  
**Risk Level**: Medium (well-tested migration path)  
**Estimated Downtime**: None (fresh deployment)  
**Estimated Time**: 2-3 hours total
