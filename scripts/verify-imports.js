/**
 * Script to verify that all import paths have been fixed
 */

const fs = require('fs');
const path = require('path');

function verifyImportPaths() {
  console.log('=== Verifying Import Paths ===\n');
  
  try {
    // Get all .tsx files in the app directory
    const appDir = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'app');
    const files = getAllTsxFiles(appDir);
    
    let issuesFound = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if the file still contains the problematic imports
      if (content.includes("from '@/components/")) {
        console.log(`  ✗ Found unresolved path alias in ${path.relative(appDir, file)}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes("from '@/components/")) {
            console.log(`    Line ${index + 1}: ${line.trim()}`);
          }
        });
        issuesFound++;
      }
    }
    
    if (issuesFound === 0) {
      console.log('🎉 All import paths have been successfully fixed!');
      console.log('\nYour application should now build correctly in Docker environments.');
    } else {
      console.log(`\n❌ Found ${issuesFound} files with unresolved path aliases.`);
      console.log('Please fix these imports manually before deploying.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying import paths:', error.message);
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
  verifyImportPaths();
}

module.exports = { verifyImportPaths };