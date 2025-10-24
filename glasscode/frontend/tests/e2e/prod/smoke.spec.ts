import { test, expect } from '@playwright/test';

// Production smoke tests focusing on public availability
// Uses request context to avoid browser navigation dependencies

test.describe('Production Smoke', () => {
  test('homepage returns 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status(), 'status').toBe(200);
  });

  test('robots.txt returns 200 and contains Sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status(), 'status').toBe(200);
    const text = await res.text();
    expect(text).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i);
  });

  test('sitemap.xml returns 200 and contains <urlset>', async ({ request }) => {
    const res = await request.get('/sitemap.xml', {
      headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' },
    });
    expect(res.status(), 'status').toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<urlset');
  });
});