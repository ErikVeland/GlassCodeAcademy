/**
 * Script to fix import paths in TypeScript files
 */

const fs = require('fs');
const path = require('path');

function fixImportPaths() {
  console.log('=== Fixing Import Paths ===\n');
  
  try {
    // Get all .tsx files in the app directory
    const appDir = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'app');
    const files = getAllTsxFiles(appDir);
    
    let fixedFiles = 0;
    
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      
      // Replace path aliases with relative paths
      // For files in app/[technology]/interview/page.tsx or app/[technology]/lessons/page.tsx
      // We need to go up 3 directories to reach src/
      newContent = newContent.replace(
        /from '@\/components\/TechnologyUtilizationBox'/g,
        "from '../../../components/TechnologyUtilizationBox'"
      );
      
      newContent = newContent.replace(
        /from '@\/components\/EnhancedLoadingComponent'/g,
        "from '../../../components/EnhancedLoadingComponent'"
      );
      
      // Write the updated content back to the file
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`  ✓ Fixed imports in ${path.relative(appDir, file)}`);
        fixedFiles++;
      }
    }
    
    console.log(`\n🎉 Fixed import paths in ${fixedFiles} files.`);
    console.log('\nNext steps:');
    console.log('1. Commit and push the changes to your repository');
    console.log('2. Trigger a new deployment on Render');
    console.log('3. Monitor the deployment logs for success');
    
  } catch (error) {
    console.error('❌ Error fixing import paths:', error.message);
    process.exit(1);
  }
}

function getAllTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(file));
    } else if (path.extname(file) === '.tsx') {
      results.push(file);
    }
  });
  
  return results;
}

// Run the script if executed directly
if (require.main === module) {
  fixImportPaths();
}

module.exports = { fixImportPaths };