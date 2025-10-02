#!/usr/bin/env node

/**
 * Script to automatically fix quiz files by adding missing 'questionType' property to questions
 */

const fs = require('fs');
const path = require('path');

// Get all quiz files
const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
const quizFiles = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));

console.log(`Found ${quizFiles.length} quiz files to process...`);

// Process each quiz file
quizFiles.forEach(file => {
  const filePath = path.join(quizzesDir, file);
  console.log(`Processing ${file}...`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const quiz = JSON.parse(fileContent);
    
    let modified = false;
    
    // Process each question
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach(question => {
        if (!question.questionType) {
          // Add the questionType property (default to multiple-choice)
          question.questionType = 'multiple-choice';
          modified = true;
          console.log(`  Added questionType property to question ${question.id}`);
        }
      });
    }
    
    // Write back to file if modified
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
      console.log(`  ✓ Updated ${file}`);
    } else {
      console.log(`  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${file}: ${error.message}`);
  }
});

console.log('Quiz file processing complete!');