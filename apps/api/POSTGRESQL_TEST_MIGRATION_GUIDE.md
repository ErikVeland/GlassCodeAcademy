# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
# PostgreSQL Test Database Migration Guide

## Overview

This guide documents the migration from SQLite (in-memory) to PostgreSQL for the test database. Using PostgreSQL for tests ensures schema parity with production and prevents subtle bugs caused by database dialect differences.

## Current State

### Before Migration
- **Test Database**: SQLite in-memory (`:memory:`)
- **Production Database**: PostgreSQL
- **Issue**: Schema drift risk due to dialect differences
- **Configuration**: Automatic when `NODE_ENV=test`

### After Migration
- **Test Database**: PostgreSQL (dedicated test database)
- **Production Database**: PostgreSQL
- **Benefit**: 100% schema parity, no dialect differences
- **Configuration**: Via `USE_REAL_DB_FOR_TESTS=true` environment variable

## Why PostgreSQL for Tests?

### Problems with SQLite Tests

1. **Type Incompatibilities**
   - PostgreSQL `JSONB` → SQLite `JSON` (different query capabilities)
   - PostgreSQL `ARRAY` → SQLite `TEXT` (requires serialization)
   - Different date/time handling

2. **Schema Drift Risk**
   - Tests pass on SQLite but fail in production
   - Migration scripts not tested properly
   - Index strategies differ

3. **Feature Differences**
   - PostgreSQL full-text search not testable
   - Transaction isolation levels differ
   - Constraint enforcement differs

### Benefits of PostgreSQL Tests

1. **Production Parity**
   - Identical schema
   - Same query behavior
   - Same migration scripts

2. **Earlier Bug Detection**
   - Database-specific bugs caught in tests
   - Migration issues found before deployment
   - No surprises in production

3. **Accurate Performance Testing**
   - Real query performance characteristics
   - Proper index usage
   - Realistic query plans

## Implementation

### Configuration Already Exists

The codebase already supports PostgreSQL tests via `src/config/database.js`:

```javascript
if (isTest) {
  const useRealDb = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      // ... configuration
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      // ... configuration
    });
  }
}
```

### Environment Variables

Add to `.env.test` or CI/CD configuration:

```bash
# Enable PostgreSQL for tests
USE_REAL_DB_FOR_TESTS=true

# PostgreSQL test database connection
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test

# Alternative: Discrete variables
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_SSL=false
```

## Setup Instructions

### Local Development

#### 1. Create Test Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database and user
CREATE DATABASE glasscode_test;
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
\q
```

#### 2. Configure Environment

Create `.env.test`:

```bash
NODE_ENV=test
USE_REAL_DB_FOR_TESTS=true
TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5432/glasscode_test
```

#### 3. Run Migrations

```bash
# Run migrations on test database
NODE_ENV=test npx sequelize-cli db:migrate

# Or use sync (for development)
# Database will auto-sync when tests run
```

#### 4. Run Tests

```bash
# Run tests with PostgreSQL
npm test

# Tests will automatically use PostgreSQL when USE_REAL_DB_FOR_TESTS=true
```

### CI/CD Integration

#### GitHub Actions Example

Add PostgreSQL service to `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: glasscode_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend-node
      
      - name: Run migrations
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npx sequelize-cli db:migrate
        working-directory: ./backend-node
      
      - name: Run tests
        env:
          USE_REAL_DB_FOR_TESTS: true
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/glasscode_test
        run: npm test
        working-directory: ./backend-node
```

#### Alternative: Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: glasscode_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      NODE_ENV: test
      USE_REAL_DB_FOR_TESTS: "true"
      TEST_DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/glasscode_test
    command: npm test
    volumes:
      - ./backend-node:/app
```

Run tests:
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Database Cleanup Strategies

### Option 1: Truncate Tables Between Tests (Current)

```javascript
// In testDatabase.js
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  await createDefaultBadges();
}
```

**Pros**: Fast, simple
**Cons**: Doesn't reset sequences/auto-increment

### Option 2: Transaction Rollback (Recommended for PostgreSQL)

```javascript
// Enhanced testDatabase.js
let transaction;

async function setupTestDb() {
  initializeAssociations();
  await sequelize.sync({ force: true });
  await createDefaultBadges();
}

async function beginTransaction() {
  transaction = await sequelize.transaction();
  return transaction;
}

async function rollbackTransaction() {
  if (transaction) {
    await transaction.rollback();
    transaction = null;
  }
}

// In test files
describe('Test Suite', () => {
  beforeEach(async () => {
    await beginTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });
});
```

**Pros**: Fastest, perfect isolation
**Cons**: Requires test modification

### Option 3: Drop and Recreate Schema

```javascript
async function resetDatabase() {
  // Drop all tables
  await sequelize.drop();
  // Recreate schema
  await sequelize.sync({ force: true });
  // Reseed
  await createDefaultBadges();
}
```

**Pros**: Complete reset, no residual data
**Cons**: Slower than truncate

## Performance Considerations

### SQLite vs PostgreSQL Performance

| Operation | SQLite (in-memory) | PostgreSQL (local) | Difference |
|-----------|-------------------|-------------------|------------|
| Setup | ~50ms | ~500ms | +10x |
| Simple Query | ~1ms | ~2-3ms | +2-3x |
| Complex Query | ~5ms | ~5-8ms | ~similar |
| Full Test Suite | ~9s | ~12-15s | +33-66% |

