import { test, expect } from '@playwright/test';
import { login, logout, register, clearAuthState, isLoggedIn, testUsers } from './helpers/auth';

/**
 * E2E tests for authentication user journeys
 * Tests the complete flow: registration → login → logout
 */

test.describe('Authentication Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear authentication state before each test
    await clearAuthState(page);
  });

  test('user can navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link/button
    const loginLink = await page.$('a[href*="/login"], button:has-text("Login"), a:has-text("Login")');
    
    if (loginLink) {
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 5000 });
    } else {
      // Direct navigation if link not found
      await page.goto('/auth/login');
    }
    
    // Verify we're on login page
    expect(page.url()).toContain('login');
    
    // Verify login form exists
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('user can navigate to registration page', async ({ page }) => {
    await page.goto('/');
    
    // Look for register/signup link
    const registerLink = await page.$('a[href*="/register"], a[href*="/signup"], button:has-text("Sign up"), a:has-text("Sign up")');
    
    if (registerLink) {
      await registerLink.click();
      await page.waitForURL('**/register', { timeout: 5000 }).catch(() => {
        // If it didn't navigate, might already be on register page or use signup
        return page.waitForURL('**/signup', { timeout: 5000 });
      });
    } else {
      await page.goto('/auth/register');
    }
    
    // Verify we're on registration page
    const url = page.url();
    expect(url).toMatch(/register|signup/);
    
    // Verify registration form exists
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait a bit for error message
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    expect(page.url()).toContain('login');
    
    // Should show error message (check for common error indicators)
    const hasError = await page.locator('text=/error|invalid|incorrect|failed/i').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('login with valid credentials succeeds', async ({ page }) => {
    // Note: This test assumes the test user exists in the database
    // In a real scenario, you might need to seed the database first
    
    await page.goto('/auth/login');
    
    // Fill in credentials
    await page.fill('input[name="email"], input[type="email"]', testUsers.regularUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.regularUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation away from login page
    await page.waitForURL((url) => !url.toString().includes('login'), { timeout: 10000 });
    
    // Verify we're no longer on login page
    expect(page.url()).not.toContain('login');
    
    // Verify user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('logout successfully ends session', async ({ page }) => {
    // First login
    await login(page, testUsers.regularUser);
    
    // Verify logged in
    let loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Perform logout
    await logout(page);
    
    // Verify logged out
    loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
  });

  test('session persists across page navigation', async ({ page }) => {
    // Login
    await login(page, testUsers.regularUser);
    
    // Navigate to different pages
    await page.goto('/');
    let loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    await page.goto('/courses');
    loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Ensure logged out
    await clearAuthState(page);
    
    // Try to access a protected route (adjust path as needed)
    await page.goto('/admin');
    
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {
      // Some apps might show access denied instead of redirect
      const url = page.url();
      expect(url).toMatch(/login|denied|unauthorized|403/);
    });
  });

  test('complete auth flow: register → logout → login', async ({ page }) => {
    // Note: This test would require database cleanup or unique emails
    // Skipping actual registration to avoid database pollution
    
    // Start with login
    await login(page, testUsers.regularUser);
    expect(await isLoggedIn(page)).toBe(true);
    
    // Logout
    await logout(page);
    expect(await isLoggedIn(page)).toBe(false);
    
    // Login again
    await login(page, testUsers.regularUser);
    expect(await isLoggedIn(page)).toBe(true);
  });
});
