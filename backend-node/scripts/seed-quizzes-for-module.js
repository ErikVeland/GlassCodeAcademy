#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs');
const path = require('path');

// Load env
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });
  else require('dotenv').config();
} catch (e) {
  console.warn('Env load warning:', e && e.message ? e.message : e);
}
const {
  Module,
  Lesson,
  LessonQuiz,
  initializeAssociations,
} = require('../src/models');
const { Op } = require('sequelize');

async function seedModuleQuizzes(targetSlug) {
  await initializeAssociations();

  // Find target module
  const module = await Module.findOne({ where: { slug: targetSlug } });
  if (!module) {
    console.error(`❌ Module not found: ${targetSlug}`);
    process.exit(1);
  }

  // Resolve quiz file path
  let quizFileSlug = targetSlug;
  const quizzesDir = path.join(__dirname, '../../content/quizzes');
  const directPath = path.join(quizzesDir, `${quizFileSlug}.json`);
  if (!fs.existsSync(directPath)) {
    // Simple fallback mapping for legacy/demo slug
    const fallbackMap = {
      'html-basics': 'web-fundamentals',
    };
    if (fallbackMap[quizFileSlug]) {
      quizFileSlug = fallbackMap[quizFileSlug];
    }
  }
  const quizzesPath = path.join(quizzesDir, `${quizFileSlug}.json`);
  if (!fs.existsSync(quizzesPath)) {
    console.error(
      `❌ No quiz file found for slug '${targetSlug}' (looked for '${quizzesPath}')`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(quizzesPath, 'utf8');
  const json = JSON.parse(raw);
  const questions = Array.isArray(json) ? json : json.questions || [];
  console.log(
    `📘 Using quiz file: ${quizFileSlug}.json (${questions.length} questions)`
  );

  // Fetch lessons for distribution
  const lessonList = await Lesson.findAll({
    where: { module_id: module.id },
    order: [['order', 'ASC']],
  });
  if (!lessonList || lessonList.length === 0) {
    console.error('❌ No lessons found for module, cannot seed quizzes');
    process.exit(1);
  }

  const lessonIds = lessonList.map((l) => l.id);
  await LessonQuiz.destroy({ where: { lesson_id: { [Op.in]: lessonIds } } });
  console.log(`🧹 Cleared existing quizzes for ${lessonIds.length} lessons`);

  let created = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || !q.question) continue;

    const targetLesson = lessonList[i % lessonList.length];
    const sortOrder = q.sortOrder || i + 1;

    try {
      await LessonQuiz.create({
        academyId: module.academyId,
        question: q.question || `Question ${i + 1}`,
        topic: q.topic || module.title,
        difficulty: q.difficulty || 'Beginner',
        choices: q.choices || [],
        fixedChoiceOrder: q.fixedChoiceOrder || false,
        choiceLabels: q.choiceLabels || null,
        acceptedAnswers: q.acceptedAnswers || null,
        explanation: q.explanation || null,
        industryContext: q.industryContext || null,
        tags: q.tags || [],
        questionType: q.questionType || 'multiple-choice',
        estimatedTime: q.estimatedTime || 60,
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
        quizType: q.quizType || 'multiple-choice',
        sources: q.sources || null,
        sortOrder,
        isPublished: true,
        lesson_id: targetLesson.id,
      });
      created++;
    } catch (e) {
      console.error(
        `⚠️  Failed to create quiz #${i + 1} for lesson ${targetLesson.slug}:`,
        e?.message || e
      );
      if (e?.parent?.message) console.error('DB error:', e.parent.message);
      if (e?.sql) console.error('SQL:', e.sql);
    }
  }

  console.log(
    `✅ Seeded ${created} quizzes across ${lessonList.length} lesson(s) for module '${targetSlug}'`
  );
}

const targetSlug = process.argv[2] || 'web-fundamentals';
seedModuleQuizzes(targetSlug)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
