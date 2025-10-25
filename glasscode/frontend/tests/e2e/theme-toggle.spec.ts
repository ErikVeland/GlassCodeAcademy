import { test, expect } from '@playwright/test';

// NOTE: The toggle button is rendered globally as FloatingDarkModeToggle
// with accessible name starting with "Theme:". The provider applies
// `data-theme` on <html> based on selected theme and OS preference.

test.describe('Theme toggle behavior', () => {
  const homeUrl = process.env.PLAYWRIGHT_BASE_URL ? `${process.env.PLAYWRIGHT_BASE_URL}/` : '/';

  test('system respects OS light, and cycles through dark → light → system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('theme');
        localStorage.removeItem('darkMode');
      } catch {}
    });

    await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!document.documentElement.getAttribute('data-theme'));

    // Ensure the prehydration or React toggle is visible before assertions
    await page.waitForSelector('[data-testid="theme-toggle"]', { state: 'visible', timeout: 15000 });
    // Prefer test-id based locator for explicit selection
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();

    // Initial in system mode
    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Click → dark
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Click → light
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Click → system (auto)
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('system respects OS dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // Keep theme as system from previous test or ensure system explicitly
    await page.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'system');
        localStorage.removeItem('darkMode');
      } catch {}
    });

    await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!document.documentElement.getAttribute('data-theme'));

    // Ensure the prehydration or React toggle is visible before assertions
    await page.waitForSelector('[data-testid="theme-toggle"]', { state: 'visible', timeout: 15000 });
    // Prefer test-id based locator for explicit selection
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();

    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify cycling respects OS preference from system: system → light → system
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});