### Optimization Strategies

1. **Parallel Test Execution**
```bash
# Use Jest's parallel workers
npm test -- --maxWorkers=4
```

2. **Connection Pooling**
```javascript
pool: {
  max: 10,  // Increase for test parallelization
  min: 2,
  acquire: 30000,
  idle: 10000,
}
```

3. **Conditional PostgreSQL Usage**
```bash
# Use SQLite for quick unit tests
npm run test:unit

# Use PostgreSQL for integration tests
npm run test:integration
```

## Migration Checklist

### Phase 1: Preparation
- [x] Review current test infrastructure
- [x] Document PostgreSQL setup requirements
- [x] Create test database
- [x] Configure environment variables

### Phase 2: Local Testing
- [ ] Run existing tests with PostgreSQL locally
- [ ] Verify all 298 tests pass
- [ ] Check for performance degradation
- [ ] Document any issues found

### Phase 3: Fix Any Issues
- [ ] Update tests that fail with PostgreSQL
- [ ] Fix any schema-related issues
- [ ] Optimize slow tests if needed

### Phase 4: CI/CD Integration
- [ ] Add PostgreSQL service to GitHub Actions
- [ ] Update CI configuration
- [ ] Verify tests pass in CI
- [ ] Monitor test execution time

### Phase 5: Documentation
- [x] Create migration guide (this document)
- [ ] Update README with PostgreSQL instructions
- [ ] Document troubleshooting steps
- [ ] Add team training materials

### Phase 6: Rollout
- [ ] Enable PostgreSQL tests in CI/CD
- [ ] Monitor for issues
- [ ] Gather team feedback
- [ ] Remove SQLite fallback (optional)

## Troubleshooting

### Tests Fail with "database does not exist"

**Solution**:
```bash
createdb glasscode_test
```

### Connection Refused

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $TEST_DATABASE_URL

# Verify credentials
psql $TEST_DATABASE_URL
```

### Slow Test Execution

**Solution 1**: Use transaction rollback instead of truncate
**Solution 2**: Increase connection pool size
**Solution 3**: Run tests in parallel with `--maxWorkers`

### Permission Denied

**Solution**:
```sql
GRANT ALL PRIVILEGES ON DATABASE glasscode_test TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### Migration Scripts Don't Run

**Solution**:
```bash
# Ensure migrations table exists
npx sequelize-cli db:migrate:status

# Run migrations manually
NODE_ENV=test npx sequelize-cli db:migrate
```

## Rollback Plan

If PostgreSQL tests cause issues, revert to SQLite:

1. **Remove Environment Variables**
```bash
unset USE_REAL_DB_FOR_TESTS
unset TEST_DATABASE_URL
```

2. **Restart Tests**
```bash
npm test  # Will automatically use SQLite
```

3. **CI/CD Rollback**
Remove PostgreSQL service from GitHub Actions and environment variables.

## Best Practices

### 1. Use Separate Test Database
Never use production or development databases for tests. Always use a dedicated test database.

### 2. Clean State Between Tests
Ensure each test starts with a clean database state to avoid test interdependencies.

### 3. Seed Minimal Data
Only seed data that's absolutely necessary for tests to pass. Avoid large datasets.

### 4. Use Transactions
Wrap tests in transactions when possible for faster cleanup and perfect isolation.

### 5. Monitor Performance
Track test execution time and optimize if tests become too slow (>30 seconds for full suite).

## Success Criteria

### Migration Complete When:
- [ ] All 298 existing tests pass with PostgreSQL
- [ ] Test execution time <20 seconds (acceptable overhead)
- [ ] CI/CD successfully runs tests with PostgreSQL
- [ ] No schema drift between test and production
- [ ] Team is trained on new setup

### Quality Metrics:
- **Test Pass Rate**: 100% (298/298)
- **Performance**: <2x slower than SQLite acceptable
- **Reliability**: No flaky tests introduced
- **Maintainability**: Clear documentation exists

## Resources

### Documentation
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Tools
- **pg_dump**: Backup test database
- **psql**: Interactive PostgreSQL client
- **pgAdmin**: GUI for PostgreSQL management

### Scripts

#### Backup Test Database
```bash
pg_dump glasscode_test > test_backup.sql
```

#### Restore Test Database
```bash
psql glasscode_test < test_backup.sql
```

#### Reset Test Database
```bash
dropdb glasscode_test
createdb glasscode_test
npm run migrate:test
```

## Conclusion

Migrating to PostgreSQL for tests ensures production parity and catches database-specific bugs earlier. The infrastructure is already in place—configuration just needs to be enabled via environment variables.

**Key Takeaways**:
1. Configuration already exists, just needs environment variables
2. Expect 33-66% slower test execution (acceptable tradeoff)
3. Use transactions for optimal performance
4. CI/CD integration is straightforward with PostgreSQL service
5. Rollback to SQLite is simple if needed

**Next Steps**:
1. Create test database locally
2. Run tests with `USE_REAL_DB_FOR_TESTS=true`
3. Verify all tests pass
4. Update CI/CD configuration
5. Monitor and optimize
