import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for navigation in E2E tests
 */

/**
 * Navigate to home page and verify load
 */
export async function goToHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to courses page
 */
export async function goToCourses(page: Page): Promise<void> {
  await page.goto('/courses');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a specific module by slug
 */
export async function goToModule(page: Page, moduleSlug: string): Promise<void> {
  await page.goto(`/modules/${moduleSlug}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a specific lesson by module and lesson slug
 */
export async function goToLesson(page: Page, moduleSlug: string, lessonSlug: string): Promise<void> {
  await page.goto(`/modules/${moduleSlug}/lessons/${lessonSlug}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to forum
 */
export async function goToForum(page: Page): Promise<void> {
  await page.goto('/forum');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to admin dashboard
 */
export async function goToAdmin(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
}

/**
 * Click on first available course card
 */
export async function selectFirstCourse(page: Page): Promise<string> {
  // Wait for course cards to load
  await page.waitForSelector('[data-testid="course-card"], .course-card, article:has(h2)', { timeout: 10000 });
  
  // Get the first course
  const firstCourse = await page.$('[data-testid="course-card"], .course-card, article:has(h2)');
  
  if (!firstCourse) {
    throw new Error('No courses found on page');
  }
  
  // Click on the course
  await firstCourse.click();
  
  // Wait for navigation
  await page.waitForLoadState('networkidle');
  
  return page.url();
}

/**
 * Select first module from a course page
 */
export async function selectFirstModule(page: Page): Promise<string> {
  // Wait for modules to load
  await page.waitForSelector('[data-testid="module-card"], .module-card, [href*="/modules/"]', { timeout: 10000 });
  
  // Click first module link
  const firstModule = await page.$('[data-testid="module-card"] a, .module-card a, a[href*="/modules/"]:not([href*="/lessons/"])');
  
  if (!firstModule) {
    throw new Error('No modules found on page');
  }
  
  await firstModule.click();
  await page.waitForLoadState('networkidle');
  
  return page.url();
}

/**
 * Select first lesson from a module page
 */
export async function selectFirstLesson(page: Page): Promise<string> {
  // Wait for lessons to load
  await page.waitForSelector('[data-testid="lesson-link"], .lesson-link, a[href*="/lessons/"]', { timeout: 10000 });
  
  // Click first lesson
  const firstLesson = await page.$('[data-testid="lesson-link"], .lesson-link, a[href*="/lessons/"]');
  
  if (!firstLesson) {
    throw new Error('No lessons found on page');
  }
  
  await firstLesson.click();
  await page.waitForLoadState('networkidle');
  
  return page.url();
}

/**
 * Wait for content to be visible on page
 */
export async function waitForContent(page: Page, timeout = 10000): Promise<void> {
  // Wait for main content area to be visible
  await page.waitForSelector('main, [role="main"], article', { state: 'visible', timeout });
}

/**
 * Verify page title contains expected text
 */
export async function verifyPageTitle(page: Page, expectedText: string): Promise<void> {
  const title = await page.title();
  expect(title.toLowerCase()).toContain(expectedText.toLowerCase());
}

/**
 * Verify heading contains expected text
 */
export async function verifyHeading(page: Page, expectedText: string): Promise<void> {
  const heading = await page.$('h1, h2');
  expect(heading).not.toBeNull();
  
  if (heading) {
    const text = await heading.textContent();
    expect(text?.toLowerCase()).toContain(expectedText.toLowerCase());
  }
}
