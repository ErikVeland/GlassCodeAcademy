#!/usr/bin/env node

/**
 * Script to fix route structure to match specification requirements
 * All routes should be properly nested under /modules/[moduleSlug]
 */

const fs = require('fs');
const path = require('path');

// Get the registry file
const registryPath = path.join(__dirname, '..', 'content', 'registry.json');

try {
  // Read the registry
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  const registry = JSON.parse(registryContent);
  
  console.log('Fixing route structure for ' + registry.modules.length + ' modules...\n');
  
  // Fix routes for each module
  registry.modules.forEach(module => {
    const slug = module.slug;
    console.log('Fixing routes for: ' + slug);
    
    // Fix the routes to be properly nested
    if (module.routes) {
      // Overview route should be /modules/[moduleSlug]
      module.routes.overview = '/modules/' + slug;
      
      // Lessons route should be /modules/[moduleSlug]/lessons
      module.routes.lessons = '/modules/' + slug + '/lessons';
      
      // Quiz route should be /modules/[moduleSlug]/quiz
      module.routes.quiz = '/modules/' + slug + '/quiz';
      
      console.log('  Overview: ' + module.routes.overview);
      console.log('  Lessons: ' + module.routes.lessons);
      console.log('  Quiz: ' + module.routes.quiz);
    }
  });
  
  // Write the updated registry back to file
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  
  console.log('\n✅ Route structure fixed successfully!');
  console.log('Registry updated at: ' + registryPath);
  
} catch (error) {
  console.error('❌ Error fixing route structure: ' + error.message);
  process.exit(1);
}