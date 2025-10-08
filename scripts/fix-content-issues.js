#!/usr/bin/env node

/**
 * Script to fix JSON parsing errors and placeholder content in lesson and quiz files
 */

const fs = require('fs');
const path = require('path');

// Function to fix JSON content
function fixJSONContent(content) {
  // Fix common JSON issues in code examples
  let fixedContent = content;
  
  // Fix template literals in JavaScript code (backticks and ${} expressions)
  fixedContent = fixedContent.replace(/`/g, '\\`');
  fixedContent = fixedContent.replace(/\$\{/g, '\\\${');
  
  // Fix unescaped backslashes that are not part of valid escape sequences
  fixedContent = fixedContent.replace(/\\(?![nrtbfv\\"'\\/u0-9])/g, '\\\\');
  
  // Fix other common escape issues
  fixedContent = fixedContent.replace(/\u0000/g, ''); // Remove null characters
  fixedContent = fixedContent.replace(/\u0001/g, ''); // Remove start of heading characters
  
  return fixedContent;
}

// Function to fix placeholder content in quiz files
function fixPlaceholderContent(questions) {
  // Common patterns for placeholder content
  const placeholderPatterns = [
    /Option [A-D] - Placeholder answer/i,
    /This question tests understanding of .* concepts/i,
    /The correct answer demonstrates proper implementation of .* principles/i,
    /Review the lesson materials for detailed explanations/i,
    /In professional development, understanding .* is crucial/i
  ];
  
  let modified = false;
  
  questions.forEach((question, index) => {
    let questionModified = false;
    
    // Check if this is a placeholder question
    const isPlaceholder = placeholderPatterns.some(pattern => 
      question.choices && question.choices.some(choice => pattern.test(choice))
    );
    
    if (isPlaceholder) {
      console.log(`  Found placeholder question: ${question.id}`);
      
      // Replace with more realistic content based on the topic
      switch(question.topic.toLowerCase()) {
        case 'html5':
        case 'html':
          question.choices = [
            "Use semantic HTML elements like <header>, <nav>, <main>, <article>, <section>, and <footer>",
            "Use generic <div> elements for all content sections",
            "Use only <table> elements for page layout",
            "Use <font> tags to style all text elements"
          ];
          question.correctIndex = 0;
          question.explanation = "Semantic HTML elements provide meaning and structure to web content, making it more accessible to screen readers and search engines. Generic <div> elements provide no semantic value, while <table> elements should only be used for tabular data, not layout. <font> tags are deprecated and should be replaced with CSS for styling.";
          question.industryContext = "Semantic HTML improves accessibility and SEO, which are critical for modern web applications. Major tech companies like Google prioritize semantic markup in their search algorithms.";
          questionModified = true;
          break;
          
        case 'css3':
        case 'css':
          question.choices = [
            "Use Flexbox for one-dimensional layouts and Grid for two-dimensional layouts",
            "Use floats for all modern layouts",
            "Use tables for page layout",
            "Use absolute positioning for all elements"
          ];
          question.correctIndex = 0;
          question.explanation = "Modern CSS layout systems like Flexbox and Grid provide more powerful and flexible layout capabilities than older techniques like floats. Flexbox is ideal for one-dimensional layouts (rows or columns), while Grid excels at two-dimensional layouts (rows and columns together).";
          question.industryContext = "CSS Grid and Flexbox are the standard layout systems in modern web development. They're supported by all major browsers and are essential for creating responsive, maintainable layouts.";
          questionModified = true;
          break;
          
        case 'javascript':
        case 'js':
          question.choices = [
            "Use const for variables that won't be reassigned and let for variables that will be reassigned",
            "Use var for all variable declarations",
            "Use global variables for all data sharing",
            "Never declare variables, just use them directly"
          ];
          question.correctIndex = 0;
          question.explanation = "ES6 introduced const and let which provide block scoping and better variable management than the older var keyword. const prevents reassignment, making code more predictable, while let allows reassignment when needed. Both avoid the hoisting issues associated with var.";
          question.industryContext = "Modern JavaScript development relies on const and let for variable declarations. This is a fundamental best practice that improves code reliability and maintainability in large applications.";
          questionModified = true;
          break;
          
        default:
          // For other topics, create more generic but realistic questions
          if (question.question.toLowerCase().includes('primary purpose')) {
            question.choices = [
              `To provide ${question.topic} functionality in web applications`,
              "To complicate the development process",
              "To replace all other programming languages",
              "To make applications slower and less secure"
            ];
            question.correctIndex = 0;
            question.explanation = `The primary purpose of ${question.topic} is to provide specific functionality that enhances web applications. Understanding when and how to use ${question.topic} effectively is crucial for professional development.`;
            question.industryContext = `In professional development, ${question.topic} plays a critical role in building scalable and maintainable applications. Mastery of ${question.topic} is essential for modern web developers.`;
            questionModified = true;
          }
          break;
      }
      
      if (questionModified) {
        modified = true;
        console.log(`  Fixed placeholder question: ${question.id}`);
      }
    }
  });
  
  return modified;
}

// Process lesson files
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));

console.log('Processing ' + lessonFiles.length + ' lesson files...');

lessonFiles.forEach(file => {
  const filePath = path.join(lessonsDir, file);
  console.log('Processing ' + file + '...');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Try to parse the JSON
    let lessons;
    try {
      lessons = JSON.parse(fileContent);
    } catch (parseError) {
      console.log('  Found JSON parsing error, attempting to fix...');
      
      // Fix the content
      const fixedContent = fixJSONContent(fileContent);
      
      // Try to parse again
      try {
        lessons = JSON.parse(fixedContent);
        // If successful, write the fixed content back to file
        fs.writeFileSync(filePath, fixedContent);
        console.log('  ✓ Successfully fixed and updated ' + file);
      } catch (fixError) {
        console.error('  ❌ Failed to fix ' + file + ': ' + fixError.message);
        return;
      }
    }
    
    console.log('  ✓ Valid JSON, no changes needed');
  } catch (error) {
    console.error('  ❌ Error processing ' + file + ': ' + error.message);
  }
});

// Process quiz files
const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
const quizFiles = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));

console.log('\nProcessing ' + quizFiles.length + ' quiz files...');

quizFiles.forEach(file => {
  const filePath = path.join(quizzesDir, file);
  console.log('Processing ' + file + '...');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON
    let quiz;
    try {
      quiz = JSON.parse(fileContent);
    } catch (parseError) {
      console.log('  Found JSON parsing error, attempting to fix...');
      
      // Fix the content
      const fixedContent = fixJSONContent(fileContent);
      
      // Try to parse again
      try {
        quiz = JSON.parse(fixedContent);
        // If successful, write the fixed content back to file
        fs.writeFileSync(filePath, fixedContent);
        console.log('  ✓ Successfully fixed and updated ' + file);
      } catch (fixError) {
        console.error('  ❌ Failed to fix ' + file + ': ' + fixError.message);
        return;
      }
    }
    
    // Fix placeholder content if it exists
    if (quiz.questions && Array.isArray(quiz.questions)) {
      const modified = fixPlaceholderContent(quiz.questions);
      
      if (modified) {
        // Write the updated quiz back to file
        fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
        console.log('  ✓ Updated placeholder content in ' + file);
      } else {
        console.log('  No placeholder content found in ' + file);
      }
    }
  } catch (error) {
    console.error('  ❌ Error processing ' + file + ': ' + error.message);
  }
});

console.log('\nContent fixing complete!');