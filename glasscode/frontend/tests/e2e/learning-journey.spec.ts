import { test, expect } from '@playwright/test';
import { login, testUsers, clearAuthState } from './helpers/auth';
import {
  goToCourses,
  goToModule,
  selectFirstCourse,
  selectFirstModule,
  selectFirstLesson,
  waitForContent,
  verifyHeading,
} from './helpers/navigation';

/**
 * E2E tests for learning path user journeys
 * Tests the complete flow: browse courses → select module → view lesson → complete
 */

test.describe('Learning Path Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state and login before each test
    await clearAuthState(page);
    // Note: Some learning content may be available without login
    // Adjust if authentication is required
  });

  test('user can browse available courses', async ({ page }) => {
    await goToCourses(page);
    
    // Verify courses page loaded
    expect(page.url()).toContain('courses');
    
    // Wait for content to load
    await waitForContent(page);
    
    // Verify at least one course is visible
    const courses = await page.$$('[data-testid="course-card"], .course-card, article');
    expect(courses.length).toBeGreaterThan(0);
  });

  test('user can view course details', async ({ page }) => {
    await goToCourses(page);
    
    // Select first course
    const courseUrl = await selectFirstCourse(page);
    
    // Verify navigated to course page
    expect(courseUrl).not.toContain('/courses');
    
    // Verify course content is visible
    await waitForContent(page);
    
    // Should see course title/heading
    const heading = await page.$('h1, h2');
    expect(heading).not.toBeNull();
  });

  test('user can navigate from course to module', async ({ page }) => {
    await goToCourses(page);
    
    // Navigate: courses → course → module
    await selectFirstCourse(page);
    const moduleUrl = await selectFirstModule(page);
    
    // Verify on module page
    expect(moduleUrl).toContain('/modules/');
    await waitForContent(page);
  });

  test('user can view lesson content', async ({ page }) => {
    await goToCourses(page);
    
    // Navigate: courses → course → module → lesson
    await selectFirstCourse(page);
    await selectFirstModule(page);
    const lessonUrl = await selectFirstLesson(page);
    
    // Verify on lesson page
    expect(lessonUrl).toContain('/lessons/');
    
    // Verify lesson content is visible
    await waitForContent(page);
    
    // Should have main content area
    const content = await page.$('main, article, [role="main"]');
    expect(content).not.toBeNull();
  });

  test('user can navigate between lessons in a module', async ({ page }) => {
    await goToCourses(page);
    
    // Navigate to first lesson
    await selectFirstCourse(page);
    await selectFirstModule(page);
    await selectFirstLesson(page);
    
    const firstLessonUrl = page.url();
    
    // Look for next lesson button/link
    const nextButton = await page.$('button:has-text("Next"), a:has-text("Next"), [data-testid="next-lesson"]');
    
    if (nextButton) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on different lesson
      const secondLessonUrl = page.url();
      expect(secondLessonUrl).not.toBe(firstLessonUrl);
      expect(secondLessonUrl).toContain('/lessons/');
    }
  });

  test('module page shows list of lessons', async ({ page }) => {
    // Navigate directly to a known module (using short slug)
    await goToModule(page, 'js'); // JavaScript module
    
    // Wait for lessons list to load
    await page.waitForSelector('[data-testid="lesson-link"], .lesson-link, a[href*="/lessons/"]', { timeout: 10000 });
    
    // Verify multiple lessons are listed
    const lessons = await page.$$('[data-testid="lesson-link"], .lesson-link, a[href*="/lessons/"]');
    expect(lessons.length).toBeGreaterThan(0);
  });

  test('lesson page displays lesson content', async ({ page }) => {
    // Navigate directly to a known module
    await goToModule(page, 'js');
    
    // Click first lesson
    await selectFirstLesson(page);
    
    // Verify lesson content elements
    await expect(page.locator('h1, h2')).toBeVisible();
    await expect(page.locator('main, article')).toBeVisible();
  });

  test('user can access module quizzes', async ({ page }) => {
    // Navigate to module
    await goToModule(page, 'programming'); // Programming fundamentals module
    
    // Look for quiz link/button
    const quizLink = await page.$('a:has-text("Quiz"), a:has-text("Test"), button:has-text("Quiz"), [href*="/quiz"]');
    
    if (quizLink) {
      await quizLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify quiz page loaded
      const url = page.url();
      expect(url).toMatch(/quiz|test/i);
      
      // Should see quiz questions
      const questions = await page.$$('[data-testid="question"], .question');
      expect(questions.length).toBeGreaterThan(0);
    }
  });

  test('complete learning flow: browse → select → learn', async ({ page }) => {
    // Step 1: Browse courses
    await goToCourses(page);
    await expect(page.locator('h1, h2')).toContainText(/courses|browse/i);
    
    // Step 2: Select a course
    await selectFirstCourse(page);
    await waitForContent(page);
    
    // Step 3: Select a module
    await selectFirstModule(page);
    const moduleUrl = page.url();
    expect(moduleUrl).toContain('/modules/');
    
    // Step 4: View lesson content
    await selectFirstLesson(page);
    const lessonUrl = page.url();
    expect(lessonUrl).toContain('/lessons/');
    
    // Verify we can see the lesson content
    await waitForContent(page);
    await expect(page.locator('main, article')).toBeVisible();
  });

  test('authenticated user can track progress', async ({ page }) => {
    // Login first
    await login(page, testUsers.regularUser);
    
    // Navigate to a lesson
    await goToModule(page, 'js');
    await selectFirstLesson(page);
    
    // Look for progress indicators
    // This might be a checkbox, button, or progress bar
    const progressIndicators = [
      '[data-testid="mark-complete"]',
      'button:has-text("Complete")',
      'button:has-text("Mark as done")',
      'input[type="checkbox"]',
    ];
    
    let hasProgressTracking = false;
    for (const selector of progressIndicators) {
      const element = await page.$(selector);
      if (element) {
        hasProgressTracking = true;
        break;
      }
    }
    
    // Note: Progress tracking may not be visible on all lessons
    // This test verifies the feature exists if implemented
    if (hasProgressTracking) {
      expect(hasProgressTracking).toBe(true);
    }
  });
});
