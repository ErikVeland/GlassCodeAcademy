#!/usr/bin/env node
/**
 * Prewarm ISR caches by visiting selected routes after frontend/backends are online.
 *
 * Env:
 * - FRONTEND_URL: Base URL of the Next.js app (default http://localhost:3000)
 * - BACKEND_URL: Optional base URL of the backend/API to wait for
 * - MAX_MODULES: Optional limit of modules to prewarm (for speed)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || '';
const MAX_MODULES = parseInt(process.env.MAX_MODULES || '0', 10);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(url, { timeoutMs = 120000, intervalMs = 2000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status >= 200 && res.status < 500) {
        console.log(`Ready: ${url} [${res.status}]`);
        return true;
      }
    } catch {
      // ignore and retry
    }
    await sleep(intervalMs);
    process.stdout.write('.');
  }
  console.error(`Timed out waiting for ${url}`);
  return false;
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

async function prewarmPath(base, path) {
  const url = new URL(path, base).toString();
  try {
    const res = await fetch(url, { method: 'GET' });
    console.log(`[${res.status}] ${path}`);
  } catch (e) {
    console.error(`[ERR] ${path}: ${e.message}`);
  }
}

async function getModuleSlugs(frontendBase) {
  // Try to read the frontend-served content registry
  const registryUrl = new URL('/content/registry.json', frontendBase).toString();
  const reg = await fetchJson(registryUrl);
  if (!reg) {
    console.warn('Could not load /content/registry.json; falling back to defaults.');
    return [];
  }
  // The registry may have different shapes; try common ones
  const slugs = [];
  if (Array.isArray(reg.modules)) {
    for (const m of reg.modules) {
      if (m && typeof m.slug === 'string') slugs.push(m.slug);
    }
  }
  if (Array.isArray(reg.moduleSlugs)) {
    for (const s of reg.moduleSlugs) {
      if (typeof s === 'string') slugs.push(s);
    }
  }
  // Limit if requested
  const final = uniq(slugs);
  if (MAX_MODULES > 0) return final.slice(0, MAX_MODULES);
  return final;
}

async function run() {
  console.log(`Prewarm starting with FRONTEND_URL=${FRONTEND_URL}${BACKEND_URL ? `, BACKEND_URL=${BACKEND_URL}` : ''}`);

  if (BACKEND_URL) {
    console.log('Waiting for backend...');
    const ok = await waitFor(BACKEND_URL);
    if (!ok) process.exit(1);
  } else {
    console.log('Skipping backend wait (BACKEND_URL not set).');
  }

  console.log('Waiting for frontend...');
  const frontendReady = await waitFor(FRONTEND_URL);
  if (!frontendReady) process.exit(1);

  const moduleSlugs = await getModuleSlugs(FRONTEND_URL);
  if (!moduleSlugs || moduleSlugs.length === 0) {
    console.warn('No module slugs found to prewarm.');
  }

  const paths = [];
  for (const slug of moduleSlugs) {
    paths.push(`/modules/${slug}`);
    paths.push(`/modules/${slug}/lessons`);
    for (let i = 1; i <= 3; i++) {
      paths.push(`/modules/${slug}/lessons/${i}`);
    }
    if (slug === 'programming-fundamentals') {
      paths.push('/programming');
      paths.push('/programming/lessons');
      for (let i = 1; i <= 3; i++) paths.push(`/programming/lessons/${i}`);
      paths.push('/programming/quiz');
    }
  }
  // Common utility routes
  paths.push('/sitemap.xml');

  console.log(`Prewarming ${paths.length} paths...`);
  for (const p of uniq(paths)) {
    await prewarmPath(FRONTEND_URL, p);
  }

  console.log('Prewarm completed.');
}

run().catch((e) => {
  console.error('Prewarm failed:', e);
  process.exit(1);
});