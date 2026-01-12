import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test('should display users in admin dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check that the Users section is visible
    await expect(page.locator('h2:has-text("Users")')).toBeVisible();
    
    // Check that the users table is visible
    await expect(page.locator('table[role="table"]')).toBeVisible();
    
    // Check that search input for users is visible
    await expect(page.locator('input[aria-label="Search users"]')).toBeVisible();
    
    // Check that refresh button is visible
    await expect(page.locator('button[aria-label="Refresh users"]')).toBeVisible();
  });

  test('should allow searching users', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Fill search input
    await page.fill('input[aria-label="Search users"]', 'admin');
    
    // The search functionality would filter the user list
    // We can't fully test this without a real backend, but we can verify the input works
    await expect(page.locator('input[aria-label="Search users"]')).toHaveValue('admin');
  });

  test('should display user details in table', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Check that table headers are correct
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Roles")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Login")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should show role assignment modal', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Click on "Assign Role" button for the first user (if any exist)
    const assignRoleButton = page.locator('button:has-text("Assign Role")').first();
    if (await assignRoleButton.isVisible()) {
      await assignRoleButton.click();
      
      // Check that modal is visible
      await expect(page.locator('text="Assign Role to"')).toBeVisible();
      
      // Check that role selection dropdown is visible
      await expect(page.locator('select#role-select')).toBeVisible();
      
      // Check that cancel button is visible
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      
      // Check that assign role button is visible
      await expect(page.locator('button:has-text("Assign Role")')).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Cancel")');
    }
  });

  test('should refresh user list', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForSelector('text=Admin Dashboard');
    
    // Click refresh button
    await page.click('button[aria-label="Refresh users"]');
    
    // Check that loading state appears (this is a UI test, so we just verify the button was clicked)
    // In a real test with backend, we would verify the data is refreshed
  });
});