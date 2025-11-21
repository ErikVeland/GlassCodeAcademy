#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import { sequelize } from '../../src/config/database.js';
import { Course, Module, Lesson, Quiz } from '../../src/models/index.js';

// Force sync the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// Helper function to convert module data to course data
function convertModuleToCourse(moduleData) {
  return {
    title: moduleData.title,
    description: moduleData.description,
    slug: moduleData.slug,
    isPublished: moduleData.status === 'active',
    order: moduleData.order,
    difficulty: moduleData.difficulty,
    estimatedHours: moduleData.estimatedHours,
    category: moduleData.category,
    technologies: moduleData.technologies,
    prerequisites: moduleData.prerequisites,
    metadata: moduleData.metadata,
    version: moduleData.version || '1.0.0',
    createdAt: new Date(moduleData.lastUpdated || new Date()),
    updatedAt: new Date(moduleData.lastUpdated || new Date()),
  };
}

// Helper function to convert lesson data
function convertLesson(lessonData, moduleId) {
  return {
    moduleId: moduleId,
    title: lessonData.title,
    slug: `${lessonData.moduleSlug}-${lessonData.id}`,
    order: lessonData.order,
    content: {
      objectives: lessonData.objectives,
      intro: lessonData.intro,
      code: lessonData.code,
      pitfalls: lessonData.pitfalls,
      exercises: lessonData.exercises,
      next: lessonData.next,
      estimatedMinutes: lessonData.estimatedMinutes,
      difficulty: lessonData.difficulty,
      tags: lessonData.tags,
      sources: lessonData.sources,
    },
    is_published: true,
    difficulty: lessonData.difficulty,
    estimated_minutes: lessonData.estimatedMinutes,
    version: lessonData.version || '1.0.0',
    created_at: new Date(lessonData.lastUpdated || new Date()),
    updated_at: new Date(lessonData.lastUpdated || new Date()),
  };
}

// Helper function to convert quiz question data
function convertQuizQuestion(questionData, lessonId) {
  return {
    lessonId: lessonId,
    question: questionData.question,
    topic: questionData.topic,
    difficulty: questionData.difficulty,
    choices: questionData.choices,
    fixedChoiceOrder: questionData.fixedChoiceOrder || false,
    choiceLabels: questionData.choiceLabels || null,
    acceptedAnswers: Array.isArray(questionData.correctAnswer)
      ? questionData.correctAnswer
      : [questionData.correctAnswer],
    explanation: questionData.explanation,
    industryContext: questionData.industryContext || null,
    tags: questionData.tags || null,
    questionType: questionData.questionType || questionData.type,
    estimatedTime: 60, // Default time per question
    correctAnswer: questionData.correctAnswer,
    quizType: questionData.type || 'multiple-choice',
    sortOrder: questionData.id,
    isPublished: true,
    metadata: {
      sources: questionData.sources || [],
    },
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function migrateCoursesAndModules(registryData) {
  console.log('Starting migration of courses and modules...');

  // Clear existing data first
  try {
    await Quiz.destroy({ where: {} });
  } catch (error) {
    console.log('Quizzes table does not exist yet');
  }
  try {
    await Lesson.destroy({ where: {} });
  } catch (error) {
    console.log('Lessons table does not exist yet');
  }
  try {
    await Module.destroy({ where: {} });
  } catch (error) {
    console.log('Modules table does not exist yet');
  }
  try {
    await Course.destroy({ where: {} });
  } catch (error) {
    console.log('Courses table does not exist yet');
  }

  // For now, we'll create one course that contains all modules
  // In a more complex scenario, we might group modules by track or tier
  const courseData = {
    title: 'Full Stack Development Curriculum',
    description:
      'Complete curriculum covering all aspects of full stack development',
    slug: 'full-stack-development',
    isPublished: true,
    order: 1,
    difficulty: 'Beginner',
    estimatedHours: 800,
    category: 'full-stack',
    technologies: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Next.js'],
    prerequisites: [],
    metadata: {
      version: '1.0.0',
    },
    version: '1.0.0',
  };

  const course = await Course.create(courseData);
  console.log(`Created course: ${course.title}`);

  // Create modules
  const modules = [];
  for (const moduleData of registryData.modules) {
    const module = await Module.create({
      ...convertModuleToCourse(moduleData),
      courseId: course.id,
    });
    modules.push(module);
    console.log(`Created module: ${module.title}`);
  }

  return { course, modules };
}

async function migrateLessons(modules) {
  console.log('Starting migration of lessons...');

  let lessonCount = 0;

  for (const module of modules) {
    try {
      const lessonFilePath = path.join(
        __dirname,
        '../../../../content/lessons',
        `${module.slug}.json`
      );
      const lessonData = JSON.parse(await fs.readFile(lessonFilePath, 'utf8'));

      for (const lesson of lessonData) {
        const lessonRecord = await Lesson.create(
          convertLesson(lesson, module.id)
        );
        lessonCount++;
        console.log(`Created lesson: ${lessonRecord.title}`);
      }
    } catch (error) {
      console.error(
        `Error migrating lessons for module ${module.slug}:`,
        error.message
      );
    }
  }

  console.log(`Migrated ${lessonCount} lessons`);
  return lessonCount;
}

async function migrateQuizzes(modules) {
  console.log('Starting migration of quizzes...');

  let quizCount = 0;

  for (const module of modules) {
    try {
      // Find the corresponding lessons for this module
      const lessons = await Lesson.findAll({ where: { moduleId: module.id } });

      const quizFilePath = path.join(
        __dirname,
        '../../../../content/quizzes',
        `${module.slug}.json`
      );
      const quizData = JSON.parse(await fs.readFile(quizFilePath, 'utf8'));

      // Create a map of lessons by their original ID for proper association
      const lessonMap = {};
      for (const lesson of lessons) {
        // Extract the original ID from the slug (format: moduleSlug-originalId)
        const parts = lesson.slug.split('-');
        const originalId = parseInt(parts[parts.length - 1]);
        if (!isNaN(originalId)) {
          lessonMap[originalId] = lesson.id;
        }
      }

      // Create quiz questions
      for (const question of quizData.questions) {
        // Associate with the first lesson if we can't find a specific one
        const lessonId =
          lessonMap[question.id] || (lessons.length > 0 ? lessons[0].id : null);

        if (lessonId) {
          const quizRecord = await Quiz.create(
            convertQuizQuestion(question, lessonId)
          );
          quizCount++;
          console.log(`Created quiz question: ${quizRecord.id}`);
        }
      }
    } catch (error) {
      console.error(
        `Error migrating quizzes for module ${module.slug}:`,
        error.message
      );
    }
  }

  console.log(`Migrated ${quizCount} quiz questions`);
  return quizCount;
}

async function main() {
  try {
    console.log('Starting content migration...');

    // Read registry data
    const registryPath = path.join(
      __dirname,
      '../../../../content/registry.json'
    );
    const registryData = JSON.parse(await fs.readFile(registryPath, 'utf8'));

    // Migrate courses and modules
    const { course, modules } = await migrateCoursesAndModules(registryData);

    // Migrate lessons
    const lessonCount = await migrateLessons(modules);

    // Migrate quizzes
    const quizCount = await migrateQuizzes(modules);

    console.log('Migration completed successfully!');
    console.log(`- Course: 1`);
    console.log(`- Modules: ${modules.length}`);
    console.log(`- Lessons: ${lessonCount}`);
    console.log(`- Quiz Questions: ${quizCount}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  migrateCoursesAndModules,
  migrateLessons,
  migrateQuizzes,
  convertModuleToCourse,
  convertLesson,
  convertQuizQuestion,
};
