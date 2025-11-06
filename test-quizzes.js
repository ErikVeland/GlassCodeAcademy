const { LessonQuiz } = require('./backend-node/src/models');

async function testQuizzes() {
  try {
    console.log('Testing quiz retrieval...');
    
    // Get a few quizzes to see the data
    const quizzes = await LessonQuiz.findAll({
      limit: 5,
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${quizzes.length} quizzes`);
    
    quizzes.forEach(quiz => {
      console.log(`Quiz ID: ${quiz.id}`);
      console.log(`Question: ${quiz.question.substring(0, 100)}...`);
      console.log(`Lesson ID: ${quiz.lesson_id}`);
      console.log('---');
    });
    
    // Test getting quizzes for a specific lesson
    if (quizzes.length > 0) {
      const lessonId = quizzes[0].lesson_id;
      console.log(`\nGetting quizzes for lesson ${lessonId}...`);
      
      const lessonQuizzes = await LessonQuiz.findAll({
        where: {
          lesson_id: lessonId
        }
      });
      
      console.log(`Found ${lessonQuizzes.length} quizzes for lesson ${lessonId}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuizzes();