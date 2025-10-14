#!/usr/bin/env node

/**
 * Auto-fix quiz warnings script
 * - Adds missing 'topic' field using tags/metadata/moduleSlug fallbacks
 * - Normalizes 'difficulty' values (Beginner/Intermediate/Advanced/Basic)
 * - Removes multiple-choice-only fields for non-multiple-choice question types
 * - Syncs correctIndex/correctAnswer for multiple-choice where one is missing
 */

const fs = require('fs');
const path = require('path');

const QUIZZES_DIR = path.resolve(__dirname, '..', 'content', 'quizzes');

const DIFFICULTY_MAP = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  basic: 'Basic'
};
const DIFFICULTY_SET = new Set(Object.values(DIFFICULTY_MAP));
const LEVEL_TAGS = new Set(['beginner', 'intermediate', 'advanced', 'foundational', 'basic']);

function titleCaseSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function inferTopic(question, quiz) {
  // Prefer explicit tags that are not difficulty-level
  if (Array.isArray(question.tags)) {
    for (const t of question.tags) {
      if (!t || typeof t !== 'string') continue;
      const norm = t.trim().toLowerCase();
      if (!LEVEL_TAGS.has(norm)) {
        // Return a cleaned, title-cased topic
        return t
          .split(/[-_\s]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
      }
    }
  }
  // Metadata topics
  if (quiz && quiz.metadata && Array.isArray(quiz.metadata.topics) && quiz.metadata.topics.length > 0) {
    return quiz.metadata.topics[0];
  }
  // Module slug fallback
  if (quiz && (quiz.moduleSlug || quiz.moduleId)) {
    return titleCaseSlug(quiz.moduleSlug || quiz.moduleId);
  }
  // Title heuristic
  if (quiz && quiz.title && typeof quiz.title === 'string') {
    // Choose first word(s) that look like a domain/topic
    const words = quiz.title.split(' ');
    if (words.length >= 2) return words.slice(0, 2).join(' ');
    return quiz.title;
  }
  return 'General';
}

function normalizeDifficulty(question) {
  let diff = question.difficulty;
  if (typeof diff === 'string') {
    const norm = diff.trim().toLowerCase();
    if (DIFFICULTY_MAP[norm]) {
      question.difficulty = DIFFICULTY_MAP[norm];
      return true;
    }
    if (!DIFFICULTY_SET.has(diff)) {
      // Attempt from tags
      if (Array.isArray(question.tags)) {
        for (const t of question.tags) {
          const tn = String(t).trim().toLowerCase();
          if (DIFFICULTY_MAP[tn]) {
            question.difficulty = DIFFICULTY_MAP[tn];
            return true;
          }
        }
      }
      // If still invalid, drop difficulty to avoid CI error; validator will warn
      delete question.difficulty;
      return true;
    }
    // Already valid
    return false;
  }
  // If missing, try to infer from tags
  if (Array.isArray(question.tags)) {
    for (const t of question.tags) {
      const tn = String(t).trim().toLowerCase();
      if (DIFFICULTY_MAP[tn]) {
        question.difficulty = DIFFICULTY_MAP[tn];
        return true;
      }
    }
  }
  return false;
}

function getQuestionType(q) {
  const type = (q.questionType || q.type || '').toString().toLowerCase();
  return type || 'multiple-choice';
}

function processQuizFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let quiz;
  try {
    quiz = JSON.parse(raw);
  } catch (e) {
    console.error(`  ❌ Failed to parse ${path.basename(filePath)}: ${e.message}`);
    return false;
  }

  if (!Array.isArray(quiz.questions)) return false;

  let modified = false;
  const changes = { topicsAdded: 0, difficultyNormalized: 0, mcFieldsRemoved: 0, answerSynced: 0 };

  quiz.questions = quiz.questions.map((q) => {
    const nq = { ...q };
    const qType = getQuestionType(nq);

    // Topic
    if (!nq.topic || typeof nq.topic !== 'string' || nq.topic.trim() === '') {
      nq.topic = inferTopic(nq, quiz);
      modified = true;
      changes.topicsAdded++;
    }

    // Difficulty
    if (normalizeDifficulty(nq)) {
      modified = true;
      changes.difficultyNormalized++;
    }

    // Remove MC-specific fields for non-MC questions
    if (qType !== 'multiple-choice' && qType !== 'true-false') {
      if (Array.isArray(nq.choices)) {
        delete nq.choices;
        modified = true;
        changes.mcFieldsRemoved++;
      }
      if (typeof nq.correctIndex !== 'undefined') {
        delete nq.correctIndex;
        modified = true;
        changes.mcFieldsRemoved++;
      }
      if (typeof nq.correctAnswer !== 'undefined' && typeof nq.correctAnswer !== 'string') {
        // If non-MC but correctAnswer is index, remove it
        delete nq.correctAnswer;
        modified = true;
        changes.mcFieldsRemoved++;
      }
    } else {
      // Sync MC answer fields if one missing
      const hasChoices = Array.isArray(nq.choices) && nq.choices.length > 0;
      if (hasChoices) {
        if (typeof nq.correctIndex === 'number' && typeof nq.correctAnswer !== 'number') {
          nq.correctAnswer = nq.correctIndex;
          modified = true;
          changes.answerSynced++;
        } else if (typeof nq.correctAnswer === 'number' && typeof nq.correctIndex !== 'number') {
          nq.correctIndex = nq.correctAnswer;
          modified = true;
          changes.answerSynced++;
        }
      }
    }

    return nq;
  });

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
    console.log(
      `  ✓ ${path.basename(filePath)} updated (topics: ${changes.topicsAdded}, difficulties: ${changes.difficultyNormalized}, mc fields removed: ${changes.mcFieldsRemoved}, answers synced: ${changes.answerSynced})`
    );
  } else {
    console.log(`  • ${path.basename(filePath)} had no changes`);
  }

  return modified;
}

function main() {
  if (!fs.existsSync(QUIZZES_DIR)) {
    console.error(`Quizzes directory not found: ${QUIZZES_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(QUIZZES_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No quiz JSON files found.');
    return;
  }
  console.log(`🔧 Auto-fixing ${files.length} quiz files for warnings...`);
  let updatedCount = 0;
  for (const f of files) {
    const fp = path.join(QUIZZES_DIR, f);
    const ok = processQuizFile(fp);
    if (ok) updatedCount++;
  }
  console.log(`✅ Completed. Files updated: ${updatedCount}/${files.length}`);
}

main();