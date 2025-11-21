#!/usr/bin/env node
// Inspect quiz distribution for a given module and lessons

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
} catch {}

const sequelize = require('../src/config/database');
const {
  Module,
  Lesson,
  LessonQuiz,
  initializeAssociations,
} = require('../src/models');

async function main() {
  const moduleId = Number(process.argv[2] || 19);
  const lessonId = Number(process.argv[3] || 262);
  try {
    await sequelize.authenticate();
    initializeAssociations();

    const module = await Module.findByPk(moduleId);
    if (!module) {
      console.log(`Module ${moduleId} not found`);
      process.exit(1);
    }

    const lessons = await Lesson.findAll({
      where: { module_id: module.id },
      order: [['order', 'ASC']],
    });
    console.log(`Module ${moduleId} has ${lessons.length} lessons`);

    for (const l of lessons.slice(0, 10)) {
      const count = await LessonQuiz.count({
        where: { lesson_id: l.id, is_published: true },
      });
      console.log(`  Lesson ${l.id} (${l.slug}) -> quizzes: ${count}`);
    }

    const quizzes = await LessonQuiz.findAll({
      where: { lesson_id: lessonId, is_published: true },
      order: [['sort_order', 'ASC']],
      limit: 5,
    });
    console.log(`\nSample quizzes for lesson ${lessonId}: ${quizzes.length}`);
    quizzes.forEach((q, i) => {
      console.log(
        `  ${i + 1}. [${q.id}] ${String(q.question).substring(0, 80)}...`
      );
    });

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Inspect failed:', err?.message || err);
    try {
      await sequelize.close();
    } catch {}
    process.exit(1);
  }
}

main();
