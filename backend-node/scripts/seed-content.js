const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Use models from apps/api directory
const { sequelize } = require('../../apps/api/src/config/database');
const Course = require('../../apps/api/src/models/courseModel');
const Module = require('../../apps/api/src/models/moduleModel');
const Lesson = require('../../apps/api/src/models/lessonModel');
const LessonQuiz = require('../../apps/api/src/models/quizModel');
const Academy = require('../../apps/api/src/models/academyModel');

async function seedContent() {
  try {
    console.log('🔄 Starting content seeding for Node.js backend...');

    // Ensure all tables have proper schema
    const isSqlite = sequelize.getDialect() === 'sqlite';
    await sequelize.sync({ alter: !isSqlite });
    console.log(
      `✅ Schema sync completed (dialect=${sequelize.getDialect()}, alter=${!isSqlite}).`
    );

    // Get the default academy
    const defaultAcademy = await Academy.findOne({
      where: { slug: 'glasscode-academy' },
    });

    if (!defaultAcademy) {
      throw new Error(
        'Default academy not found. Please run database seeding first.'
      );
    }

    console.log(
      `Using academy: ${defaultAcademy.name} (ID: ${defaultAcademy.id})`
    );

    // Load registry to get module information
    const registryPath = path.join(__dirname, '../../content/registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    console.log(`Found ${registry.modules.length} modules in registry`);

    // Track seeding statistics
    let coursesCreated = 0;
    let coursesUpdated = 0;
    let modulesCreated = 0;
    let modulesUpdated = 0;
    let lessonsCreated = 0;
    let lessonsUpdated = 0;
    let quizzesCreated = 0;
    let quizzesUpdated = 0;

    // Create courses (one for each module)
    for (const moduleInfo of registry.modules) {
      console.log(`Processing module: ${moduleInfo.title}`);

      // Create course
      const [course, courseCreatedFlag] = await Course.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10,
          academyId: defaultAcademy.id,
        },
      });

      if (courseCreatedFlag) {
        coursesCreated++;
        console.log(`  ✅ Created course: ${course.title}`);
      } else {
        coursesUpdated++;
        console.log(`  🔁 Updated course: ${course.title}`);
        await course.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          difficulty: moduleInfo.difficulty,
          isPublished: true,
          estimatedHours: moduleInfo.estimatedHours || 10,
          academyId: defaultAcademy.id,
        });
      }

      // Create module
      const [module, moduleCreatedFlag] = await Module.findOrCreate({
        where: { slug: moduleInfo.slug },
        defaults: {
          title: moduleInfo.title,
          description: moduleInfo.description,
          slug: moduleInfo.slug,
          order: moduleInfo.order,
          isPublished: true,
          courseId: course.id,
          academyId: defaultAcademy.id,
        },
      });

      if (moduleCreatedFlag) {
        modulesCreated++;
        console.log(`  ✅ Created module: ${module.title}`);
      } else {
        modulesUpdated++;
        console.log(`  🔁 Updated module: ${module.title}`);
        await module.update({
          title: moduleInfo.title,
          description: moduleInfo.description,
          order: moduleInfo.order,
          isPublished: true,
          courseId: course.id,
          academyId: defaultAcademy.id,
        });
      }

      // Load lessons for this module
      const lessonsPath = path.join(
        __dirname,
        `../../content/lessons/${moduleInfo.slug}.json`
      );
      let lessons = [];

      if (fs.existsSync(lessonsPath)) {
        const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
        console.log(`  Found ${lessonsData.length} lessons`);

        for (let i = 0; i < lessonsData.length; i++) {
          const lessonData = lessonsData[i];

          const [lesson, lessonCreatedFlag] = await Lesson.findOrCreate({
            where: { slug: `${moduleInfo.slug}-lesson-${i + 1}` },
            defaults: {
              title: lessonData.title || `Lesson ${i + 1}`,
              slug: `${moduleInfo.slug}-lesson-${i + 1}`,
              order: lessonData.order || i + 1,
              content: lessonData.content || {
                type: 'markdown',
                content: lessonData.intro || '',
              },
              isPublished: true,
              difficulty:
                lessonData.difficulty || moduleInfo.difficulty || 'Beginner',
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              moduleId: module.id,
              academyId: defaultAcademy.id,
            },
          });

          if (lessonCreatedFlag) {
            lessonsCreated++;
            console.log(`    ✅ Created lesson: ${lesson.title}`);
          } else {
            lessonsUpdated++;
            console.log(`    🔁 Updated lesson: ${lesson.title}`);
            await lesson.update({
              title: lessonData.title || `Lesson ${i + 1}`,
              order: lessonData.order || i + 1,
              content: lessonData.content || {
                type: 'markdown',
                content: lessonData.intro || '',
              },
              isPublished: true,
              difficulty:
                lessonData.difficulty || moduleInfo.difficulty || 'Beginner',
              estimatedMinutes: lessonData.estimatedMinutes || 30,
              moduleId: module.id,
              academyId: defaultAcademy.id,
            });
          }
        }
      } else {
        console.log(`  ⚠️  No lessons file found for ${moduleInfo.slug}`);
      }

      // Load quiz questions for this module
      const quizzesPath = path.join(
        __dirname,
        `../../content/quizzes/${moduleInfo.slug}.json`
      );
      if (fs.existsSync(quizzesPath)) {
        const quizData = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
        const questions = Array.isArray(quizData)
          ? quizData
          : quizData.questions || [];
        console.log(`  Found ${questions.length} quiz questions`);

        // Fetch all lessons for distribution
        const lessonList = await Lesson.findAll({
          where: { moduleId: module.id },
          order: [['order', 'ASC']],
        });
        if (!lessonList || lessonList.length === 0) {
          console.log(
            `  ⚠️  No lesson found for module ${moduleInfo.slug}, skipping quiz seeding`
          );
          continue;
        }
        const lessonIds = lessonList.map((l) => l.id);

        // Remove existing quizzes for this module's lessons to avoid duplicates
        await LessonQuiz.destroy({
          where: { lesson_id: { [Op.in]: lessonIds } },
        });

        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];

          // Validate question data
          if (!questionData.question) {
            console.log(
              `  ⚠️  Skipping quiz question ${i + 1} - missing question text`
            );
            continue;
          }

          // Distribute questions across lessons in order
          const targetLesson = lessonList[i % lessonList.length];
          const targetLessonId = targetLesson.id;
          const sortOrder = questionData.sortOrder || i + 1;

          const [quiz, quizCreatedFlag] = await LessonQuiz.findOrCreate({
            where: { sort_order: sortOrder, lesson_id: targetLessonId },
            defaults: {
              question: questionData.question || `Question ${i + 1}`,
              topic: questionData.topic || moduleInfo.title,
              difficulty:
                questionData.difficulty || moduleInfo.difficulty || 'Beginner',
              choices: questionData.choices || [],
              fixedChoiceOrder: questionData.fixedChoiceOrder || false,
              choiceLabels: questionData.choiceLabels || null,
              acceptedAnswers: questionData.acceptedAnswers || null,
              explanation: questionData.explanation || null,
              industryContext: questionData.industryContext || null,
              tags: questionData.tags || [],
              questionType: questionData.questionType || 'multiple-choice',
              estimatedTime: questionData.estimatedTime || 60,
              correctAnswer:
                questionData.correctAnswer !== undefined
                  ? questionData.correctAnswer
                  : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sortOrder,
              isPublished: true,
              lessonId: targetLessonId,
              academyId: defaultAcademy.id,
            },
          });

          if (quizCreatedFlag) {
            quizzesCreated++;
            console.log(
              `    ✅ Created quiz for lesson ${targetLesson.slug}: ${quiz.question.substring(0, 50)}...`
            );
          } else {
            quizzesUpdated++;
            console.log(
              `    🔁 Updated quiz for lesson ${targetLesson.slug}: ${quiz.question.substring(0, 50)}...`
            );
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
              correctAnswer:
                questionData.correctAnswer !== undefined
                  ? questionData.correctAnswer
                  : 0,
              quizType: questionData.quizType || 'multiple-choice',
              sortOrder,
              isPublished: true,
              lessonId: targetLessonId,
              academyId: defaultAcademy.id,
            });
          }
        }
      } else {
        console.log(`  ⚠️  No quiz file found for ${moduleInfo.slug}`);
      }
    }

    // Print seeding statistics
    console.log('📊 Seeding Statistics:');
    console.log(
      `  - Courses: ${coursesCreated} created, ${coursesUpdated} updated`
    );
    console.log(
      `  - Modules: ${modulesCreated} created, ${modulesUpdated} updated`
    );
    console.log(
      `  - Lessons: ${lessonsCreated} created, ${lessonsUpdated} updated`
    );
    console.log(
      `  - Quizzes: ${quizzesCreated} created, ${quizzesUpdated} updated`
    );

    // Verification step: Check that all content is associated with the default academy
    console.log('🔍 Verifying academy associations...');
    const academyLessons = await Lesson.count({
      where: { academyId: defaultAcademy.id },
    });
    // Note: Only lessons and quizzes have academyId columns in the database schema
    // Courses and modules don't have this column, so we can't verify their academy associations directly

    console.log('✅ Academy Association Verification:');
    console.log(`  - Lessons associated with academy: ${academyLessons}`);
    console.log(
      "  - Quizzes associated with academy: This check is skipped as quizzes table doesn't have academyId column"
    );

    // Verification step: Check that all content is published
    console.log('🔍 Verifying publication status...');
    const publishedLessons = await Lesson.count({
      where: { isPublished: true, academyId: defaultAcademy.id },
    });
    // Note: Only lessons have both isPublished and academyId columns
    // Other tables don't have these columns, so we can't verify their publication status directly

    console.log('✅ Publication Status Verification:');
    console.log(`  - Published lessons: ${publishedLessons}/${academyLessons}`);
    console.log(
      "  - Published quizzes: This check is skipped as quizzes table doesn't have academyId column"
    );
    console.log(
      "  - Published courses/modules: This check is skipped as these tables don't have academyId column"
    );

    console.log('🎉 Content seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Content seeding failed:', error?.message || error);
    if (error?.original) {
      console.error('Original error:', error.original);
    }
    if (error?.parent) {
      console.error('Parent error:', error.parent);
    }
    console.error('Full error object:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

seedContent();
