#!/usr/bin/env node

/**
 * Script to fix JSON parsing errors in lesson files
 * Escapes backslashes in code examples that cause JSON parsing issues
 */

const fs = require('fs');
const path = require('path');

// Get all lesson files from content/lessons directory
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
let lessonFiles = [];
if (fs.existsSync(lessonsDir)) {
  lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));
}

// Get all JSON files from backend Data directory
const dataDir = path.join(__dirname, '..', 'glasscode', 'backend', 'Data');
let dataFiles = [];
if (fs.existsSync(dataDir)) {
  dataFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
}

const allFiles = [
  ...lessonFiles.map(file => ({ path: path.join(lessonsDir, file), name: file })),
  ...dataFiles.map(file => ({ path: path.join(dataDir, file), name: file }))
];

console.log('Found ' + allFiles.length + ' JSON files to process...');

// Process each file
allFiles.forEach(fileInfo => {
  const filePath = fileInfo.path;
  const fileName = fileInfo.name;
  console.log('Processing ' + fileName + '...');
  
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
    
    // Fix the specific issue we found with backslashes in code examples
    // We need to be very careful here to not over-escape
    
    // First, let's handle the specific case where we have unescaped quotes in code examples
    // This is a common issue with JavaScript code in JSON strings
    
    // Temporarily replace escaped quotes to avoid confusion
    fixedContent = fixedContent.replace(/\\"/g, '__TEMP_ESCAPED_QUOTE__');
    
    // Fix unescaped backslashes that are not part of valid escape sequences
    // This regex looks for backslashes that are not followed by valid escape characters
    fixedContent = fixedContent.replace(/\\(?![nrtbfv\\"'\\/])/g, '\\\\');
    
    // Restore the escaped quotes
    fixedContent = fixedContent.replace(/__TEMP_ESCAPED_QUOTE__/g, '\\"');
    
    // Try to parse the fixed content
    try {
      JSON.parse(fixedContent);
      // If successful, write the fixed content back to file
      fs.writeFileSync(filePath, fixedContent);
      console.log('  ✓ Successfully fixed and updated ' + fileName);
    } catch (fixError) {
      console.error('  ❌ Failed to fix ' + fileName + ': ' + fixError.message);
      // Show a snippet of the problematic area
      const errorMatch = fixError.message.match(/position (\d+)/);
      if (errorMatch) {
        const pos = parseInt(errorMatch[1]);
        const start = Math.max(0, pos - 50);
        const end = Math.min(fixedContent.length, pos + 50);
        console.error('  Context: ...' + fixedContent.substring(start, end) + '...');
      }
    }
  } catch (error) {
    console.error('  ❌ Error processing ' + fileName + ': ' + error.message);
  }
});

console.log('JSON error fixing complete!');