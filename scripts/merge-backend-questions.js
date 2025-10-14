#!/usr/bin/env node
/**
 * Merge backend question files into content/quizzes JSON files.
 * - Reads from glasscode/backend/Data/*_questions.json
 * - Maps to content/quizzes/<target>.json based on module slug mapping
 * - Merges questions, avoiding duplicates by question text or id
 * - Ensures each question has both correctAnswer and correctIndex
 * - Updates totalQuestions if present
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BACKEND_DATA_DIR = path.join(ROOT, 'glasscode', 'backend', 'Data');
const QUIZZES_DIR = path.join(ROOT, 'content', 'quizzes');

// Map backend file base to target quiz filenames
const mapping = {
  database: 'database-systems',
  dotnet: 'dotnet-fundamentals',
  graphql: 'graphql-advanced',
  laravel: 'laravel-fundamentals',
  nextjs: 'nextjs-advanced',
  node: 'node-fundamentals',
  performance: 'performance-optimization',
  programming: 'programming-fundamentals',
  react: 'react-fundamentals',
  sass: 'sass-advanced',
  security: 'security-fundamentals',
  tailwind: 'tailwind-advanced',
  testing: 'testing-fundamentals',
  typescript: 'typescript-fundamentals',
  version: 'version-control',
  vue: 'vue-advanced',
  web: 'web-fundamentals',
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeQuestionFields(q) {
  const out = { ...q };
  // Harmonize correct answer fields
  if (out.correctAnswer === undefined && typeof out.correctIndex === 'number') {
    out.correctAnswer = out.correctIndex;
  }
  if (out.correctIndex === undefined && typeof out.correctAnswer === 'number') {
    out.correctIndex = out.correctAnswer;
  }
  return out;
}

function mergeQuestions(existing = [], incoming = []) {
  const result = [...existing.map(q => normalizeQuestionFields(q))];
  const seenById = new Set(result.map(q => q.id).filter(Boolean));
  const seenByText = new Set(result.map(q => (q.question || '').trim().toLowerCase()));

  for (const raw of incoming) {
    const q = normalizeQuestionFields(raw);
    const qId = q.id;
    const qText = (q.question || '').trim().toLowerCase();

    if (qId && seenById.has(qId)) {
      // Skip duplicate by id
      continue;
    }
    if (qText && seenByText.has(qText)) {
      // Skip duplicate by normalized question text
      continue;
    }
    result.push(q);
    if (qId) seenById.add(qId);
    if (qText) seenByText.add(qText);
  }

  // Re-number IDs if missing or duplicate IDs found; keep existing IDs when present
  let nextId = 1;
  for (const q of result) {
    if (typeof q.id !== 'number') {
      // assign a new incremental id that's not used
      while (seenById.has(nextId)) nextId++;
      q.id = nextId;
      seenById.add(nextId);
      nextId++;
    }
  }

  return result;
}

function upsertQuiz(targetSlug, incomingQuestions) {
  ensureDir(QUIZZES_DIR);
  const quizPath = path.join(QUIZZES_DIR, `${targetSlug}.json`);

  let quiz;
  if (fs.existsSync(quizPath)) {
    quiz = readJson(quizPath);
  } else {
    quiz = {
      moduleSlug: targetSlug,
      title: targetSlug.replace(/-/g, ' ').replace(/\b\w/g, s => s.toUpperCase()),
      description: `Quiz for ${targetSlug}`,
      questions: [],
    };
  }

  const existingQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const merged = mergeQuestions(existingQuestions, incomingQuestions);
  quiz.questions = merged;

  // Update totalQuestions if present or add it
  quiz.totalQuestions = merged.length;

  writeJson(quizPath, quiz);
  return { quizPath, count: merged.length };
}

function main() {
  // Discover backend question files
  const files = fs.readdirSync(BACKEND_DATA_DIR).filter(f => f.endsWith('_questions.json'));
  if (files.length === 0) {
    console.error('No backend question files found in', BACKEND_DATA_DIR);
    process.exit(1);
  }

  console.log('Merging backend question files into content/quizzes...');
  const report = [];
  for (const file of files) {
    const base = file.replace('_questions.json', '');
    const target = mapping[base];
    if (!target) {
      console.warn(`No mapping for ${base}, skipping.`);
      continue;
    }

    const srcPath = path.join(BACKEND_DATA_DIR, file);
    try {
      const data = readJson(srcPath);
      const incoming = Array.isArray(data) ? data : (data.questions || data || []);
      if (!Array.isArray(incoming)) {
        console.warn(`Unexpected format in ${file}, expected array of questions.`);
        continue;
      }
      const { quizPath, count } = upsertQuiz(target, incoming);
      report.push({ source: file, target: path.basename(quizPath), mergedCount: count });
      console.log(`Merged ${incoming.length} into ${target}.json -> total ${count}`);
    } catch (e) {
      console.error(`Failed to process ${file}:`, e.message || e);
    }
  }

  // Write merge report
  const auditDir = path.join(ROOT, 'audit-logs');
  ensureDir(auditDir);
  writeJson(path.join(auditDir, 'merge-questions-report.json'), {
    timestamp: new Date().toISOString(),
    report,
  });

  console.log('Merge complete. Report saved to audit-logs/merge-questions-report.json');
}

if (require.main === module) {
  main();
}