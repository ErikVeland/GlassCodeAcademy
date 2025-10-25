const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');
const { Course, Module, Lesson, LessonQuiz, initializeAssociations } = require('../src/models');

// Ensure database schema exists before seeding
async function ensureSchema() {
  try {
    await sequelize.authenticate();
    // Initialize associations so sync creates proper FKs
    initializeAssociations();

    const qi = sequelize.getQueryInterface();
    let tables = await qi.showAllTables();
    tables = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t.name || t))
      : [];

    const required = ['courses', 'modules', 'lessons', 'lesson_quizzes'];
    const missing = required.filter((t) => !tables.includes(t));

    if (missing.length > 0) {
      console.log(`🧱 Missing tables detected: ${missing.join(', ')} — running schema sync`);
      // Safe sync: creates missing tables without dropping existing ones
      await sequelize.sync();
      console.log('✅ Schema sync completed.');
    } else {
      console.log('✅ Required tables already present; skipping schema sync.');
    }
  } catch (e) {
    console.error('❌ Failed to verify or sync schema:', e);
    throw e;
  }
}

// Load content from JSON files and seed the database
async function seedContent() {
  try {
    console.log('🔄 Starting content seeding for Node.js backend...');

    // Ensure schema is present so subsequent queries don't fail
    await ensureSchema();
    
    // Load registry to get module information
    const registryPath = path.join(__dirname, '../../content/registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    console.log(`Found ${registry.modules.length} modules in registry`);
    
    // Create courses (one for each module)
    for (const moduleInfo of registry.modules) {
      console.log(`Processing module: ${moduleInfo.title}`);
      
      // Create course
      const [course, courseCreated] = await Course.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10
        }
      });
      
      if (courseCreated) {
        console.log(`  ✅ Created course: ${course.title}`);
      } else {
        console.log(`  🔁 Updated course: ${course.title}`);
        await course.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10
        });
      }
      
      // Create module
      const [module, moduleCreated] = await Module.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          isPublished: true,
          course_id: course.id
        }
      });
      
      if (moduleCreated) {
        console.log(`  ✅ Created module: ${module.title}`);
      } else {
        console.log(`  🔁 Updated module: ${module.title}`);
        await module.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          isPublished: true,
          course_id: course.id
        });
      }
      
      // Load lessons for this module
      const lessonsPath = path.join(__dirname, `../../content/lessons/${moduleInfo.slug}.json`);
      let lessons = [];
      
      if (fs.existsSync(lessonsPath)) {
        const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
        console.log(`  Found ${lessonsData.length} lessons`);
        
        for (let i = 0; i < lessonsData.length; i++) {
          const lessonData = lessonsData[i];
          
          const [lesson, lessonCreated] = await Lesson.findOrCreate({
            where: { slug: `${moduleInfo.slug}-lesson-${i+1}` },
            defaults: {
              title: lessonData.title || `Lesson ${i+1}`,
              slug: `${moduleInfo.slug}-lesson-${i+1}`,
              order: lessonData.order || i + 1,
              content: lessonData.content || { type: 'markdown', content: lessonData.intro || '' },
              isPublished: true,
              difficulty: lessonData.difficulty || moduleInfo.difficulty || 'Beginner',
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              module_id: module.id
            }
          });
          
          if (lessonCreated) {
            console.log(`    ✅ Created lesson: ${lesson.title}`);
          } else {
            console.log(`    🔁 Updated lesson: ${lesson.title}`);
            await lesson.update({
              title: lessonData.title || `Lesson ${i+1}`,
              order: lessonData.order || i + 1,
              content: lessonData.content || { type: 'markdown', content: lessonData.intro || '' },
              isPublished: true,
              difficulty: lessonData.difficulty || moduleInfo.difficulty || 'Beginner',
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              module_id: module.id
            });
          }
        }
      } else {
        console.log(`  ⚠️  No lessons file found for ${moduleInfo.slug}`);
      }
      
      // Load quiz questions for this module
      const quizzesPath = path.join(__dirname, `../../content/quizzes/${moduleInfo.slug}.json`);
      if (fs.existsSync(quizzesPath)) {
        const quizData = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
        const questions = Array.isArray(quizData) ? quizData : (quizData.questions || []);
        console.log(`  Found ${questions.length} quiz questions`);
        
        // Find the first lesson for association
        const firstLesson = await Lesson.findOne({ where: { module_id: module.id }, order: [['order', 'ASC']] });
        const lessonId = firstLesson ? firstLesson.id : null;
        
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          
          const [quiz, quizCreated] = await LessonQuiz.findOrCreate({
            where: { sortOrder: questionData.sortOrder || i + 1, lesson_id: lessonId },
            defaults: {
              question: questionData.question || `Question ${i + 1}`,
              topic: questionData.topic || moduleInfo.title,
              difficulty: questionData.difficulty || moduleInfo.difficulty || 'Beginner',
              choices: questionData.choices || [],
              fixedChoiceOrder: questionData.fixedChoiceOrder || false,
              choiceLabels: questionData.choiceLabels || null,
              acceptedAnswers: questionData.acceptedAnswers || null,
              explanation: questionData.explanation || null,
              industryContext: questionData.industryContext || null,
              tags: questionData.tags || [],
              questionType: questionData.questionType || 'multiple-choice',
              estimatedTime: questionData.estimatedTime || 60,
              correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sources: questionData.sources || null,
              sortOrder: questionData.sortOrder || i + 1,
              isPublished: true,
              lesson_id: lessonId
            }
          });
          
          if (quizCreated) {
            console.log(`    ✅ Created quiz question: ${quiz.question.substring(0, 50)}...`);
          } else {
            console.log(`    🔁 Updated quiz question: ${quiz.question.substring(0, 50)}...`);
            await quiz.update({
              topic: questionData.topic || moduleInfo.title,
              difficulty: questionData.difficulty || moduleInfo.difficulty,
              choices: questionData.choices || [],
              fixedChoiceOrder: questionData.fixedChoiceOrder || false,
              choiceLabels: questionData.choiceLabels || null,
              acceptedAnswers: questionData.acceptedAnswers || null,
              explanation: questionData.explanation || null,
              industryContext: questionData.industryContext || null,
              tags: questionData.tags || [],
              questionType: questionData.questionType || 'multiple-choice',
              estimatedTime: questionData.estimatedTime || 60,
              correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sources: questionData.sources || null,
              sortOrder: questionData.sortOrder || i + 1,
              isPublished: true
            });
          }
        }
      } else {
        console.log(`  ⚠️  No quizzes file found for ${moduleInfo.slug}`);
      }
    }
    
    console.log('✅ Content seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Content seeding failed:', error);
    process.exit(1);
  }
}

seedContent();