/**
 * Data Structure Validator
 * Validates that all module data files follow the shared data structure
 */

const fs = require('fs');
const path = require('path');

// Define the expected structures based on C# BaseLesson and BaseInterviewQuestion models
const lessonStructure = {
  id: 'number', // Changed to match C# BaseLesson.Id (int?)
  moduleSlug: 'string',
  title: 'string',
  order: 'number',
  objectives: 'array',
  intro: 'string',
  code: 'object', // CodeExample object
  pitfalls: 'array', // Array of Pitfall objects
  exercises: 'array', // Array of Exercise objects
  next: 'array', // Array of strings
  estimatedMinutes: 'number',
  difficulty: 'string',
  tags: 'array',
  lastUpdated: 'string', // Optional
  version: 'string', // Optional
  sources: 'array', // Optional array of Source objects
  topic: 'string', // Optional
  description: 'string', // Optional
  codeExample: 'string', // Optional
  output: 'string' // Optional
};

const questionStructure = {
  id: 'number', // Changed to match C# BaseInterviewQuestion.Id (int?)
  topic: 'string',
  type: 'string', // Matches C# Type property
  question: 'string',
  choices: 'array', // Array of strings (matches C# string[])
  correctAnswer: 'number', // Changed from correctIndex to match C# CorrectAnswer (int?)
  explanation: 'string',
  difficulty: 'string',
  industryContext: 'string',
  tags: 'array', // Array of strings (matches C# string[])
  questionType: 'string',
  estimatedTime: 'number',
  sources: 'array' // Array of Source objects
};

// Valid difficulty levels
const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];

// Valid question types
const validQuestionTypes = ['multiple-choice', 'true-false', 'coding', 'open-ended'];

// Define required vs optional fields based on C# models
const requiredLessonFields = ['id', 'moduleSlug', 'title', 'order', 'objectives', 'intro', 'code', 'pitfalls', 'exercises', 'next', 'estimatedMinutes', 'difficulty', 'tags'];
const optionalLessonFields = ['lastUpdated', 'version', 'sources', 'topic', 'description', 'codeExample', 'output'];

// Define required and optional fields based on C# BaseInterviewQuestion
// Note: In C# all fields are nullable, but we'll require core fields for data integrity
const requiredQuestionFields = ['id', 'question'];
const optionalQuestionFields = ['topic', 'type', 'explanation', 'difficulty', 'industryContext', 'tags', 'questionType', 'estimatedTime', 'sources', 'choices', 'correctAnswer'];

// Function to validate nested objects
function validateNestedObject(obj, expectedFields, objectName) {
  const errors = [];
  for (const field of expectedFields) {
    if (obj[field] === undefined) {
      errors.push(`${objectName} missing field: ${field}`);
    }
  }
  return errors;
}

