// Test script to simulate quiz session creation
const fs = require('fs');
const path = require('path');

async function testQuizSession() {
  try {
    // Load the registry.json file
    const registryPath = path.join(__dirname, 'public', 'registry.json');
    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    
    // Find react-fundamentals module
    const mod = registryData.modules.find(m => m.slug === 'react-fundamentals');
    console.log('Module found:', mod?.slug);
    
    // Load the quiz questions
    const quizPath = path.join(__dirname, '../../content/quizzes/react-fundamentals.json');
    if (fs.existsSync(quizPath)) {
      const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
      const rawQuestions = quizData.questions || [];
      console.log('Raw questions loaded:', rawQuestions.length);
      
      // Simulate the sanitization process
      const sanitizedQuestions = rawQuestions.filter(q => {
        const hasQuestion = typeof q.question === 'string' && q.question.trim().length > 0;
        const hasChoices = Array.isArray(q.choices) && q.choices.length > 1;
        const hasCorrectAnswer = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0;
        const hasAcceptedAnswers = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0;
        return hasQuestion && (hasChoices && hasCorrectAnswer || hasAcceptedAnswers);
      });
      
      console.log('Sanitized questions:', sanitizedQuestions.length);
      
      // Simulate deduplication
      const seen = new Set();
      const dedupedQuestions = sanitizedQuestions.filter(q => {
        const key = `${q.id}:${q.question}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      console.log('Deduped questions:', dedupedQuestions.length);
      
      // Calculate desired count
      const desiredCount = (
        mod?.metadata?.thresholds?.minQuizQuestions ??
        mod?.thresholds?.requiredQuestions ??
        14
      );
      
      console.log('Desired count:', desiredCount);
      
      // Simulate selection
      const targetQuestions = Math.min(desiredCount, dedupedQuestions.length);
      console.log('Target questions:', targetQuestions);
      
      // Show first few questions that would be selected
      console.log('\nFirst 5 questions that would be available for selection:');
      dedupedQuestions.slice(0, 5).forEach((q, i) => {
        console.log(`  ${i + 1}. ID: ${q.id}, Question: ${q.question?.substring(0, 60)}...`);
        console.log(`     Type: ${q.type || 'inferred'}, Choices: ${q.choices?.length || 0}`);
      });
      
    } else {
      console.log('Quiz file not found at:', quizPath);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuizSession();