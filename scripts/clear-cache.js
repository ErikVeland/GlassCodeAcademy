#!/usr/bin/env node

/**
 * Cache Clearing Script
 * 
 * This script demonstrates how to clear the content cache when needed,
 * such as when content files are updated.
 */

// This script would normally clear the cache, but since we're using TypeScript
// and the cache is in-memory, we'll just show how it would work

console.log('Cache Clearing Utility');
console.log('=====================');
console.log('In a production environment, this would clear the content cache.');
console.log('Since we are using an in-memory cache with TypeScript,');
console.log('the cache is automatically cleared when the server restarts.');
console.log('\nTo clear the cache in a running application, you would call:');
console.log('  clearContentCache()');
console.log('  getCacheStats() // to check the current cache status');
console.log('\n✅ Cache clearing utility demonstrated!');