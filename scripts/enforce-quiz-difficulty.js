#!/usr/bin/env node

/**
 * Enforce quiz difficulty fields and foundational distribution
 *
 * - Adds missing `difficulty` to questions (infer from tags; else Beginner)
 * - Normalizes difficulty values to one of: Beginner, Intermediate, Advanced
 * - For foundational modules, enforces 70-20-10 distribution across questions
 *   Beginner-Intermediate-Advanced with minimal changes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUIZZES_DIR = path.join(ROOT, 'content', 'quizzes');
const REGISTRY_PATH = path.join(ROOT, 'content', 'registry.json');

const DIFFICULTY_MAP = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  basic: 'Beginner', // treat Basic as Beginner
};
const VALID_DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);

function normalizeDifficultyValue(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  return DIFFICULTY_MAP[s] || null;
}

function inferDifficultyFromTags(q) {
  if (Array.isArray(q.tags)) {
    for (const t of q.tags) {
      const v = normalizeDifficultyValue(t);
      if (v) return v;
    }
  }
  return null;
}

function ensureQuestionDifficulty(q) {
  let current = normalizeDifficultyValue(q.difficulty);
  if (!current) {
    const inferred = inferDifficultyFromTags(q);
    q.difficulty = inferred || 'Beginner';
    return true;
  }
  // already valid or normalized
  q.difficulty = current;
  return false;
}

function getFoundationalSlugs() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Registry file not found: ${REGISTRY_PATH}`);
    return [];
  }
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const reg = JSON.parse(raw);
    if (!Array.isArray(reg.modules)) return [];
    return reg.modules
      .filter((m) => m && m.tier === 'foundational' && typeof m.slug === 'string')
      .map((m) => m.slug);
  } catch (e) {
    console.error(`Failed to parse registry: ${e.message}`);
    return [];
  }
}

function computeTargets(n) {
  const beg = Math.floor(n * 0.7);
  const inter = Math.floor(n * 0.2);
  const adv = n - beg - inter;
  return { beg, inter, adv };
}

function analyzeDistribution(questions) {
  const counts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  for (const q of questions) {
    if (VALID_DIFFICULTIES.has(q.difficulty)) counts[q.difficulty]++;
  }
  return counts;
}

function enforceDistribution(questions) {
  const total = questions.length;
  const targets = computeTargets(total);
  const idx = { Beginner: [], Intermediate: [], Advanced: [] };
  questions.forEach((q, i) => {
    const d = VALID_DIFFICULTIES.has(q.difficulty) ? q.difficulty : 'Beginner';
    idx[d].push(i);
  });

  // Helper to move one index from src to dest
  const moveOne = (src, dest) => {
    if (idx[src].length === 0) return false;
    const i = idx[src].pop();
    idx[dest].push(i);
    questions[i].difficulty = dest;
    return true;
  };

  // Demote excess Advanced -> Intermediate -> Beginner
  while (idx['Advanced'].length > targets.adv) {
    if (idx['Intermediate'].length < targets.inter) {
      moveOne('Advanced', 'Intermediate');
    } else {
      moveOne('Advanced', 'Beginner');
    }
  }
  // Demote excess Intermediate -> Beginner
  while (idx['Intermediate'].length > targets.inter) {
    moveOne('Intermediate', 'Beginner');
  }
  // Promote to meet Advanced target
  while (idx['Advanced'].length < targets.adv) {
    if (!moveOne('Intermediate', 'Advanced')) {
      moveOne('Beginner', 'Advanced');
    }
  }
  // Promote to meet Intermediate target
  while (idx['Intermediate'].length < targets.inter) {
    moveOne('Beginner', 'Intermediate');
  }

  return analyzeDistribution(questions);
}

function processQuizFile(filePath, foundationalSlugs) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let quiz;
  try {
    quiz = JSON.parse(raw);
  } catch (e) {
    console.error(`  ❌ Failed to parse ${path.basename(filePath)}: ${e.message}`);
    return false;
  }
  if (!Array.isArray(quiz.questions)) return false;

  // Infer moduleSlug from file name if missing
  if (!quiz.moduleSlug || typeof quiz.moduleSlug !== 'string') {
    quiz.moduleSlug = path.basename(filePath, '.json');
  }

  let modified = false;
  quiz.questions = quiz.questions.map((q) => {
    const nq = { ...q };
    if (ensureQuestionDifficulty(nq)) modified = true;
    return nq;
  });

  const isFoundational = foundationalSlugs.includes(quiz.moduleSlug);
  let finalCounts = analyzeDistribution(quiz.questions);
  if (isFoundational) {
    finalCounts = enforceDistribution(quiz.questions);
    modified = true; // distribution adjustments may have updated values
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
    const { Beginner: b, Intermediate: i, Advanced: a } = finalCounts;
    console.log(
      `  ✓ ${path.basename(filePath)} updated (Beginner=${b}, Intermediate=${i}, Advanced=${a})`
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
  const foundationalSlugs = getFoundationalSlugs();
  console.log('Foundational modules:', foundationalSlugs.join(', ') || '(none)');

  const files = fs.readdirSync(QUIZZES_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No quiz JSON files found.');
    return;
  }
  console.log(`🔧 Enforcing difficulty across ${files.length} quiz files...`);
  let updatedCount = 0;
  for (const f of files) {
    const fp = path.join(QUIZZES_DIR, f);
    const ok = processQuizFile(fp, foundationalSlugs);
    if (ok) updatedCount++;
  }
  console.log(`✅ Completed. Files updated: ${updatedCount}/${files.length}`);
}

main();