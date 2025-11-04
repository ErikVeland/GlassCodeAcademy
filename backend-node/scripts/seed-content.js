const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');
const { Op } = require('sequelize');
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
      console.log('🔧 Required tables present; altering core content tables to add missing columns');
      // Targeted alter sync to avoid issues in unrelated models
      await Course.sync({ alter: true });
      await Module.sync({ alter: true });
      await Lesson.sync({ alter: true });
      await LessonQuiz.sync({ alter: true });
      console.log('✅ Targeted schema alter sync completed.');
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

        // Fetch all lessons for distribution
        const lessonList = await Lesson.findAll({
          where: { module_id: module.id },
          order: [['order', 'ASC']]
        });
        if (!lessonList || lessonList.length === 0) {
          console.log(`  ⚠️  No lesson found for module ${moduleInfo.slug}, skipping quiz seeding`);
          continue;
        }
        const lessonIds = lessonList.map(l => l.id);

        // Remove existing quizzes for this module's lessons to avoid duplicates
        await LessonQuiz.destroy({
          where: { lesson_id: { [Op.in]: lessonIds } }
        });

        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];

          // Validate question data
          if (!questionData.question) {
            console.log(`  ⚠️  Skipping quiz question ${i+1} - missing question text`);
            continue;
          }

          // Distribute questions across lessons in order
          const targetLesson = lessonList[i % lessonList.length];
          const targetLessonId = targetLesson.id;
          const sortOrder = questionData.sortOrder || i + 1;

          const [quiz, quizCreated] = await LessonQuiz.findOrCreate({
            where: { sortOrder, lesson_id: targetLessonId },
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
              sortOrder,
              isPublished: true,
              lesson_id: targetLessonId
            }
          });

          if (quizCreated) {
            console.log(`    ✅ Created quiz for lesson ${targetLesson.slug}: ${quiz.question.substring(0, 50)}...`);
            if (quiz.id <= 0) {
              console.log(`    ⚠️  Warning: Created quiz has invalid ID: ${quiz.id}`);
            }
          } else {
            console.log(`    🔁 Updated quiz for lesson ${targetLesson.slug}: ${quiz.question.substring(0, 50)}...`);
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
              sortOrder,
              isPublished: true
            });
            if (quiz.id <= 0) {
              console.log(`    ⚠️  Warning: Updated quiz has invalid ID: ${quiz.id}`);
            }
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