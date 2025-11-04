import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    email: 'e2e-test@example.com',
    password: 'TestPass123!',
    firstName: 'E2E',
    lastName: 'Test',
  };

  test('should register a new user and login', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input#firstName', testUser.firstName);
    await page.fill('input#lastName', testUser.lastName);
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    
    // Submit registration form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Account created successfully')).toBeVisible();
    
    // Wait for redirect to login page
    await page.waitForURL('**/login?registered=true');
    
    // Fill login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit login form
    await page.click('button:has-text("Sign in")');
    
    // Should be redirected to home page after successful login
    await page.waitForURL('/');
    
    // Check that user is logged in by looking for profile menu
    await expect(page.locator('button[aria-label="Profile menu"]')).toBeVisible();
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form with weak password
    await page.fill('input#firstName', testUser.firstName);
    await page.fill('input#lastName', testUser.lastName);
    await page.fill('input#email', 'weak@example.com');
    await page.fill('input#password', '123');
    
    // Submit registration form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible();
  });

  test('should show error for existing user', async ({ page }) => {
    // First register a user
    await page.goto('/register');
    await page.fill('input#firstName', testUser.firstName);
    await page.fill('input#lastName', testUser.lastName);
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/login?registered=true');
    
    // Try to register the same user again
    await page.goto('/register');
    await page.fill('input#firstName', testUser.firstName);
    await page.fill('input#lastName', testUser.lastName);
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=User already exists with this email')).toBeVisible();
  });
});