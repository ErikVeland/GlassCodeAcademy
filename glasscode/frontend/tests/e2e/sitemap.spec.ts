import { test, expect } from '@playwright/test';

// Validates that /sitemap.xml is served and contains multiple URL entries
// Uses Playwright's request context; no browser navigation required

test.describe('Sitemap.xml', () => {
  test('returns XML and contains multiple urls', async ({ request }) => {
    const res = await request.get('/sitemap.xml', {
      headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' },
    });

    expect(res.status(), 'status').toBe(200);

    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('xml');

    const xml = await res.text();
    expect(xml).toContain('<urlset');

    const urlCount = (xml.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThanOrEqual(8);

    // At least one lessons page for a module (react/node/etc.)
    expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/[a-z0-9-]+\/lessons<\/loc>/);
  });
});