import { test, expect } from '@playwright/test';

// NOTE: The toggle button is rendered globally as FloatingDarkModeToggle
// with accessible name starting with "Theme:". The provider applies
// `data-theme` on <html> based on selected theme and OS preference.

test.describe('Theme toggle behavior', () => {
  test('system respects OS light, and cycles through dark → light → system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('theme');
        localStorage.removeItem('darkMode');
      } catch {}
    });

    await page.goto('/');

    const toggle = page.getByRole('button', { name: /Theme:/ });

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

    await page.goto('/');

    const toggle = page.getByRole('button', { name: /Theme:/ });
    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify cycling still works from system when OS is dark
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Theme: System (auto)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});