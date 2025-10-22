# Content Verification and Seeding Scripts

This directory contains scripts to verify and fix content seeding in the GlassCode Academy database.

## Scripts Overview

### 1. Content Verification Report (`ContentVerificationReport.cs`)
Generates a detailed report of content status in the database compared to the registry.

### 2. Content File Verification (`ContentFileVerification.cs`)
Verifies that all required content files exist and have valid JSON structure.

### 3. Validate Content Seeding (`ValidateContentSeeding.cs`)
Validates that all content is properly seeded in the database.

### 4. Fix Content Seeding (`FixContentSeeding.cs`)
Fixes any issues with content seeding by adding missing modules, lessons, and quizzes.

### 5. Test Content Verification (`TestContentVerification.cs`)
Simple test script to verify the integration works correctly.

## Integration with Bootstrap Process

The content verification scripts are now integrated into the `bootstrap.sh` script. During deployment, the bootstrap process will:

1. Check if all content is properly seeded in the database
2. If issues are found, automatically attempt to fix them using the FixContentSeeding script
3. Re-verify the content after fixes are applied

This integration ensures that all 18 modules have the required content without requiring manual intervention.

## How to Run the Scripts

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL database with GlassCode schema
- Connection string configured via environment variable or default settings

### Running the Scripts

1. **Navigate to the backend directory:**
   ```bash
   cd /path/to/GlassCodeAcademy/glasscode/backend
   ```

2. **Run the Content Verification Report:**
   ```bash
   dotnet run --project Scripts/ContentVerificationReport.cs
   ```

3. **Run the Content File Verification:**
   ```bash
   dotnet run --project Scripts/ContentFileVerification.cs
   ```

4. **Run the Content Validation:**
   ```bash
   dotnet run --project Scripts/ValidateContentSeeding.cs
   ```

5. **Run the Content Fixing Script:**
   ```bash
   dotnet run --project Scripts/FixContentSeeding.cs
   ```

6. **Test the integration:**
   ```bash
   dotnet run --project Scripts/TestContentVerification.cs
   ```

## Bootstrap Integration Flags

The bootstrap.sh script supports the following flags for content verification:

- `--skip-content-verification`: Skip the enhanced content verification process
- `--fast`: Enable fast mode (also skips content verification)
- `--frontend-only`: Skip backend operations including content verification

Example usage:
```bash
./bootstrap.sh --skip-content-verification
```

## Environment Variables

The scripts use the following environment variables:

- `CONNECTION_STRING`: PostgreSQL connection string (defaults to `Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres`)

## Expected Results

### Content Verification Report
Should show:
- All 18 modules present
- Each module with required number of lessons
- Each module with required number of quiz questions
- 100% completion rates

### Content File Verification
Should show:
- All 18 lesson files present
- All 18 quiz files present
- Valid JSON structure in all files

## Troubleshooting

### Missing Modules
If modules are missing from the database:
1. Run the Fix Content Seeding script
2. Check the database connection string
3. Verify the registry.json file is valid

### Missing Lessons or Quizzes
If lessons or quizzes are missing:
1. Run the Fix Content Seeding script
2. Verify content files exist in `/content/lessons/` and `/content/quizzes/`
3. Check file permissions

### Database Connection Issues
Ensure:
1. PostgreSQL is running
2. Database exists and has correct schema
3. Connection string is correct
4. User has appropriate permissions

## Module Requirements

All 18 modules should have:
- At least the minimum required lessons as defined in registry.json
- At least the minimum required quiz questions as defined in registry.json

### Module List
1. Programming Fundamentals
2. Web Development Basics
3. Version Control
4. .NET Core Fundamentals
5. React Development
6. Database Systems
7. TypeScript Development
8. Node.js Development
9. Laravel Framework
10. Next.js Full-Stack Framework
11. GraphQL Development
12. Sass/SCSS Development
13. Tailwind CSS Framework
14. Vue.js Framework
15. Software Testing Fundamentals
16. End-to-End Testing
17. Performance Optimization
18. Security Best Practices