/**
 * Data Structure Validator
 * Validates that all module data files follow the shared data structure
 */

const fs = require('fs');
const path = require('path');

// Define the expected structures
const lessonStructure = {
  id: 'string', // Lessons use descriptive string IDs like "database-systems-lesson-1"
  moduleSlug: 'string',
  title: 'string',
  order: 'number',
  objectives: 'array',
  intro: 'string'
  // Note: lessons have more complex nested structures that we'll validate separately
};

const questionStructure = {
  id: 'number',
  topic: 'string',
  questionType: 'string', // Should be multiple-choice, true-false, coding, open-ended
  question: 'string',
  choices: 'array', // Optional for open-ended questions
  correctIndex: 'number', // Index of correct choice for multiple-choice, optional for open-ended
  explanation: 'string'
};

// Valid difficulty levels
const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];

// Valid question types
const validQuestionTypes = ['multiple-choice', 'true-false', 'coding', 'open-ended'];

// Function to validate a single item against a structure
function validateItem(item, structure, fileName) {
  const errors = [];
  
  // Check all required fields exist (except optional ones for open-ended questions)
  for (const [field, type] of Object.entries(structure)) {
    // Skip optional fields for open-ended questions
    if (item.questionType === 'open-ended' && (field === 'choices' || field === 'correctIndex')) {
      continue;
    }
    
    if (item[field] === undefined) {
      errors.push(`Missing field: ${field}`);
      continue;
    }
    
    // Check field type
    if (type === 'array') {
      if (!Array.isArray(item[field])) {
        errors.push(`Field ${field} should be an array, got ${typeof item[field]}`);
      }
    } else if (type === 'number') {
      if (typeof item[field] !== 'number') {
        errors.push(`Field ${field} should be a number, got ${typeof item[field]}`);
      }
    } else if (type === 'string') {
      if (typeof item[field] !== 'string') {
        errors.push(`Field ${field} should be a string, got ${typeof item[field]}`);
      }
    }
  }
  
  // Special validations
  if (item.difficulty && !validDifficulties.includes(item.difficulty)) {
    errors.push(`Invalid difficulty: ${item.difficulty}. Should be one of: ${validDifficulties.join(', ')}`);
  }
  
  if (item.questionType && !validQuestionTypes.includes(item.questionType)) {
    errors.push(`Invalid question type: ${item.questionType}. Should be one of: ${validQuestionTypes.join(', ')}`);
  }
  
  if (item.choices && item.correctIndex !== undefined) {
    if (item.correctIndex < 0 || item.correctIndex >= item.choices.length) {
      errors.push(`Invalid correctIndex: ${item.correctIndex}. Should be between 0 and ${item.choices.length - 1}`);
    }
  }
  
  return errors;
}

// Function to validate a JSON file
function validateJsonFile(filePath, structure) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = [];
    
    let itemsToValidate;
    
    // Handle different file structures
    if (filePath.includes('/quizzes/')) {
      // Quiz files have a wrapper object with a questions array
      if (typeof data !== 'object' || !data.questions || !Array.isArray(data.questions)) {
        errors.push('Quiz file should contain an object with a questions array');
        return errors;
      }
      itemsToValidate = data.questions;
    } else {
      // Lesson files are direct arrays
      if (!Array.isArray(data)) {
        errors.push('Lesson file should contain an array of items');
        return errors;
      }
      itemsToValidate = data;
    }
    
    itemsToValidate.forEach((item, index) => {
      const itemErrors = validateItem(item, structure, filePath);
      if (itemErrors.length > 0) {
        errors.push(`Item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });
    
    return errors;
  } catch (error) {
    return [`Invalid JSON: ${error.message}`];
  }
}

// Find all data files in content directory
function findAllDataFiles() {
  const contentDir = path.join(__dirname, '..', 'content');
  const dataFiles = [];
  
  // Check lessons directory
  const lessonsDir = path.join(contentDir, 'lessons');
  if (fs.existsSync(lessonsDir)) {
    const files = fs.readdirSync(lessonsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        dataFiles.push({
          module: file.replace('.json', ''),
          file,
          path: path.join(lessonsDir, file),
          type: 'lessons'
        });
      }
    }
  }
  
  // Check quizzes directory
  const quizzesDir = path.join(contentDir, 'quizzes');
  if (fs.existsSync(quizzesDir)) {
    const files = fs.readdirSync(quizzesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        dataFiles.push({
          module: file.replace('.json', ''),
          file,
          path: path.join(quizzesDir, file),
          type: 'quizzes'
        });
      }
    }
  }
  
  return dataFiles;
}

// Main validation function
function validateAllData() {
  console.log('Validating data structures across all content files...\n');
  
  const dataFiles = findAllDataFiles();
  let totalErrors = 0;
  
  for (const dataFile of dataFiles) {
    console.log(`Validating ${dataFile.type}/${dataFile.file}...`);
    
    let structure;
    if (dataFile.type === 'lessons') {
      structure = lessonStructure;
    } else if (dataFile.type === 'quizzes') {
      structure = questionStructure;
    } else {
      console.log('  Unknown file type, skipping...\n');
      continue;
    }
    
    const errors = validateJsonFile(dataFile.path, structure);
    
    if (errors.length === 0) {
      console.log('  ✓ Passed validation\n');
    } else {
      console.log('  ✗ Failed validation:');
      errors.forEach(error => console.log(`    - ${error}`));
      console.log();
      totalErrors += errors.length;
    }
  }
  
  if (totalErrors === 0) {
    console.log('All content files passed validation! 🎉');
    return true;
  } else {
    console.log(`Validation failed with ${totalErrors} errors.`);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const success = validateAllData();
  process.exit(success ? 0 : 1);
}

module.exports = {
  validateItem,
  validateJsonFile,
  lessonStructure,
  questionStructure
};