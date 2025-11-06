const { Course, Module, Lesson, LessonQuiz } = require('./backend-node/src/models');
const { initializeAssociations } = require('./backend-node/src/models/index');

async function verifyContent() {
  try {
    // Initialize associations
    initializeAssociations();
    
    console.log('🔍 Verifying content structure...\n');
    
    // Get all courses
    const courses = await Course.findAll({
      include: [{
        model: Module,
        as: 'modules',
        include: [{
          model: Lesson,
          as: 'lessons',
          include: [{
            model: LessonQuiz,
            as: 'quizzes'
          }]
        }]
      }]
    });
    
    console.log(`📚 Total Courses: ${courses.length}`);
    
    let totalModules = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;
    
    courses.forEach(course => {
      const moduleCount = course.modules ? course.modules.length : 0;
      totalModules += moduleCount;
      
      console.log(`\n📘 Course: ${course.title} (${moduleCount} modules)`);
      
      if (course.modules) {
        course.modules.forEach(module => {
          const lessonCount = module.lessons ? module.lessons.length : 0;
          totalLessons += lessonCount;
          
          console.log(`  📙 Module: ${module.title} (${lessonCount} lessons)`);
          
          if (module.lessons) {
            module.lessons.forEach(lesson => {
              const quizCount = lesson.quizzes ? lesson.quizzes.length : 0;
              totalQuizzes += quizCount;
              
              console.log(`    📗 Lesson: ${lesson.title} (${quizCount} quizzes)`);
              
              // Show sample quizzes if they exist
              if (lesson.quizzes && lesson.quizzes.length > 0) {
                const sampleQuizzes = lesson.quizzes.slice(0, 2);
                sampleQuizzes.forEach(quiz => {
                  console.log(`      🧠 Quiz: ${quiz.question ? quiz.question.substring(0, 50) + '...' : 'No question'}`);
                });
                if (lesson.quizzes.length > 2) {
                  console.log(`      ... and ${lesson.quizzes.length - 2} more quizzes`);
                }
              }
            });
          }
        });
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Courses: ${courses.length}`);
    console.log(`  Modules: ${totalModules}`);
    console.log(`  Lessons: ${totalLessons}`);
    console.log(`  Quizzes: ${totalQuizzes}`);
    
    // Check for any orphaned content
    console.log('\n🔍 Checking for orphaned content...');
    
    const orphanedLessons = await Lesson.findAll({
      where: {
        module_id: null
      }
    });
    
    const orphanedQuizzes = await LessonQuiz.findAll({
      where: {
        lesson_id: null
      }
    });
    
    if (orphanedLessons.length > 0) {
      console.log(`⚠️  Found ${orphanedLessons.length} orphaned lessons`);
    } else {
      console.log('✅ No orphaned lessons found');
    }
    
    if (orphanedQuizzes.length > 0) {
      console.log(`⚠️  Found ${orphanedQuizzes.length} orphaned quizzes`);
    } else {
      console.log('✅ No orphaned quizzes found');
    }
    
    console.log('\n✅ Content verification completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying content:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyContent();