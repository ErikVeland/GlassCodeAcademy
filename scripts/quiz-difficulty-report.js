#!/usr/bin/env node
/**
 * Quiz Difficulty Distribution Report
 * - Defines tier-based weighted distributions
 * - Scans registry modules and quiz pools
 * - Predicts per-attempt difficulty counts given pool and quiz length
 */

const fs = require('fs');
const path = require('path');

// Tier-based weights (more weighted towards the tier’s difficulty)
// Keys are lowercase canonical difficulty strings
const TIER_WEIGHTS = {
  foundational: { beginner: 0.7, intermediate: 0.2, advanced: 0.1 },
  core: { beginner: 0.4, intermediate: 0.4, advanced: 0.2 },
  advanced: { beginner: 0.15, intermediate: 0.35, advanced: 0.5 },
};

function normalizeDifficulty(val) {
  if (!val) return null;
  const s = String(val).toLowerCase();
  if (['beginner', 'basic', 'easy'].includes(s)) return 'beginner';
  if (['intermediate', 'medium'].includes(s)) return 'intermediate';
  if (['advanced', 'hard'].includes(s)) return 'advanced';
  return null;
}

function findQuizFile(moduleSlug) {
  const possiblePaths = [
    path.join(process.cwd(), 'content', 'quizzes', `${moduleSlug}.json`),
    path.join(process.cwd(), '..', 'content', 'quizzes', `${moduleSlug}.json`),
    path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`),
    path.join(process.cwd(), 'glasscode', 'content', 'quizzes', `${moduleSlug}.json`),
    path.join('/srv/academy', 'content', 'quizzes', `${moduleSlug}.json`),
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function loadRegistry() {
  const registryPaths = [
    path.join(process.cwd(), 'content', 'registry.json'),
    path.join(process.cwd(), '..', 'content', 'registry.json'),
    path.join(process.cwd(), '..', '..', 'content', 'registry.json'),
    path.join(process.cwd(), 'glasscode', 'content', 'registry.json'),
    path.join('/srv/academy', 'content', 'registry.json'),
  ];
  for (const p of registryPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return { data: JSON.parse(raw), path: p };
      }
    } catch {}
  }
  return { data: null, path: null };
}

function countPoolByDifficulty(questions) {
  const counts = { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 };
  for (const q of questions || []) {
    const d = normalizeDifficulty(q.difficulty) || inferDifficultyFromTags(q.tags || q.topics || q.topic);
    if (!d) counts.unknown++;
    else counts[d]++;
  }
  return counts;
}

function inferDifficultyFromTags(tagsVal) {
  if (!tagsVal) return null;
  const tags = Array.isArray(tagsVal) ? tagsVal : [String(tagsVal)];
  const t = tags.map((x) => String(x).toLowerCase());
  if (t.some((s) => ['beginner', 'basic', 'easy'].includes(s))) return 'beginner';
  if (t.some((s) => ['intermediate', 'medium'].includes(s))) return 'intermediate';
  if (t.some((s) => ['advanced', 'hard'].includes(s))) return 'advanced';
  return null;
}

function predictAttemptCounts(poolCounts, weights, quizLength) {
  // Weighted targets
  const target = {
    beginner: Math.round(weights.beginner * quizLength),
    intermediate: Math.round(weights.intermediate * quizLength),
    advanced: Math.round(weights.advanced * quizLength),
  };
  // Adjust rounding to sum exactly to quizLength
  let sum = target.beginner + target.intermediate + target.advanced;
  const diff = quizLength - sum;
  if (diff !== 0) {
    // Apply diff to the largest weight bucket for stability
    const order = Object.entries(weights).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const key = order[0];
    target[key] += diff;
  }
  // Respect pool limits, backfill deficits proportionally from others
  const out = { ...target };
  const poolAvail = { ...poolCounts };
  // Cap to available
  for (const k of ['beginner', 'intermediate', 'advanced']) {
    out[k] = Math.min(out[k], poolAvail[k]);
  }
  // If sum < quizLength, distribute remainder based on remaining availability
  const current = out.beginner + out.intermediate + out.advanced;
  let remaining = quizLength - current;
  if (remaining > 0) {
    const availList = [
      ['beginner', poolAvail.beginner - out.beginner],
      ['intermediate', poolAvail.intermediate - out.intermediate],
      ['advanced', poolAvail.advanced - out.advanced],
    ];
    // Fill in priority order: higher weight first
    const priority = Object.entries(weights)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    while (remaining > 0) {
      let filled = false;
      for (const k of priority) {
        const idx = availList.findIndex(([kk]) => kk === k);
        if (idx !== -1 && availList[idx][1] > 0) {
          out[k]++;
          availList[idx][1]--;
          remaining--;
          filled = true;
          if (remaining === 0) break;
        }
      }
      if (!filled) break; // No more availability
    }
  }
  return out;
}

function main() {
  const { data: registry, path: registryPath } = loadRegistry();
  if (!registry) {
    console.error('Could not locate content/registry.json');
    process.exit(1);
  }
  const modules = registry.modules || [];

  console.log('=== Tier Weights ===');
  for (const [tier, w] of Object.entries(TIER_WEIGHTS)) {
    console.log(`${tier}: beginner ${Math.round(w.beginner * 100)}%, intermediate ${Math.round(w.intermediate * 100)}%, advanced ${Math.round(w.advanced * 100)}%`);
  }
  console.log('');
  console.log(`Using registry: ${registryPath}`);
  console.log('');

  const results = [];
  for (const mod of modules) {
    const slug = mod.slug;
    const tier = String(mod.tier || 'core').toLowerCase();
    const weights = TIER_WEIGHTS[tier] || TIER_WEIGHTS.core;
    const quizLength = (mod.metadata && mod.metadata.thresholds && mod.metadata.thresholds.minQuizQuestions) || (mod.thresholds && mod.thresholds.requiredQuestions) || 14;
    const quizPath = findQuizFile(slug);
    let poolCounts = { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 };
    let poolSize = 0;
    if (quizPath) {
      try {
        const raw = fs.readFileSync(quizPath, 'utf8');
        const quiz = JSON.parse(raw);
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        poolCounts = countPoolByDifficulty(questions);
        poolSize = questions.length;
      } catch (e) {
        // keep defaults
      }
    }
    const prediction = predictAttemptCounts(poolCounts, weights, quizLength);
    results.push({ slug, title: mod.title, tier, quizLength, poolSize, poolCounts, weights, prediction, quizPath });
  }

  console.log('=== Module Predictions ===');
  for (const r of results) {
    console.log(`\n- ${r.title} (${r.slug}) [tier: ${r.tier}]`);
    console.log(`  Pool size: ${r.poolSize}${r.quizPath ? ` (${r.quizPath})` : ' (no local quiz found)'}`);
    console.log(`  Pool difficulties: beginner=${r.poolCounts.beginner}, intermediate=${r.poolCounts.intermediate}, advanced=${r.poolCounts.advanced}, unknown=${r.poolCounts.unknown}`);
    console.log(`  Quiz length: ${r.quizLength}`);
    console.log(`  Weights: beginner=${Math.round(r.weights.beginner * 100)}%, intermediate=${Math.round(r.weights.intermediate * 100)}%, advanced=${Math.round(r.weights.advanced * 100)}%`);
    console.log(`  Predicted per attempt: beginner=${r.prediction.beginner}, intermediate=${r.prediction.intermediate}, advanced=${r.prediction.advanced}`);
  }

  console.log('\nDone.');
}

main();