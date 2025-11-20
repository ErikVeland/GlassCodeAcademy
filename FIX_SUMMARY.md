# Fix Summary: Bootstrap Script Database Migration Issue

## Problem
The bootstrap.sh script was failing with the error:
```
npm error Missing script: "migrate"
```

## Root Cause
1. The package.json defined a "migrate" script that pointed to `node scripts/run-migrations.js`
2. The `scripts/run-migrations.js` file did not exist
3. The existing `scripts/migrate.js` file was trying to run Prisma migrations, but the project uses Sequelize
4. Some Sequelize migrations were trying to add columns that already existed in the database

## Solution
1. **Created missing wrapper script**: Created `scripts/run-migrations.js` as a wrapper that delegates to `scripts/migrate.js`

2. **Fixed migration implementation**: Updated `scripts/migrate.js` to properly use Sequelize with Umzug instead of trying to run Prisma migrations

3. **Made migrations idempotent**: Updated migration files 004, 005, and 006 to check if columns exist before trying to add them, preventing errors when running migrations against a database that already has the schema

## Files Modified
- `scripts/run-migrations.js` (new file) - Wrapper script for compatibility
- `scripts/migrate.js` (modified) - Updated to use Sequelize with Umzug
- `scripts/migrations/004-add-version-to-course-table.js` (modified) - Made idempotent
- `scripts/migrations/005-add-version-to-module-table.js` (modified) - Made idempotent
- `scripts/migrations/006-add-version-to-lesson-table.js` (modified) - Made idempotent

## Verification
All of the following commands now work correctly:
- `npm run migrate` (from package.json scripts)
- `node scripts/run-migrations.js` (direct execution)
- `node scripts/migrate.js` (direct execution of the implementation)

The bootstrap.sh script should now be able to successfully run database migrations during deployment.