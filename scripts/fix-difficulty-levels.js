const fs = require('fs');
const path = require('path');

// Function to find all content files
function findContentFiles() {
  const contentDir = path.join(__dirname, '..', 'content');
  const files = [];
  
  // Find lesson files
  const lessonsDir = path.join(contentDir, 'lessons');
  if (fs.existsSync(lessonsDir)) {
    const lessonFiles = fs.readdirSync(lessonsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({ path: path.join(lessonsDir, file), type: 'lesson' }));
    files.push(...lessonFiles);
  }
  
  // Find quiz files
  const quizzesDir = path.join(contentDir, 'quizzes');
  if (fs.existsSync(quizzesDir)) {
    const quizFiles = fs.readdirSync(quizzesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({ path: path.join(quizzesDir, file), type: 'quiz' }));
    files.push(...quizFiles);
  }
  
  return files;
}

// Function to fix difficulty levels in a file
function fixDifficultyLevels(filePath, fileType) {
  console.log(`Processing ${path.basename(filePath)}...`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    
    const difficultyMap = {
      'Expert': 'Advanced',
      'Basic': 'Beginner'
    };
    
    if (fileType === 'lesson') {
      // For lesson files, check each lesson object
      if (Array.isArray(data)) {
        data.forEach((lesson, index) => {
          if (lesson.difficulty && difficultyMap[lesson.difficulty]) {
            console.log(`  Fixed lesson ${index + 1}: ${lesson.difficulty} -> ${difficultyMap[lesson.difficulty]}`);
            lesson.difficulty = difficultyMap[lesson.difficulty];
            modified = true;
          }
        });
      }
    } else if (fileType === 'quiz') {
      // For quiz files, check each question in the questions array
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
          if (question.difficulty && difficultyMap[question.difficulty]) {
            console.log(`  Fixed question ${index + 1}: ${question.difficulty} -> ${difficultyMap[question.difficulty]}`);
            question.difficulty = difficultyMap[question.difficulty];
            modified = true;
          }
        });
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  ✓ Updated ${path.basename(filePath)}`);
    } else {
      console.log(`  ✓ No changes needed for ${path.basename(filePath)}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`  ✗ Error processing ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

// Main function
function fixAllDifficultyLevels() {
  console.log('Fixing difficulty level inconsistencies in content files...\n');
  
  const contentFiles = findContentFiles();
  let totalModified = 0;
  
  for (const file of contentFiles) {
    if (fixDifficultyLevels(file.path, file.type)) {
      totalModified++;
    }
    console.log();
  }
  
  console.log(`\nCompleted! Modified ${totalModified} out of ${contentFiles.length} content files.`);
}

// Run the script
if (require.main === module) {
  fixAllDifficultyLevels();
}

module.exports = { fixAllDifficultyLevels, fixDifficultyLevels };