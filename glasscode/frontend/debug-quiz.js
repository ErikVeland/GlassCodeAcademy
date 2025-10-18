// Debug script to test quiz question selection
const fs = require('fs');
const path = require('path');

async function testQuizSelection() {
  try {
    // Load the registry.json file
    const registryPath = path.join(__dirname, 'public', 'registry.json');
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    
    // Find react-fundamentals module
    const module = registryData.modules.find(m => m.slug === 'react-fundamentals');
    console.log('Module found:', module?.slug);
    console.log('Module metadata:', module?.metadata);
    console.log('Module thresholds:', module?.thresholds);
    
    // Calculate desired count like the frontend does
    const desiredCount = (
      module?.metadata?.thresholds?.minQuizQuestions ??
      module?.thresholds?.requiredQuestions ??
      14
    );
    console.log('Desired count:', desiredCount);
    
    // Load the quiz questions
    const quizPath = path.join(__dirname, '../../content/quizzes/react-fundamentals.json');
    if (fs.existsSync(quizPath)) {
      const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
      console.log('Total questions in quiz file:', quizData.questions?.length || 0);
      
      // Show first few questions
      if (quizData.questions && quizData.questions.length > 0) {
        console.log('First 3 questions:');
        quizData.questions.slice(0, 3).forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.question?.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('Quiz file not found at:', quizPath);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuizSelection();