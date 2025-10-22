const fetch = require('node-fetch');

async function testLessonData() {
  try {
    const response = await fetch('http://localhost:3000/api/content/lessons/programming-fundamentals');
    const lessons = await response.json();
    
    console.log('First lesson structure:');
    console.log(JSON.stringify(lessons[0], null, 2));
    
    // Check if the lesson has the expected properties
    const lesson = lessons[0];
    console.log('\nProperty checks:');
    console.log('- Has intro:', !!lesson.intro);
    console.log('- Has codeExample:', !!lesson.codeExample);
    console.log('- Has codeExplanation:', !!lesson.codeExplanation);
    console.log('- Has code:', !!lesson.code);
    console.log('- Has pitfalls:', Array.isArray(lesson.pitfalls));
    console.log('- Has exercises:', Array.isArray(lesson.exercises));
    console.log('- Has objectives:', Array.isArray(lesson.objectives));
    
  } catch (error) {
    console.error('Error fetching lesson data:', error);
  }
}

testLessonData();