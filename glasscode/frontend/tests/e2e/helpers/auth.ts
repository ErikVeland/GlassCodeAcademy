import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for authentication flows in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin';
}

/**
 * Default test users for E2E tests
 */
export const testUsers = {
  regularUser: {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
  },
};

/**
 * Navigate to login page and perform login
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto('/auth/login');

  // Wait for login form to be visible
  await page.waitForSelector('form', { state: 'visible' });

  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation or success indicator
  await page.waitForURL('**', { timeout: 10000 });
  
  // Verify login success (either redirected away from login or see success message)
  const currentUrl = page.url();
  expect(currentUrl).not.toContain('/auth/login');
}

/**
 * Perform user registration flow
 */
export async function register(page: Page, user: TestUser): Promise<void> {
  // Navigate to registration page
  await page.goto('/auth/register');

  // Wait for registration form
  await page.waitForSelector('form', { state: 'visible' });

  // Fill in registration details
  if (user.firstName) {
    await page.fill('input[name="firstName"]', user.firstName);
  }
  if (user.lastName) {
    await page.fill('input[name="lastName"]', user.lastName);
  }
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Check if password confirmation field exists
  const confirmPasswordField = await page.$('input[name="confirmPassword"], input[name="passwordConfirm"]');
  if (confirmPasswordField) {
    await page.fill('input[name="confirmPassword"], input[name="passwordConfirm"]', user.password);
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation or success
  await page.waitForURL('**', { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button/link
  // Check common logout button locations
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Log out")',
    'a:has-text("Logout")',
    'a:has-text("Log out")',
    '[data-testid="logout"]',
    '[aria-label="Logout"]',
  ];

  let logoutClicked = false;
  for (const selector of logoutSelectors) {
    const element = await page.$(selector);
    if (element) {
      await element.click();
      logoutClicked = true;
      break;
    }
  }

  if (!logoutClicked) {
    // Try to find user menu/dropdown first
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Account")',
      '[aria-label="User menu"]',
    ];

    for (const selector of userMenuSelectors) {
      const menu = await page.$(selector);
      if (menu) {
        await menu.click();
        await page.waitForTimeout(500); // Wait for dropdown to open
        
        // Try logout selectors again
        for (const logoutSelector of logoutSelectors) {
          const logoutBtn = await page.$(logoutSelector);
          if (logoutBtn) {
            await logoutBtn.click();
            logoutClicked = true;
            break;
          }
        }
        break;
      }
    }
  }

  if (logoutClicked) {
    // Wait for logout to complete
    await page.waitForURL('**', { timeout: 5000 });
  } else {
    throw new Error('Could not find logout button');
  }
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common indicators of logged-in state
  const loggedInIndicators = [
    'button:has-text("Logout")',
    'a:has-text("Logout")',
    '[data-testid="user-menu"]',
    '[data-testid="user-profile"]',
  ];

  for (const selector of loggedInIndicators) {
    const element = await page.$(selector);
    if (element) {
      return true;
    }
  }

  return false;
}

/**
 * Ensure user is logged in, login if not
 */
export async function ensureLoggedIn(page: Page, user: TestUser): Promise<void> {
  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    await login(page, user);
  }
}

/**
 * Clear authentication state (cookies, localStorage)
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
