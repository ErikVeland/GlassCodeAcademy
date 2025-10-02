# Fullstack Academy Testing Instructions

This document provides step-by-step instructions for testing all the fixes and improvements made to the Fullstack Academy application.

## Prerequisites

Before testing, ensure you have:
1. .NET 9 SDK installed
2. Node.js 18+ installed
3. Git installed
4. A modern web browser (Chrome, Firefox, Safari, or Edge)

## Setup Instructions

### 1. Start the Backend Server
```bash
cd /Users/veland/dotNetQuiz/dot-net-quiz/backend
dotnet run
```
The backend should start on http://localhost:5022

### 2. Start the Frontend Server
```bash
cd /Users/veland/dotNetQuiz/dot-net-quiz/frontend
npm run dev
```
The frontend should start on http://localhost:3001 (or another available port)

## Testing Checklist

### 1. Layout Consistency Testing

#### Test 1: Header and Main Content Width
1. Open http://localhost:3001 in your browser
2. Navigate to any page (e.g., http://localhost:3001/laravel/lessons)
3. Verify that the header and main content have the same width
4. Check that the footer stays at the bottom of the viewport and doesn't get pushed unnecessarily

#### Test 2: Responsive Layout
1. Resize your browser window to different sizes (mobile, tablet, desktop)
2. Verify that the layout remains consistent and responsive
3. Check that all elements are properly aligned at different screen sizes

### 2. Theme Switching Testing

#### Test 1: Dark Mode Toggle
1. Open http://localhost:3001 in your browser
2. Click the dark mode toggle button in the header (moon icon)
3. Verify that the page switches to dark mode
4. Click the toggle again (sun icon) to switch back to light mode
5. Verify that the page switches back to light mode

#### Test 2: Theme Persistence
1. Switch to dark mode
2. Refresh the page
3. Verify that the page remains in dark mode
4. Switch to light mode
5. Refresh the page
6. Verify that the page remains in light mode

#### Test 3: System Preference Detection
1. Clear browser localStorage (Application tab in DevTools → Clear storage)
2. Set your system to dark mode
3. Open http://localhost:3001
4. Verify that the page automatically loads in dark mode
5. Set your system to light mode
6. Open http://localhost:3001 in an incognito/private window
7. Verify that the page automatically loads in light mode

### 3. Laravel Quiz Module Testing

#### Test 1: Laravel Lessons Navigation
1. Navigate to http://localhost:3001/laravel/lessons
2. Verify that Laravel lessons are displayed
3. Click on different topics to expand/collapse them
4. Click on individual lessons to view details
5. Use the navigation buttons to move between lessons
6. Navigate to the end of the last category
7. Verify that "Exit Lessons" and "Start Laravel Quiz" buttons are displayed
8. Test both buttons to ensure they navigate to the correct pages

#### Test 2: Laravel Interview Quiz Functionality
1. Navigate to http://localhost:3001/laravel/interview
2. Verify that Laravel interview questions are displayed
3. Select an answer for a multiple-choice question
4. Click "Submit" to submit your answer
5. Verify that feedback is displayed (correct/incorrect with explanation)
6. Click "Next Question" to proceed
7. Complete the entire quiz
8. Verify that you receive a score and certificate upon completion

#### Test 3: Open-Ended Questions
1. Navigate to http://localhost:3001/laravel/interview
2. Find an open-ended question (if available)
3. Click "Show Answer" to view the explanation
4. Verify that the explanation is displayed correctly

#### Test 4: Quiz Restart Functionality
1. Complete a few questions in the Laravel quiz
2. Click "Exit Quiz" or navigate away
3. Return to http://localhost:3001/laravel/interview
4. Verify that you can start the quiz again from the beginning
5. Click "Try Again" on the completion screen
6. Verify that the quiz restarts properly

### 4. GraphQL API Testing

#### Test 1: Laravel Lessons Query
1. Open http://localhost:3001/graphql-ui (GraphQL Playground)
2. Execute the following query:
```graphql
{
  laravelLessons {
    id
    title
    topic
    description
  }
}
```
3. Verify that the query returns Laravel lesson data

#### Test 2: Laravel Interview Questions Query
1. In GraphQL Playground, execute the following query:
```graphql
{
  laravelInterviewQuestions {
    id
    question
    topic
    type
  }
}
```
4. Verify that the query returns Laravel interview question data

#### Test 3: Submit Answer Mutation
1. In GraphQL Playground, execute the following mutation:
```graphql
mutation {
  submitLaravelAnswer(questionId: 1, answerIndex: 0) {
    isCorrect
    explanation
  }
}
```
2. Verify that the mutation returns a result with isCorrect and explanation fields

### 5. Cross-Module Consistency Testing

#### Test 1: Compare Module Interfaces
1. Navigate to http://localhost:3001/lessons (.NET lessons)
2. Navigate to http://localhost:3001/laravel/lessons (Laravel lessons)
3. Compare the interface design, navigation, and functionality
4. Verify that both modules have consistent user experience

#### Test 2: Compare Quiz Experiences
1. Navigate to http://localhost:3001/interview (.NET quiz)
2. Navigate to http://localhost:3001/laravel/interview (Laravel quiz)
3. Compare the quiz interface, question display, and feedback
4. Verify that both quizzes have consistent user experience

### 6. Performance Testing

#### Test 1: Page Load Times
1. Open browser DevTools (F12)
2. Navigate to http://localhost:3001/laravel/lessons
3. Check the Network tab for load times
4. Verify that pages load within reasonable timeframes

#### Test 2: Quiz Responsiveness
1. Navigate to http://localhost:3001/laravel/interview
2. Answer questions quickly
3. Verify that the UI responds immediately to user actions
4. Check that there are no delays in answer submission or feedback

### 7. Error Handling Testing

#### Test 1: Network Error Simulation
1. Stop the backend server (Ctrl+C in the terminal)
2. Navigate to http://localhost:3001/laravel/lessons
3. Verify that appropriate error messages are displayed
4. Restart the backend server
5. Verify that the page recovers and loads content correctly

#### Test 2: Invalid Answer Submission
1. Navigate to http://localhost:3001/laravel/interview
2. Try to submit an answer without selecting one
3. Verify that the submit button is disabled
4. Select an answer and submit
5. Verify that the submission works correctly

## Automated Testing

### Backend Tests
To run backend tests:
```bash
cd /Users/veland/dotNetQuiz/dot-net-quiz/backend
dotnet test
```

### Frontend Tests
To run frontend tests:
```bash
cd /Users/veland/dotNetQuiz/dot-net-quiz/frontend
npm test
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Backend server fails to start (port in use)
**Solution**:
```bash
lsof -ti:5022 | xargs kill -9
cd /Users/veland/dotNetQuiz/dot-net-quiz/backend
dotnet run
```

#### Issue: Frontend server fails to start (port in use)
**Solution**:
```bash
lsof -ti:3000,3001 | xargs kill -9
cd /Users/veland/dotNetQuiz/dot-net-quiz/frontend
npm run dev
```

#### Issue: Theme switching not working
**Solution**:
1. Clear browser localStorage
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Check browser console for JavaScript errors

#### Issue: Laravel content not loading
**Solution**:
1. Verify backend server is running
2. Check GraphQL endpoint at http://localhost:5022/graphql
3. Test queries in GraphQL Playground
4. Check browser console for network errors

## Success Criteria

All tests should pass with the following criteria:
1. Layout consistency maintained across all pages and screen sizes
2. Theme switching works reliably and persists across sessions
3. Laravel quiz module functions identically to other quiz modules
4. All GraphQL queries and mutations work correctly
5. User experience is consistent across all technology tracks
6. No JavaScript errors in the browser console
7. Reasonable page load times (< 3 seconds for initial load)
8. Proper error handling for edge cases

## Additional Testing Resources

### GraphQL Schema Documentation
Available at: http://localhost:5022/graphql-ui

### API Endpoints
- GraphQL API: http://localhost:5022/graphql
- GraphQL Playground: http://localhost:5022/graphql-ui

### Source Code Structure
- Frontend: `/Users/veland/dotNetQuiz/dot-net-quiz/frontend`
- Backend: `/Users/veland/dotNetQuiz/dot-net-quiz/backend`

## Reporting Issues

If any issues are found during testing:
1. Document the steps to reproduce
2. Include browser console errors (if any)
3. Include screenshots if helpful
4. Report to the development team with detailed information

## Test Completion

After completing all tests, verify that:
- [ ] All layout consistency tests pass
- [ ] All theme switching tests pass
- [ ] All Laravel quiz functionality tests pass
- [ ] All GraphQL API tests pass
- [ ] All cross-module consistency tests pass
- [ ] All performance tests pass
- [ ] All error handling tests pass
- [ ] No issues found in browser console
- [ ] All success criteria met

Once all tests are completed successfully, the application is ready for production use.