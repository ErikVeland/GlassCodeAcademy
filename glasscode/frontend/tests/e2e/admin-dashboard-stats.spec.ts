import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Stats', () => {
  test('should display stats cards', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check that stats cards are visible
    await expect(page.locator('h3:has-text("Total Users")')).toBeVisible();
    await expect(page.locator('h3:has-text("Modules")')).toBeVisible();
    await expect(page.locator('h3:has-text("Lessons")')).toBeVisible();
    await expect(page.locator('h3:has-text("Quizzes")')).toBeVisible();
    
    // Check that stats values are displayed
    await expect(page.locator('text="Total Users" + p')).toBeVisible();
    await expect(page.locator('text="Modules" + p')).toBeVisible();
    await expect(page.locator('text="Lessons" + p')).toBeVisible();
    await expect(page.locator('text="Quizzes" + p')).toBeVisible();
  });

  test('should display charts section', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check that charts section is visible
    await expect(page.locator('h3:has-text("User Growth")')).toBeVisible();
    await expect(page.locator('h3:has-text("Top Modules")')).toBeVisible();
    
    // Check that chart containers are visible
    await expect(page.locator('text="User Growth" + div')).toBeVisible();
    await expect(page.locator('text="Top Modules" + div')).toBeVisible();
  });

  test('should display active users progress bar', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check that active users section is visible
    await expect(page.locator('h3:has-text("Active Users")')).toBeVisible();
    
    // Check that progress bar is visible
    await expect(page.locator('div[role="progressbar"]')).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check stats grid layout on different screen sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    const largeScreenStats = await page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4').count();
    expect(largeScreenStats).toBe(1);
    
    await page.setViewportSize({ width: 768, height: 600 });
    // On smaller screens, the grid should adapt
  });
});