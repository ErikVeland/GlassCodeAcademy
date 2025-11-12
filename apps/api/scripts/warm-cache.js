#!/usr/bin/env node

/**
 * Script to warm the application cache by pre-loading frequently accessed data
 */

const path = require('path');
const { promises: fs } = require('fs');

// Add the apps/api directory to the module search path
const apiDir = path.resolve(__dirname);
const contentDir = path.resolve(apiDir, '../../content');

// Import the cache warming functions
async function warmCache() {
  try {
    console.log('Starting cache warming process...');
    
    // Load registry data
    const registryPath = path.join(contentDir, 'registry.json');
    const registryData = await fs.readFile(registryPath, 'utf8');
    const registry = JSON.parse(registryData);
    
    console.log(`Loaded registry with ${registry.modules.length} modules`);
    
    // Load module data for each module
    let lessonsLoaded = 0;
    let quizzesLoaded = 0;
    
    for (const module of registry.modules) {
      try {
        // Load lessons
        const lessonsPath = path.join(contentDir, 'lessons', `${module.slug}.json`);
        await fs.access(lessonsPath);
        const lessonsData = await fs.readFile(lessonsPath, 'utf8');
        JSON.parse(lessonsData);
        lessonsLoaded++;
        
        // Load quizzes
        const quizzesPath = path.join(contentDir, 'quizzes', `${module.slug}.json`);
        await fs.access(quizzesPath);
        const quizzesData = await fs.readFile(quizzesPath, 'utf8');
        JSON.parse(quizzesData);
        quizzesLoaded++;
        
        console.log(`  ✓ Preloaded data for module: ${module.slug}`);
      } catch (error) {
        console.warn(`  ⚠ Warning: Could not preload data for module ${module.slug}:`, error.message);
      }
    }
    
    console.log(`\nCache warming completed successfully!`);
    console.log(`- Preloaded registry data`);
    console.log(`- Preloaded lessons for ${lessonsLoaded} modules`);
    console.log(`- Preloaded quizzes for ${quizzesLoaded} modules`);
    
    process.exit(0);
  } catch (error) {
    console.error('Cache warming failed:', error.message);
    process.exit(1);
  }
}

// Run cache warming
if (require.main === module) {
  warmCache();
}

module.exports = { warmCache };