#!/usr/bin/env node

/**
 * Script to fix JSON parsing errors in lesson files
 * Escapes backslashes in code examples that cause JSON parsing issues
 */

const fs = require('fs');
const path = require('path');

// Get all lesson files
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));

console.log('Found ' + lessonFiles.length + ' lesson files to process...');

// Process each lesson file
lessonFiles.forEach(file => {
  const filePath = path.join(lessonsDir, file);
  console.log('Processing ' + file + '...');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's valid JSON first
    try {
      JSON.parse(fileContent);
      console.log('  ✓ Already valid JSON, no changes needed');
      return;
    } catch (parseError) {
      console.log('  Found JSON parsing error, attempting to fix...');
    }
    
    // Fix common JSON issues
    let fixedContent = fileContent;
    
    // Fix unescaped backslashes in code examples
    // This is a bit tricky because we need to be careful not to over-escape
    // We'll look for patterns that commonly cause issues
    
    // Fix the specific issue we found with backslashes in HTML
    fixedContent = fixedContent.replace(/\\n/g, '\\\\n');
    fixedContent = fixedContent.replace(/\\t/g, '\\\\t');
    fixedContent = fixedContent.replace(/\\r/g, '\\\\r');
    fixedContent = fixedContent.replace(/\\'/g, "\\'");
    fixedContent = fixedContent.replace(/\\"/g, '\\"');
    
    // More careful approach - fix unescaped backslashes that are not part of escape sequences
    // This regex looks for backslashes that are not followed by valid escape characters
    fixedContent = fixedContent.replace(/\\(?![nrtbfv\\"'\\/])/g, '\\\\');
    
    // Try to parse the fixed content
    try {
      JSON.parse(fixedContent);
      // If successful, write the fixed content back to file
      fs.writeFileSync(filePath, fixedContent);
      console.log('  ✓ Successfully fixed and updated ' + file);
    } catch (fixError) {
      console.error('  ❌ Failed to fix ' + file + ': ' + fixError.message);
      console.error('  Original error was: ' + parseError.message);
    }
  } catch (error) {
    console.error('  ❌ Error processing ' + file + ': ' + error.message);
  }
});

console.log('JSON error fixing complete!');