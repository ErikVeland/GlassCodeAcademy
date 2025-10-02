/**
 * Data Structure Validator
 * Validates that all module data files follow the shared data structure
 */

const fs = require('fs');
const path = require('path');

// Define the expected structures
const lessonStructure = {
  id: 'number',
  topic: 'string',
  title: 'string',
  description: 'string',
  content: 'string',
  codeExample: 'string',
  output: 'string',
  difficulty: 'string' // Should be Beginner, Intermediate, or Advanced
};

const questionStructure = {
  id: 'number',
  topic: 'string',
  type: 'string', // Should be multiple-choice, true-false, coding, etc.
  question: 'string',
  choices: 'array',
  correctAnswer: 'number', // Index of correct choice for multiple-choice
  explanation: 'string'
};

// Valid difficulty levels
const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];

// Valid question types
const validQuestionTypes = ['multiple-choice', 'true-false', 'coding'];

// Function to validate a single item against a structure
function validateItem(item, structure, fileName) {
  const errors = [];
  
  // Check all required fields exist
  for (const [field, type] of Object.entries(structure)) {
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
  
  if (item.type && !validQuestionTypes.includes(item.type)) {
    errors.push(`Invalid question type: ${item.type}. Should be one of: ${validQuestionTypes.join(', ')}`);
  }
  
  if (item.choices && item.correctAnswer !== undefined) {
    if (item.correctAnswer < 0 || item.correctAnswer >= item.choices.length) {
      errors.push(`Invalid correctAnswer index: ${item.correctAnswer}. Should be between 0 and ${item.choices.length - 1}`);
    }
  }
  
  return errors;
}

// Function to validate a JSON file
function validateJsonFile(filePath, structure) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = [];
    
    if (!Array.isArray(data)) {
      errors.push('File should contain an array of items');
      return errors;
    }
    
    data.forEach((item, index) => {
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

// Find all data files in modules
function findAllDataFiles() {
  const modulesDir = path.join(__dirname, '..', 'modules');
  const dataFiles = [];
  
  const modules = fs.readdirSync(modulesDir);
  
  for (const module of modules) {
    const modulePath = path.join(modulesDir, module);
    if (!fs.statSync(modulePath).isDirectory()) continue;
    
    // Look for data directories in backend folders
    const backendPath = path.join(modulePath, 'backend');
    if (fs.existsSync(backendPath) && fs.statSync(backendPath).isDirectory()) {
      const dataPath = path.join(backendPath, 'data');
      if (fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory()) {
        const files = fs.readdirSync(dataPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            dataFiles.push({
              module,
              file,
              path: path.join(dataPath, file)
            });
          }
        }
      }
    }
    
    // Also check for data directories directly in module root (for simpler modules)
    const dataPath = path.join(modulePath, 'data');
    if (fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory()) {
      const files = fs.readdirSync(dataPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          dataFiles.push({
            module,
            file,
            path: path.join(dataPath, file)
          });
        }
      }
    }
  }
  
  return dataFiles;
}

// Main validation function
function validateAllData() {
  console.log('Validating data structures across all modules...\n');
  
  const dataFiles = findAllDataFiles();
  let totalErrors = 0;
  
  for (const dataFile of dataFiles) {
    console.log(`Validating ${dataFile.module}/${dataFile.file}...`);
    
    let structure;
    if (dataFile.file.includes('lesson')) {
      structure = lessonStructure;
    } else if (dataFile.file.includes('question')) {
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
    console.log('All data files passed validation! 🎉');
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