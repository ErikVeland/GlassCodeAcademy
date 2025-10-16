const fs = require('fs');
const path = require('path');

// Function to find all quiz files
function findQuizFiles() {
  const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
  const files = fs.readdirSync(quizzesDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(quizzesDir, file));
}

// Function to fix missing questionType fields
function fixQuizFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    
    if (data.questions && Array.isArray(data.questions)) {
      data.questions.forEach((question, index) => {
        // If question has choices but no questionType, it should be multiple-choice
        if (question.choices && Array.isArray(question.choices) && !question.questionType) {
          question.questionType = 'multiple-choice';
          modified = true;
          console.log(`  Fixed question ${index + 1}: Added questionType = 'multiple-choice'`);
        }
        
        // If question has no choices and no questionType, it might be open-ended
        if (!question.choices && !question.questionType) {
          question.questionType = 'open-ended';
          modified = true;
          console.log(`  Fixed question ${index + 1}: Added questionType = 'open-ended'`);
        }
      });
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
function fixAllQuizFiles() {
  console.log('Fixing missing questionType fields in quiz files...\n');
  
  const quizFiles = findQuizFiles();
  let totalModified = 0;
  
  for (const filePath of quizFiles) {
    if (fixQuizFile(filePath)) {
      totalModified++;
    }
    console.log();
  }
  
  console.log(`\nCompleted! Modified ${totalModified} out of ${quizFiles.length} quiz files.`);
}

// Run the script
if (require.main === module) {
  fixAllQuizFiles();
}

module.exports = { fixAllQuizFiles, fixQuizFile };