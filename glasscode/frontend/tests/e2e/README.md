# End-to-End Tests

This directory contains Playwright E2E tests for critical user journeys in GlassCode Academy.

## Test Structure

### Helper Utilities

- **`helpers/auth.ts`** - Authentication helpers (login, logout, register)
- **`helpers/navigation.ts`** - Navigation helpers (page navigation, content selection)

### Test Suites

#### 1. Authentication Journey (`auth-journey.spec.ts`)
Tests complete authentication flows:
- Navigate to login/registration pages
- Login with valid/invalid credentials
- Session persistence across navigation
- Logout functionality
- Protected route access control

**Test Count**: 8 tests  
**Coverage**: Registration, login, logout, session management

#### 2. Learning Path Journey (`learning-journey.spec.ts`)
Tests content consumption workflows:
- Browse available courses
- View course details
- Navigate from course → module → lesson
- View lesson content
- Navigate between lessons
- Access quizzes
- Track progress (if authenticated)

**Test Count**: 11 tests  
**Coverage**: Complete learning journey from discovery to completion

#### 3. Admin Content Management Journey (`admin-journey.spec.ts`)
Tests admin workflows:
- Access admin dashboard
- Navigate admin sections
- View lesson/module management
- Access edit forms
- User management access
- Access control (non-admin blocked)

**Test Count**: 10 tests  
**Coverage**: Admin content management workflows

#### 4. Existing Tests
- **`accessibility-axe.spec.ts`** - WCAG 2.1 AA accessibility tests
- **`content-endpoints.spec.ts`** - API endpoint smoke tests
- **`sitemap.spec.ts`** - Sitemap validation

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Ensure backend is running (or use staging environment):
```bash
# Start backend on http://localhost:8080
cd ../../backend-node
npm run dev
```

4. Start frontend dev server:
```bash
npm run dev
```

### Run All E2E Tests

```bash
npx playwright test
```

### Run Specific Test Suite

```bash
# Authentication tests only
npx playwright test auth-journey

# Learning path tests only
npx playwright test learning-journey

# Admin tests only
npx playwright test admin-journey
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Timeout**: 30 seconds per test
- **Retries**: Configured for CI/CD
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

## Test Data

### Test Users

The tests use predefined test users defined in `helpers/auth.ts`:

- **Regular User**: `test.user@example.com`
- **Admin User**: `admin@example.com`

**Important**: These users must exist in the test database for authentication tests to pass.

### Database Setup

For tests to work properly:

1. **Create test users** in your database:
```sql
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES 
  ('test.user@example.com', '<hashed_password>', 'Test', 'User', 'user'),
  ('admin@example.com', '<hashed_password>', 'Admin', 'User', 'admin');
```

2. **Seed content data** (courses, modules, lessons) for learning journey tests to work

3. **Clean state** between test runs - tests use `clearAuthState()` to reset

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./glasscode/frontend
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: ./glasscode/frontend
      
      - name: Start backend
        run: |
          cd backend-node
          npm ci
          npm run start &
      
      - name: Run E2E tests
        run: npx playwright test
        working-directory: ./glasscode/frontend
      
      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: glasscode/frontend/test-results/
```

## Best Practices

### 1. Test Independence
- Each test should be independent and not rely on other tests
- Use `beforeEach` to set up clean state
- Clear authentication state between tests

### 2. Timeouts
- Use reasonable timeouts for async operations
- Wait for `networkidle` for page loads
- Use explicit waits for specific elements

### 3. Selectors
- Prefer `data-testid` attributes for stability
- Fall back to accessible selectors (roles, labels)
- Avoid fragile CSS selectors when possible

### 4. Error Messages
- Use descriptive test names
- Add helpful error messages in assertions
- Include context in expect statements

### 5. Test Data
- Don't rely on specific content that may change
- Use flexible selectors (e.g., "first course" vs specific course)
- Clean up any data created during tests

## Troubleshooting

### Tests Fail with "Element not found"
- Check if the frontend is running on the correct port
- Verify selectors match actual DOM structure
- Increase timeout if page loads slowly

### Authentication Tests Fail
- Verify test users exist in database
- Check credentials match in `helpers/auth.ts`
- Ensure backend authentication endpoints are working

### Flaky Tests
- Add explicit waits for async operations
- Use `waitForLoadState('networkidle')` after navigation
- Check for race conditions in page interactions

### Backend Not Available
- Tests expect backend on `http://localhost:8080`
- Update `NEXT_PUBLIC_API_URL` in `.env.local` if different
- Consider mocking API calls for frontend-only tests

## Coverage

Current E2E test coverage:

| User Journey | Test Count | Status |
|--------------|-----------|--------|
| Authentication | 8 | ✅ Complete |
| Learning Path | 11 | ✅ Complete |
| Admin Management | 10 | ✅ Complete |
| Accessibility | 2 | ✅ Existing |
| API Endpoints | 3 | ✅ Existing |
| Sitemap | 1 | ✅ Existing |

**Total**: 35 E2E tests covering critical user journeys

## Future Enhancements

### Additional Test Suites Needed
1. **Forum Interaction** - Thread creation, replies (when implemented)
2. **Payment Flow** - Enrollment, checkout (if applicable)
3. **Certificate Generation** - Course completion certificates
4. **Email Notifications** - Verify email triggers (with test email service)
5. **Mobile Responsiveness** - Test on mobile viewports

### Test Infrastructure
1. **Visual Regression Testing** - Percy or similar tool
2. **Performance Testing** - Lighthouse integration
3. **Cross-browser Testing** - Chrome, Firefox, Safari, Edge
4. **API Mocking** - MSW for offline test execution

## Maintenance

### Updating Tests
When UI changes occur:
1. Update selectors in helper functions first
2. Run tests to identify failures
3. Update test expectations as needed
4. Verify tests pass on all environments

### Adding New Tests
1. Use existing helpers when possible
2. Follow AAA pattern (Arrange, Act, Assert)
3. Add descriptive test names
4. Update this README with new test coverage

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test output and screenshots in `test-results/`
- Enable debug mode: `npx playwright test --debug`
