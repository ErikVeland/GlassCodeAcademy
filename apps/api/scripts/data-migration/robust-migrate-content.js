const fs = require('fs').promises;
const path = require('path');
const { Course, Module, Lesson, Quiz } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

// Utility function to convert module data to course format
function convertModuleToCourse(moduleData) {
  return {
    title: moduleData.title,
    description: moduleData.description || '',
    slug: moduleData.slug,
    order: moduleData.order || 0,
    isPublished: moduleData.isPublished || false,
    difficulty: moduleData.difficulty || 'Beginner',
    estimatedHours: moduleData.estimatedHours || 0,
    category: moduleData.category || 'programming',
    technologies: moduleData.technologies || [],
    prerequisites: moduleData.prerequisites || [],
    metadata: moduleData.metadata || {},
    version: moduleData.version || '1.0.0'
  };
}

// Utility function to convert lesson data
function convertLessonData(lessonData, moduleId) {
  return {
    moduleId: moduleId,
    title: lessonData.title,
    slug: lessonData.slug,
    order: lessonData.order || 0,
    content: lessonData,
    metadata: lessonData.metadata || {},
    isPublished: lessonData.isPublished || false,
    difficulty: lessonData.difficulty || 'Beginner',
    estimatedMinutes: lessonData.estimatedMinutes || 0,
    version: lessonData.version || '1.0.0'
  };
}

// Utility function to convert quiz data
function convertQuizData(quizData, lessonId) {
  return {
    lessonId: lessonId,
    question: quizData.question,
    topic: quizData.topic || '',
    difficulty: quizData.difficulty || 'Beginner',
    choices: quizData.choices || [],
    fixedChoiceOrder: quizData.fixedChoiceOrder || false,
    choiceLabels: quizData.choiceLabels || {},
    acceptedAnswers: quizData.acceptedAnswers || [],
    explanation: quizData.explanation || '',
    industryContext: quizData.industryContext || '',
    tags: quizData.tags || [],
    questionType: quizData.questionType || 'multiple_choice',
    estimatedTime: quizData.estimatedTime || 0,
    correctAnswer: quizData.correctAnswer !== undefined ? quizData.correctAnswer : null,
    quizType: quizData.quizType || 'knowledge_check',
    sortOrder: quizData.sortOrder || 0,
    isPublished: quizData.isPublished || false,
    metadata: quizData.metadata || {},
    version: quizData.version || '1.0.0'
  };
}

async function migrateCoursesAndModules(registryData, transaction) {
  console.log('Starting migration of courses and modules...');
  
  // Create one course that contains all modules
  const courseData = {
    title: 'Full Stack Development Curriculum',
    description: 'Complete curriculum covering all aspects of full stack development',
    slug: 'full-stack-development',
    isPublished: true,
    order: 1,
    difficulty: 'Beginner',
    estimatedHours: 800,
    category: 'full-stack',
    technologies: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Next.js'],
    prerequisites: [],
    metadata: {
      version: '1.0.0'
    },
    version: '1.0.0'
  };
  
  const course = await Course.create(courseData, { transaction });
  console.log(`Created course: ${course.title}`);
  
  // Create modules
  const modules = [];
  for (const moduleData of registryData.modules) {
    const module = await Module.create({
      ...convertModuleToCourse(moduleData),
      courseId: course.id
    }, { transaction });
    modules.push(module);
    console.log(`Created module: ${module.title}`);
  }
  
  return { course, modules };
}

async function migrateLessons(modules, transaction) {
  console.log('Starting migration of lessons...');
  let lessonCount = 0;
  
  // Process each module
  for (const module of modules) {
    try {
      // Load lesson files for this module
      const moduleDir = path.join(__dirname, '..', '..', '..', 'content', 'modules', module.slug);
      const lessonsDir = path.join(moduleDir, 'lessons');
      
      try {
        const lessonFiles = await fs.readdir(lessonsDir);
        const jsonLessonFiles = lessonFiles.filter(file => file.endsWith('.json'));
        
        // Process each lesson file
        for (const lessonFile of jsonLessonFiles) {
          try {
            const lessonPath = path.join(lessonsDir, lessonFile);
            const lessonData = JSON.parse(await fs.readFile(lessonPath, 'utf8'));
            
            const lesson = await Lesson.create(convertLessonData(lessonData, module.id), { transaction });
            lessonCount++;
            console.log(`Created lesson: ${lesson.title}`);
          } catch (fileError) {
            console.error(`Error processing lesson file ${lessonFile}:`, fileError.message);
            // Continue with other lessons even if one fails
          }
        }
      } catch (dirError) {
        console.log(`No lessons directory found for module ${module.slug}, skipping...`);
      }
    } catch (moduleError) {
      console.error(`Error processing module ${module.slug}:`, moduleError.message);
      // Continue with other modules even if one fails
    }
  }
  
  console.log(`Migrated ${lessonCount} lessons`);
  return lessonCount;
}

