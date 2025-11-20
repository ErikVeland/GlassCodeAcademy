# GlassCode Academy Content Migration

This directory contains scripts to migrate content from JSON files to the PostgreSQL database.

## Overview

The migration process converts:
- Registry data to Courses and Modules
- Lesson JSON files to Lessons in the database
- Quiz JSON files to Quiz questions in the database

## Prerequisites

1. Database must be set up and accessible
2. Required Node.js packages must be installed

## Running the Migration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the migration:
   ```bash
   npm run migrate
   ```

3. Test the migration:
   ```bash
   npm run test
   ```

## Migration Process

1. **Courses and Modules**: Creates a master course containing all modules from the registry
2. **Lessons**: Reads each module's lesson JSON file and creates lesson records
3. **Quizzes**: Reads each module's quiz JSON file and creates quiz question records

## Error Handling

The migration scripts include error handling for:
- Missing JSON files
- Invalid JSON data
- Database connection issues
- Data validation errors

If any errors occur, the script will log the error and continue with the remaining data.

## Verification

After migration, run the test script to verify data was correctly imported:
```bash
npm run test
```

This will show counts of imported records and sample data from each table.