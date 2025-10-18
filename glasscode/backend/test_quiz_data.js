const fs = require('fs');
const path = require('path');

// Test script to verify quiz data can be loaded
const quizFile = path.join(__dirname, '..', '..', 'content', 'quizzes', 'programming-fundamentals.json');

console.log('Testing quiz data loading...');
console.log('Quiz file path:', quizFile);

if (fs.existsSync(quizFile)) {
    console.log('✅ Quiz file exists');
    
    try {
        const quizData = JSON.parse(fs.readFileSync(quizFile, 'utf8'));
        console.log('✅ Quiz file is valid JSON');
        console.log('Number of questions:', quizData.questions ? quizData.questions.length : 0);
        
        if (quizData.questions && quizData.questions.length > 0) {
            console.log('✅ Quiz contains questions');
            console.log('First question:', quizData.questions[0].question);
            console.log('Question type:', quizData.questions[0].type);
            console.log('Choices:', quizData.questions[0].choices ? quizData.questions[0].choices.length : 0);
        } else {
            console.log('❌ No questions found in quiz file');
        }
    } catch (error) {
        console.log('❌ Error parsing quiz file:', error.message);
    }
} else {
    console.log('❌ Quiz file does not exist');
}