async function migrateQuizzes(transaction) {
  console.log('Starting migration of quizzes...');
  let quizCount = 0;
  
  // Get all lessons
  const lessons = await Lesson.findAll({ transaction });
  
  // Process each lesson
  for (const lesson of lessons) {
    try {
      // Load quiz files for this lesson
      const lessonDir = path.join(__dirname, '..', '..', '..', 'content', 'modules', 
                                lesson.module.slug, 'lessons', lesson.slug);
      const quizzesDir = path.join(lessonDir, 'quizzes');
      
      try {
        const quizFiles = await fs.readdir(quizzesDir);
        const jsonQuizFiles = quizFiles.filter(file => file.endsWith('.json'));
        
        // Process each quiz file
        for (const quizFile of jsonQuizFiles) {
          try {
            const quizPath = path.join(quizzesDir, quizFile);
            const quizData = JSON.parse(await fs.readFile(quizPath, 'utf8'));
            
            const quiz = await Quiz.create(convertQuizData(quizData, lesson.id), { transaction });
            quizCount++;
            console.log(`Created quiz question: ${quizCount}`);
          } catch (fileError) {
            console.error(`Error processing quiz file ${quizFile}:`, fileError.message);
            // Continue with other quizzes even if one fails
          }
        }
      } catch (dirError) {
        console.log(`No quizzes directory found for lesson ${lesson.slug}, skipping...`);
      }
    } catch (lessonError) {
      console.error(`Error processing lesson ${lesson.slug}:`, lessonError.message);
      // Continue with other lessons even if one fails
    }
  }
  
  console.log(`Migrated ${quizCount} quiz questions`);
  return quizCount;
}

async function rollbackMigration() {
  console.log('Rolling back migration...');
  const transaction = await sequelize.transaction();
  
  try {
    // Delete all data in reverse order
    await Quiz.destroy({ where: {}, transaction });
    await Lesson.destroy({ where: {}, transaction });
    await Module.destroy({ where: {}, transaction });
    await Course.destroy({ where: {}, transaction });
    
    await transaction.commit();
    console.log('Rollback completed successfully!');
  } catch (error) {
    await transaction.rollback();
    console.error('Rollback failed:', error.message);
    throw error;
  }
}

async function migrateContent() {
  console.log('Starting content migration...');
  
  // Load registry data
  const registryPath = path.join(__dirname, '..', '..', '..', '..', 'content', 'registry.json');
  const registryData = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  
  const transaction = await sequelize.transaction();
  
  try {
    // Migrate courses and modules
    const { course, modules } = await migrateCoursesAndModules(registryData, transaction);
    
    // Migrate lessons
    const lessonCount = await migrateLessons(modules, transaction);
    
    // Migrate quizzes
    const quizCount = await migrateQuizzes(transaction);
    
    // Commit the transaction
    await transaction.commit();
    
    console.log('Migration completed successfully!');
    console.log(`- Course: ${course.title}`);
    console.log(`- Modules: ${modules.length}`);
    console.log(`- Lessons: ${lessonCount}`);
    console.log(`- Quiz Questions: ${quizCount}`);
    
    return { course, modules, lessonCount, quizCount };
  } catch (error) {
    // Rollback the transaction on any error
    await transaction.rollback();
    console.error('Migration failed:', error.message);
    
    // Ask user if they want to rollback
    console.log('Do you want to rollback the migration? (The database will be cleared)');
    console.log('Run rollbackMigration() function to rollback.');
    
    throw error;
  }
}

// Export functions for external use
module.exports = {
  migrateContent,
  rollbackMigration
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateContent()
    .then(() => {
      console.log('Migration process finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}