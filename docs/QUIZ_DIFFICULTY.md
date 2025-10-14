# Quiz Difficulty: Tier-Weighted Selection and Reporting

This document explains how quiz question difficulty is handled across modules, how tier-based weighting influences per-attempt selection, and how to generate a prediction report from your current quiz pools.

## Overview

- Each module has a `tier` (e.g., `foundational`, `core`, `advanced`, `quality`, `specialized`) in `content/registry.json`.
- We define target difficulty weights per tier to bias selection towards appropriate challenge levels.
- During quiz attempts, selection aims to approximate these weights based on available pool counts; it caps by availability and backfills shortfalls in priority order.
- A reporting script computes predicted per-attempt distributions given pool composition and quiz length per module.

## Tier Weights

Default weights, expressed as proportions of a quiz attempt:

- `foundational`: `beginner 70%`, `intermediate 20%`, `advanced 10%`
- `core`: `beginner 40%`, `intermediate 40%`, `advanced 20%`
- `advanced`: `beginner 15%`, `intermediate 35%`, `advanced 50%`
- Other tiers (`quality`, `specialized`) currently default to `core` weights unless customized.

You can adjust these weights in `scripts/quiz-difficulty-report.js` (`TIER_WEIGHTS` map) and re-run the report.

## Selection Behavior (Approximate, Not Strict)

- Determine quiz length: `metadata.thresholds.minQuizQuestions` → `thresholds.requiredQuestions` → default `14`.
- Compute target counts: `weights × quiz length`, rounded and adjusted to sum exactly.
- Cap targets by available pool per difficulty.
- If there’s a shortfall, backfill to other difficulties in descending weight priority where availability exists.
- This yields per-attempt distributions that reflect both tier intent and the real pool composition; individual attempts may vary due to randomness.

Note: Current runtime selector picks randomly from the pool (with recent-history exclusion) and does not enforce weights strictly per attempt. The report predicts what weighted selection would produce given today’s pools.

## Reporting Script

Script: `scripts/quiz-difficulty-report.js`

What it does:
- Loads `content/registry.json` to enumerate modules and look up tiers and quiz lengths.
- Reads each module’s quiz file from `content/quizzes/<module>.json`.
- Normalizes question `difficulty` (beginner/intermediate/advanced) and counts pool distribution.
- Uses tier weights and quiz length to predict per-attempt counts.
- Prints a module-by-module summary with pool sizes, weights, and predicted counts.

### Run

```
node scripts/quiz-difficulty-report.js
```

Example output snippet:

```
=== Tier Weights ===
foundational: beginner 70%, intermediate 20%, advanced 10%
core: beginner 40%, intermediate 40%, advanced 20%
advanced: beginner 15%, intermediate 35%, advanced 50%

=== Module Predictions ===
- Programming Fundamentals (programming-fundamentals) [tier: foundational]
  Pool size: 54
  Pool difficulties: beginner=37, intermediate=10, advanced=7
  Quiz length: 15
  Weights: beginner=70%, intermediate=20%, advanced=10%
  Predicted per attempt: beginner=10, intermediate=3, advanced=2
```

### Customizing Weights

- Edit the `TIER_WEIGHTS` object in `scripts/quiz-difficulty-report.js`.
- Re-run the script to see updated predictions.
- If you want runtime selection to follow these weights, we can wire the weighting logic into `frontend/src/app/modules/[moduleSlug]/quiz/start/page.tsx` to partition the pool and sample quotas per attempt (with backfill and history exclusion).

## Data Requirements

- Each question should have a `difficulty`. If missing, content scripts can infer from tags or default to `beginner`.
- Foundational modules should maintain ~70-20-10 distribution at the pool level for consistency.

## Next Steps

- Decide whether to enforce weighted selection at runtime per attempt.
- Optionally set custom weights for `quality` and `specialized` tiers.
- Add a CI check to flag pool distributions that cannot meet desired tier weights.