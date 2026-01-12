import { test, expect } from '@playwright/test';

// Smoke tests for content API endpoints used by the client
// Verifies status, JSON shape, and minimal invariants without relying on backend availability.

test.describe('Content API endpoints', () => {
  test('registry responds with JSON and core keys', async ({ request }) => {
    const res = await request.get('/api/content/registry');
    expect(res.status(), 'status').toBe(200);
    const json = await res.json();
    expect(typeof json.version).toBe('string');
    expect(json).toHaveProperty('tiers');
    expect(json).toHaveProperty('modules');
    expect(json).toHaveProperty('globalSettings');
  });

  test('lessons endpoint returns array for short slug mapping', async ({ request }) => {
    // Use a short slug that maps to a full module slug (e.g., js -> javascript)
    const res = await request.get('/api/content/lessons/js');
    expect(res.status(), 'status').toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data) && data.length > 0) {
      expect(typeof data[0]).toBe('object');
      expect(data[0]).toHaveProperty('title');
    }
  });

  test('quizzes endpoint returns object with questions array (short slug mapping)', async ({ request }) => {
    // Use a short slug that maps to a full module slug (e.g., programming -> programming-fundamentals)
    const res = await request.get('/api/content/quizzes/programming');
    expect(res.status(), 'status').toBe(200);
    const quiz = await res.json();
    expect(quiz).toHaveProperty('questions');
    expect(Array.isArray(quiz.questions)).toBe(true);
    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      const q = quiz.questions[0];
      expect(q).toHaveProperty('question');
      expect(Array.isArray(q.choices)).toBe(true);
    }
  });
});