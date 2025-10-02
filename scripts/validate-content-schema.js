#!/usr/bin/env node

/**
 * Content Schema Validation Script
 * Validates all lesson and quiz JSON files against their respective schemas
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Define schemas for lessons and quizzes
const lessonSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["id", "moduleSlug", "title", "order", "objectives", "intro", "code", "pitfalls", "exercises", "estimatedMinutes", "difficulty"],
    properties: {
      id: { type: "string" },
      moduleSlug: { type: "string" },
      title: { type: "string" },
      order: { type: "integer" },
      objectives: {
        type: "array",
        items: { type: "string" }
      },
      intro: { type: "string" },
      code: {
        type: "object",
        required: ["example", "explanation", "language"],
        properties: {
          example: { type: "string" },
          explanation: { type: "string" },
          language: { type: "string" }
        }
      },
      pitfalls: {
        type: "array",
        items: {
          type: "object",
          required: ["mistake", "solution", "severity"],
          properties: {
            mistake: { type: "string" },
            solution: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] }
          }
        }
      },
      exercises: {
        type: "array",
        items: {
          type: "object",
          required: ["title", "description", "checkpoints"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            checkpoints: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      estimatedMinutes: { type: "integer" },
      difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
      tags: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
};

const quizSchema = {
  type: "object",
  required: ["moduleSlug", "title", "description", "totalQuestions", "passingScore", "timeLimit", "questions"],
  properties: {
    moduleSlug: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    totalQuestions: { type: "integer" },
    passingScore: { type: "integer" },
    timeLimit: { type: "integer" },
    questions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "question", "topic", "difficulty", "choices", "correctIndex", "explanation", "industryContext", "tags", "questionType", "estimatedTime"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
          choices: {
            type: "array",
            items: { type: "string" }
          },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
          industryContext: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" }
          },
          questionType: { type: "string", enum: ["multiple-choice", "open-ended"] },
          estimatedTime: { type: "integer" }
        }
      }
    }
  }
};

// Compile schemas
const validateLesson = ajv.compile(lessonSchema);
const validateQuiz = ajv.compile(quizSchema);

// Function to validate a single file
function validateFile(filePath, validator, fileType) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    const valid = validator(jsonData);
    if (!valid) {
      console.log(`❌ ${fileType} validation failed for ${filePath}:`);
      validator.errors.forEach(error => {
        console.log(`   - ${error.instancePath || 'root'} ${error.message}`);
      });
      return false;
    } else {
      console.log(`✅ ${fileType} validation passed for ${filePath}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main validation function
function validateAllContent() {
  console.log('Starting content schema validation...\n');
  
  let totalFiles = 0;
  let passedFiles = 0;
  let failedFiles = 0;
  
  // Validate lesson files
  const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
  const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));
  
  console.log('Validating lesson files...\n');
  lessonFiles.forEach(file => {
    totalFiles++;
    const filePath = path.join(lessonsDir, file);
    if (validateFile(filePath, validateLesson, 'Lesson')) {
      passedFiles++;
    } else {
      failedFiles++;
    }
  });
  
  console.log('\nValidating quiz files...\n');
  // Validate quiz files
  const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
  const quizFiles = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));
  
  quizFiles.forEach(file => {
    totalFiles++;
    const filePath = path.join(quizzesDir, file);
    if (validateFile(filePath, validateQuiz, 'Quiz')) {
      passedFiles++;
    } else {
      failedFiles++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Validation Summary:`);
  console.log(`Total files: ${totalFiles}`);
  console.log(`Passed: ${passedFiles}`);
  console.log(`Failed: ${failedFiles}`);
  
  if (failedFiles > 0) {
    console.log('\n⚠️  Some files failed validation. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All files passed validation!');
    process.exit(0);
  }
}

// Run validation
validateAllContent();