#!/usr/bin/env node
/**
 * Auto-migrate quiz questions to fixed-order with letter labels when they
 * reference letters or include "All of the above" / "None of the above" patterns.
 *
 * Usage: node scripts/migrate-lettered-questions.js [--dry]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry');
const QUIZZES_DIR = path.resolve(__dirname, '..', 'content', 'quizzes');

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function safeWriteJson(filePath, data) {
  const out = JSON.stringify(data, null, 2) + '\n';
  if (DRY_RUN) return true;
  fs.writeFileSync(filePath, out, 'utf8');
  return true;
}

function normalize(str) {
  return String(str || '').trim();
}

// Detection helpers
const reAllAbove = /\ball of the above\b/i;
const reNoneAbove = /\bnone of the above\b/i;
const reEitherAorB = /\beither\s+[abcd]\s+or\s+[abcd]\b/i;
const reBothXandY = /\bboth\s+[abcd]\s+(?:and|&|\/)\s+[abcd]\b/i;
const reNeitherXnorY = /\bneither\s+[abcd]\s+nor\s+[abcd]\b/i;
const reLetterPair = /\b([A-D])\s*(?:,|and|or|nor|&|\/)\s*([A-D])\b/i;
const reOptionLetter = /\b(?:option|choice)\s*[A-D]\b/i;

function hasLetterReference(text) {
  const t = String(text || '');
  return (
    reAllAbove.test(t) ||
    reNoneAbove.test(t) ||
    reEitherAorB.test(t) ||
    reBothXandY.test(t) ||
    reNeitherXnorY.test(t) ||
    reLetterPair.test(t) ||
    reOptionLetter.test(t)
  );
}

function choiceListHasAllNone(choices) {
  return Array.isArray(choices) && choices.some((c) => {
    const n = normalize(c).toLowerCase();
    return n === 'all of the above' || n === 'none of the above';
  });
}

function shouldFixOrder(question) {
  const type = normalize(question.type);
  if (type === 'open-ended') return false;
  const questionText = normalize(question.question);
  const choices = Array.isArray(question.choices) ? question.choices : [];
  if (choices.length < 2) return false;

  return (
    choiceListHasAllNone(choices) ||
    hasLetterReference(questionText) ||
    choices.some((c) => hasLetterReference(c))
  );
}

function migrateQuiz(filePath) {
  const quiz = safeReadJson(filePath);
  if (!quiz || !Array.isArray(quiz.questions)) {
    return { file: path.basename(filePath), updated: 0, skipped: true };
  }

  let updatedCount = 0;
  quiz.questions = quiz.questions.map((q) => {
    const needsFix = shouldFixOrder(q);
    if (!needsFix) return q;

    const fixedChoiceOrder = q.fixedChoiceOrder === true ? true : true;
    const choiceLabels = q.choiceLabels === 'letters' ? 'letters' : 'letters';
    updatedCount++;
    return {
      ...q,
      fixedChoiceOrder,
      choiceLabels,
    };
  });

  if (updatedCount > 0) {
    safeWriteJson(filePath, quiz);
  }

  return { file: path.basename(filePath), updated: updatedCount, skipped: false };
}

function main() {
  if (!fs.existsSync(QUIZZES_DIR)) {
    console.error('Quizzes directory not found:', QUIZZES_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(QUIZZES_DIR).filter((f) => f.endsWith('.json'));
  const results = files.map((f) => migrateQuiz(path.join(QUIZZES_DIR, f)));

  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  console.log(`Processed ${files.length} quiz file(s).`);
  results.forEach((r) => {
    if (r.skipped) {
      console.log(`- ${r.file}: skipped (invalid format)`);
    } else {
      console.log(`- ${r.file}: updated ${r.updated} question(s)`);
    }
  });
  console.log(`Total questions updated: ${totalUpdated}`);
  if (DRY_RUN) console.log('(dry run) No files were written.');
}

main();