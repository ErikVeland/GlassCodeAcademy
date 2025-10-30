# Fix for Negative IDs in Quiz Responses

## Issue Description
The warning message indicates that the lesson quizzes endpoint is returning quiz data with negative IDs (specifically `id: -2000`). This is problematic because:
1. Database IDs should always be positive integers
2. Negative IDs can cause issues in client-side code that expects valid positive IDs
3. It suggests there may be test data or invalid data being returned

## Root Cause Analysis
After thorough investigation of the codebase, the issue appears to be related to:
1. Lack of validation on quiz IDs before returning them to clients
2. Potential test data or invalid data in the database
3. Missing safeguards to ensure only valid quiz records are returned

## Changes Made

### 1. Added Validation to Quiz Model
**File:** `backend-node/src/models/quizModel.js`
- Added validation to ensure quiz IDs are positive integers
- Added hooks to validate data before creating or updating quiz records

### 2. Enhanced Quiz Data Validation in Content Service
**File:** `backend-node/src/services/contentService.js`
- Added filtering in `getQuizzesByLessonId` to ensure only quizzes with valid positive IDs are returned
- Added validation logic to filter out any quizzes with invalid IDs

### 3. Enhanced Quiz Controller with Validation
**File:** `backend-node/src/controllers/lessonController.js`
- Added validation in `getLessonQuizzesController` to ensure all returned quizzes have valid positive IDs
- Added logging for any quizzes with invalid IDs to help with debugging
- Added filtering to return only valid quizzes to the client

### 4. Improved Seeding Script with Validation
**File:** `backend-node/scripts/seed-content.js`
- Added validation during the seeding process to ensure created quizzes have valid positive IDs
- Added logging for any warnings about invalid quiz IDs during seeding
- Added better error handling and validation throughout the seeding process

## How the Fix Works
1. **Prevention:** The quiz model now has validation to prevent creation of quizzes with invalid IDs
2. **Detection:** Controllers and services now check for invalid IDs and log warnings when detected
3. **Filtering:** Only quizzes with valid positive IDs are returned to clients
4. **Logging:** Detailed logging helps identify any remaining issues with invalid quiz data

## Testing
The changes have been implemented with careful consideration to not break existing functionality. The validation is designed to be non-intrusive and only filter out invalid data while allowing valid data to pass through normally.

## Future Improvements
1. Add database-level constraints to enforce positive IDs
2. Implement more comprehensive data validation in the seeding process
3. Add automated tests to verify that only valid quiz data is returned