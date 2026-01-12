#!/usr/bin/env node
/**
 * Simple sitemap validation that matches the current project setup.
 * - Confirms presence and structure of `public/feed.xml` (Atom/RSS feed)
 * - Confirms `public/registry.json` exists and has modules defined
 * This replaces a strict `sitemap.xml` check since the app currently ships a feed and registry.
 */

// Use dynamic imports to conform to ESM-style module usage.
// Paths are computed inside main() after importing node:path.

function ok(msg) {
  console.log(`✔ ${msg}`);
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const FEED_PATH = path.join(__dirname, 'public', 'feed.xml');
  const REGISTRY_PATH = path.join(__dirname, 'public', 'registry.json');
  try {
    // Check feed.xml exists and has a feed root
    if (!fs.existsSync(FEED_PATH)) {
      fail('Missing public/feed.xml');
      return;
    }
    const feed = fs.readFileSync(FEED_PATH, 'utf8');
    const hasFeed = !!feed && feed.toLowerCase().includes('<feed');
    const hasRss = !!feed && feed.toLowerCase().includes('<rss');
    if (!hasFeed && !hasRss) {
      fail('feed.xml is present but missing <feed> or <rss> root');
      return;
    }
    ok('feed.xml exists and contains a valid feed root (<feed>/<rss>)');

    // Check registry.json exists and has modules
    if (!fs.existsSync(REGISTRY_PATH)) {
      fail('Missing public/registry.json');
      return;
    }
    const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const registry = JSON.parse(registryRaw);
    const modules = Array.isArray(registry?.modules) ? registry.modules : [];
    if (modules.length === 0) {
      fail('registry.json has no modules defined');
      return;
    }
    ok(`registry.json found with ${modules.length} modules`);

    ok('Sitemap/registry validation passed');
  } catch (err) {
    fail(`Unexpected error: ${err?.message || err}`);
  }
}

main();