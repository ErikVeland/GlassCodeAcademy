#!/usr/bin/env node
// Utility script to flush Redis cache used by the backend
// Ensures fresh reads after content reseeding or structural changes

const path = require('path');

// Load environment from backend-node/.env if present
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {}

const cacheService = require('../src/services/cacheService');

async function main() {
  try {
    if (!cacheService || cacheService.isEnabled !== true) {
      console.log(
        'Redis caching is disabled or unavailable. Nothing to flush.'
      );
      process.exit(0);
    }

    const ok = await cacheService.flushAll();
    if (ok) {
      console.log('✅ Redis cache flushed successfully');
    } else {
      console.log('⚠️  Redis cache flush reported failure');
    }

    await cacheService.close();
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('❌ Error flushing Redis cache:', err?.message || err);
    try {
      await cacheService.close();
    } catch {}
    process.exit(1);
  }
}

main();
