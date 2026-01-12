import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Performs WCAG 2.1 AA color-contrast checks in both light and dark schemes
// Skips certain rules for speed/noise; focuses on color-contrast violations.

const runContrastCheck = async (page: import('@playwright/test').Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .disableRules(['bypass'])
    .analyze();

  const colorContrastViolations = results.violations.filter(v => v.id === 'color-contrast');
  return { results, colorContrastViolations };
};

test.describe('Accessibility — color contrast', () => {
  test('no color-contrast violations in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
      document.documentElement.removeAttribute('data-theme');
    });
    await page.goto('/');

    const { colorContrastViolations } = await runContrastCheck(page);
    if (colorContrastViolations.length) {
      console.log('Light mode color contrast violations:', JSON.stringify(colorContrastViolations, null, 2));
    }
    expect(colorContrastViolations).toEqual([]);
  });

  test('no color-contrast violations in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
      document.documentElement.removeAttribute('data-theme');
    });
    await page.goto('/');

    const { colorContrastViolations } = await runContrastCheck(page);
    if (colorContrastViolations.length) {
      console.log('Dark mode color contrast violations:', JSON.stringify(colorContrastViolations, null, 2));
    }
    expect(colorContrastViolations).toEqual([]);
  });
});