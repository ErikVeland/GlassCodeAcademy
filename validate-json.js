const fs = require('fs');
const path = require('path');

// Validate all JSON files in the content directory
const contentDir = path.join(__dirname, 'content');
const lessonsDir = path.join(contentDir, 'lessons');
const quizzesDir = path.join(contentDir, 'quizzes');

function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch (error) {
    console.error(`Invalid JSON in ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('Validating JSON files...\n');

// Validate lesson files
console.log('=== Lessons ===');
const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
let validLessons = 0;
for (const file of lessonFiles) {
  const filePath = path.join(lessonsDir, file);
  if (validateJsonFile(filePath)) {
    validLessons++;
  }
}

console.log(`\nValid lessons: ${validLessons}/${lessonFiles.length}`);

// Validate quiz files
console.log('\n=== Quizzes ===');
const quizFiles = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
let validQuizzes = 0;
for (const file of quizFiles) {
  const filePath = path.join(quizzesDir, file);
  if (validateJsonFile(filePath)) {
    validQuizzes++;
  }
}

console.log(`\nValid quizzes: ${validQuizzes}/${quizFiles.length}`);
console.log(`\nTotal valid: ${validLessons + validQuizzes}/${lessonFiles.length + quizFiles.length}`);