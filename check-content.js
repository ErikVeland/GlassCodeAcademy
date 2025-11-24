import { Course, Module, Lesson, Quiz, initializeAssociations } from './apps/api/src/models/index.js';

async function checkContent() {
  try {
    // Initialize associations
    initializeAssociations();
    
    console.log('Checking content counts...');
    
    // Get counts
    const courseCount = await Course.count();
    const moduleCount = await Module.count();
    const lessonCount = await Lesson.count();
    const quizCount = await Quiz.count();
    
    console.log(`Courses: ${courseCount}`);
    console.log(`Modules: ${moduleCount}`);
    console.log(`Lessons: ${lessonCount}`);
    console.log(`Quizzes: ${quizCount}`);
    
    // Get a sample of quizzes to see the data
    console.log('\nSample quizzes:');
    const sampleQuizzes = await Quiz.findAll({
      limit: 3,
      order: [['id', 'ASC']],
      attributes: ['id', 'question', 'lesson_id']
    });
    
    sampleQuizzes.forEach(quiz => {
      console.log(`  Quiz ${quiz.id}: ${quiz.question ? quiz.question.substring(0, 50) + '...' : 'No question'}`);
      console.log(`    Lesson ID: ${quiz.lesson_id}`);
    });
    
    // Check lessons with quizzes
    console.log('\nLessons with quiz counts:');
    const lessonsWithQuizzes = await Lesson.findAll({
      include: [{
        model: Quiz,
        as: 'quizzes',
        attributes: ['id']
      }]
    });
    
    console.log(`Total lessons: ${lessonsWithQuizzes.length}`);
    const lessonsWithQuizData = lessonsWithQuizzes.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      quizCount: lesson.quizzes ? lesson.quizzes.length : 0
    }));
    
    // Show lessons with quizzes
    lessonsWithQuizData
      .filter(l => l.quizCount > 0)
      .slice(0, 5)
      .forEach(lesson => {
        console.log(`  Lesson ${lesson.id} (${lesson.title}): ${lesson.quizCount} quizzes`);
      });
      
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkContent();