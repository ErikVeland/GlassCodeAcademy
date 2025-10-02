#!/usr/bin/env node

/**
 * Script to automatically fix lesson files by adding missing 'language' property to code examples
 */

const fs = require('fs');
const path = require('path');

// Get all lesson files
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));

console.log(`Found ${lessonFiles.length} lesson files to process...`);

// Process each lesson file
lessonFiles.forEach(file => {
  const filePath = path.join(lessonsDir, file);
  console.log(`Processing ${file}...`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lessons = JSON.parse(fileContent);
    
    // Check if it's an array of lessons or a single lesson object
    const isArrayOfLessons = Array.isArray(lessons);
    const lessonsToProcess = isArrayOfLessons ? lessons : [lessons];
    
    let modified = false;
    
    // Process each lesson
    lessonsToProcess.forEach(lesson => {
      if (lesson.code && !lesson.code.language) {
        // Determine language based on code content
        let language = 'javascript';
        
        // Check if it's actually TypeScript
        if (lesson.code.example && (lesson.code.example.includes('typescript') || lesson.code.example.includes('.ts'))) {
          language = 'typescript';
        }
        
        // Add the language property
        lesson.code.language = language;
        modified = true;
        console.log(`  Added language property to lesson ${lesson.id}`);
      }
    });
    
    // Write back to file if modified
    if (modified) {
      const output = isArrayOfLessons ? lessonsToProcess : lessonsToProcess[0];
      fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
      console.log(`  ✓ Updated ${file}`);
    } else {
      console.log(`  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${file}: ${error.message}`);
  }
});

console.log('Lesson file processing complete!');