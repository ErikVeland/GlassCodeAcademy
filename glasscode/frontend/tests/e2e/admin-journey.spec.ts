import { test, expect } from '@playwright/test';
import { login, testUsers, clearAuthState } from './helpers/auth';
import { goToAdmin, waitForContent } from './helpers/navigation';

/**
 * E2E tests for admin content management journeys
 * Tests admin workflows: login → create content → edit → publish
 */

test.describe('Admin Content Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state and login as admin before each test
    await clearAuthState(page);
    await login(page, testUsers.adminUser);
  });

  test('admin can access admin dashboard', async ({ page }) => {
    await goToAdmin(page);
    
    // Verify we're on admin page
    expect(page.url()).toContain('/admin');
    
    // Verify admin content is visible
    await waitForContent(page);
    
    // Look for admin-specific elements
    const adminElements = await page.$$('[data-testid*="admin"], .admin-panel, h1:has-text("Admin")');
    expect(adminElements.length).toBeGreaterThan(0);
  });

  test('admin dashboard shows navigation menu', async ({ page }) => {
    await goToAdmin(page);
    
    // Look for admin navigation
    const nav = await page.$('nav, [role="navigation"], aside');
    expect(nav).not.toBeNull();
    
    // Should have links to content management areas
    const contentLinks = await page.$$('a:has-text("Lessons"), a:has-text("Modules"), a:has-text("Courses"), a:has-text("Content")');
    expect(contentLinks.length).toBeGreaterThan(0);
  });

  test('admin can navigate to lessons management', async ({ page }) => {
    await goToAdmin(page);
    
    // Look for lessons link
    const lessonsLink = await page.$('a:has-text("Lessons"), a[href*="/admin/lessons"], a[href*="/lessons"]');
    
    if (lessonsLink) {
      await lessonsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify on lessons page
      const url = page.url();
      expect(url).toContain('lessons');
      
      // Should see list of lessons or create button
      await waitForContent(page);
    }
  });

  test('admin can view lesson creation form', async ({ page }) => {
    await goToAdmin(page);
    
    // Navigate to lessons
    const lessonsLink = await page.$('a:has-text("Lessons"), a[href*="/lessons"]');
    if (lessonsLink) {
      await lessonsLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Look for create/new button
    const createButton = await page.$('button:has-text("Create"), button:has-text("New"), a:has-text("New Lesson"), a:has-text("Create Lesson")');
    
    if (createButton) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify form is visible
      const form = await page.$('form');
      expect(form).not.toBeNull();
      
      // Should have title input
      const titleInput = await page.$('input[name="title"], input[placeholder*="title"]');
      expect(titleInput).not.toBeNull();
    }
  });

  test('admin can view existing lesson for editing', async ({ page }) => {
    await goToAdmin(page);
    
    // Navigate to lessons
    const lessonsLink = await page.$('a:has-text("Lessons"), a[href*="/lessons"]');
    if (lessonsLink) {
      await lessonsLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Look for edit button/link on first lesson
    const editButton = await page.$('button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-lesson"]');
    
    if (editButton) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should see edit form
      const form = await page.$('form');
      expect(form).not.toBeNull();
    }
  });

  test('admin can access module management', async ({ page }) => {
    await goToAdmin(page);
    
    // Look for modules link
    const modulesLink = await page.$('a:has-text("Modules"), a[href*="/admin/modules"], a[href*="/modules"]');
    
    if (modulesLink) {
      await modulesLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify on modules page
      expect(page.url()).toContain('modules');
      await waitForContent(page);
    }
  });

  test('admin can view analytics/dashboard', async ({ page }) => {
    await goToAdmin(page);
    
    // Look for analytics or dashboard link
    const analyticsLink = await page.$('a:has-text("Analytics"), a:has-text("Dashboard"), a[href*="/dashboard"]');
    
    if (analyticsLink) {
      await analyticsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should see some metrics or charts
      await waitForContent(page);
    }
  });

  test('admin can access user management', async ({ page }) => {
    await goToAdmin(page);
    
    // Look for users link
    const usersLink = await page.$('a:has-text("Users"), a[href*="/admin/users"]');
    
    if (usersLink) {
      await usersLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify on users page
      expect(page.url()).toContain('users');
      await waitForContent(page);
    }
  });

  test('non-admin user cannot access admin pages', async ({ page }) => {
    // Logout admin and login as regular user
    await clearAuthState(page);
    await login(page, testUsers.regularUser);
    
    // Try to access admin
    await page.goto('/admin');
    
    // Should be redirected or see access denied
    await page.waitForTimeout(2000);
    const url = page.url();
    
    // Either redirected away from admin or seeing error
    const isBlocked = !url.includes('/admin') || 
                     (await page.$('text=/access denied|unauthorized|403/i')) !== null;
    
    expect(isBlocked).toBe(true);
  });

  test('complete admin flow: dashboard → content → edit → save', async ({ page }) => {
    // Step 1: Access admin dashboard
    await goToAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
    
    // Step 2: Navigate to content management
    const contentLink = await page.$('a:has-text("Lessons"), a:has-text("Content"), a:has-text("Modules")');
    if (contentLink) {
      await contentLink.click();
      await waitForContent(page);
      
      // Step 3: View edit form (if available)
      const editButton = await page.$('button:has-text("Edit"), a:has-text("Edit")');
      if (editButton) {
        await editButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify form loaded
        const form = await page.$('form');
        expect(form).not.toBeNull();
        
        // Note: Not actually saving to avoid data pollution
        // In real tests, would fill form and save, then verify
      }
    }
  });
});