// Function to validate a single item against a structure
function validateItem(item, structure, fileName) {
  const errors = [];
  const isLesson = structure === lessonStructure;
  const requiredFields = isLesson ? requiredLessonFields : requiredQuestionFields;
  const optionalFields = isLesson ? optionalLessonFields : optionalQuestionFields;
  
  // Check required fields exist
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    
    // Check field type
    const expectedType = structure[field];
    if (expectedType === 'array') {
      if (!Array.isArray(item[field])) {
        errors.push(`Field ${field} should be an array, got ${typeof item[field]}`);
      }
    } else if (expectedType === 'number') {
      if (typeof item[field] !== 'number') {
        errors.push(`Field ${field} should be a number, got ${typeof item[field]}`);
      }
    } else if (expectedType === 'string') {
      if (typeof item[field] !== 'string') {
        errors.push(`Field ${field} should be a string, got ${typeof item[field]}`);
      }
    } else if (expectedType === 'object') {
      if (typeof item[field] !== 'object' || Array.isArray(item[field])) {
        errors.push(`Field ${field} should be an object, got ${typeof item[field]}`);
      }
    }
  }
  
  // Validate optional fields if present
  for (const field of optionalFields) {
    if (item[field] !== undefined && item[field] !== null) {
      const expectedType = structure[field];
      if (expectedType === 'array') {
        if (!Array.isArray(item[field])) {
          errors.push(`Optional field ${field} should be an array, got ${typeof item[field]}`);
        }
      } else if (expectedType === 'number') {
        if (typeof item[field] !== 'number') {
          errors.push(`Optional field ${field} should be a number, got ${typeof item[field]}`);
        }
      } else if (expectedType === 'string') {
        if (typeof item[field] !== 'string') {
          errors.push(`Optional field ${field} should be a string, got ${typeof item[field]}`);
        }
      }
    }
  }
  
  // Special validations for lessons
  if (isLesson) {
    // Validate code object structure
    if (item.code && typeof item.code === 'object') {
      const codeErrors = validateNestedObject(item.code, ['example', 'explanation', 'language'], 'Code object');
      errors.push(...codeErrors);
    }
    
    // Validate pitfalls array
    if (item.pitfalls && Array.isArray(item.pitfalls)) {
      item.pitfalls.forEach((pitfall, i) => {
        if (typeof pitfall === 'object') {
          const pitfallErrors = validateNestedObject(pitfall, ['mistake', 'solution', 'severity'], `Pitfall ${i}`);
          errors.push(...pitfallErrors);
        }
      });
    }
    
    // Validate exercises array
    if (item.exercises && Array.isArray(item.exercises)) {
      item.exercises.forEach((exercise, i) => {
        if (typeof exercise === 'object') {
          const exerciseErrors = validateNestedObject(exercise, ['title', 'description', 'checkpoints'], `Exercise ${i}`);
          errors.push(...exerciseErrors);
        }
      });
    }
    
    // Validate sources array if present
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((source, i) => {
        if (typeof source === 'object') {
          const sourceErrors = validateNestedObject(source, ['title', 'url'], `Source ${i}`);
          errors.push(...sourceErrors);
        }
      });
    }
  }
  
  // Special validations for questions
  if (!isLesson) {
    // Validate sources array
    if (item.sources && Array.isArray(item.sources)) {
      item.sources.forEach((source, i) => {
        if (typeof source === 'object') {
          const sourceErrors = validateNestedObject(source, ['title', 'url'], `Source ${i}`);
          errors.push(...sourceErrors);
        }
      });
    }
    
    // Check question type specific requirements
    const questionType = item.questionType || item.type;
    if (questionType === 'multiple-choice') {
      // Multiple choice questions need choices and correctAnswer
      if (!item.choices) {
        errors.push('Multiple choice questions require choices field');
      } else if (!Array.isArray(item.choices)) {
        errors.push('Field choices should be an array');
      } else if (item.choices.length !== 4) {
        errors.push(`Multiple choice questions should have exactly 4 choices, got ${item.choices.length}`);
      }

      if (item.correctAnswer === undefined || item.correctAnswer === null) {
        errors.push('Multiple choice questions require correctAnswer field');
      } else if (typeof item.correctAnswer !== 'number') {
        errors.push('Field correctAnswer should be a number');
      } else if (item.choices && (item.correctAnswer < 0 || item.correctAnswer >= item.choices.length)) {
        errors.push(`correctAnswer ${item.correctAnswer} is out of range`);
      }
    }
  }
  
  // Common validations
  if (item.difficulty && !validDifficulties.includes(item.difficulty)) {
    errors.push(`Invalid difficulty: ${item.difficulty}. Should be one of: ${validDifficulties.join(', ')}`);
  }
  
  if (item.questionType && !validQuestionTypes.includes(item.questionType)) {
    errors.push(`Invalid question type: ${item.questionType}. Should be one of: ${validQuestionTypes.join(', ')}`);
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
      // Handle both formats: array of questions or quiz object with questions array
      if (Array.isArray(data)) {
        // Direct array of questions format
        itemsToValidate = data;
      } else if (data && typeof data === 'object' && data.questions && Array.isArray(data.questions)) {
        // Quiz object format with questions array
        itemsToValidate = data.questions;
        
        // Validate totalQuestions if present
        if (data.totalQuestions !== undefined && data.totalQuestions !== data.questions.length) {
          errors.push(`Question count mismatch: expected ${data.totalQuestions}, got ${data.questions.length}`);
          return errors;
        }
      } else {
        errors.push('Quiz file should contain either an array of questions or an object with a questions array');
        return errors;
      }
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