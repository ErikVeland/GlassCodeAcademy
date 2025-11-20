const { Course, Module, Lesson, Quiz } = require('../../src/models');

async function checkMigrationStatus() {
  console.log('Checking migration status...');
  
  try {
    // Count records in each table
    const courseCount = await Course.count();
    const moduleCount = await Module.count();
    const lessonCount = await Lesson.count();
    const quizCount = await Quiz.count();
    
    console.log('Migration Status:');
    console.log(`- Courses: ${courseCount}`);
    console.log(`- Modules: ${moduleCount}`);
    console.log(`- Lessons: ${lessonCount}`);
    console.log(`- Quiz Questions: ${quizCount}`);
    
    // Show sample data
    if (courseCount > 0) {
      const sampleCourse = await Course.findOne();
      console.log(`\nSample Course: ${sampleCourse.title}`);
    }
    
    if (moduleCount > 0) {
      const sampleModule = await Module.findOne({ order: [['id', 'ASC']] });
      console.log(`Sample Module: ${sampleModule.title}`);
    }
    
    if (lessonCount > 0) {
      const sampleLesson = await Lesson.findOne({ order: [['id', 'ASC']] });
      console.log(`Sample Lesson: ${sampleLesson.title}`);
    }
    
    if (quizCount > 0) {
      const sampleQuiz = await Quiz.findOne({ order: [['id', 'ASC']] });
      console.log(`Sample Quiz Question: ${sampleQuiz.question.substring(0, 50)}...`);
    }
    
    console.log('\nMigration status check completed successfully!');
  } catch (error) {
    console.error('Error checking migration status:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkMigrationStatus();
}