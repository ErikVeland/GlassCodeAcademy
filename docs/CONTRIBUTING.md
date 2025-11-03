# Contributing

This guide documents the quiz/lesson content schema and how the codebase validates, auto-fixes, and renders it. Follow these steps to keep content consistent and high quality.

## Schema Overview

All interview questions use a standardized JSON structure (see `docs/QUESTION_TEMPLATE.md` for full details and examples).

- `id` (number | string): Unique identifier.
- `topic` (string): Lesson-aligned category (e.g., "React Basics").
- `type` (string): `multiple-choice` | `open-ended` | `coding-challenge`.
- `difficulty` (string): `Beginner` | `Intermediate` | `Advanced`.
- `question` (string): Clear prompt text.
- `choices` (string[4]): Exactly 4 choices for multiple-choice only.
- `correctAnswer` (number): Index `0–3` for multiple-choice only.
- `acceptedAnswers` (string[]): Optional list of alternative correct free-text answers for `open-ended` questions.
- `fixedChoiceOrder` (boolean): For `multiple-choice` questions only. When `true`, choices render in author-provided order (no shuffling).
- `choiceLabels` ("letters" | "none"): Presentation style for `multiple-choice`. Use `"letters"` to show `A./B./C./D.` labels (requires `fixedChoiceOrder: true`).
- `explanation` (string): Why the correct answer is correct; teaching-oriented.
- `industryContext` (string): Real-world relevance and context.

Key rules
- Multiple-choice: include exactly 4 `choices` and a `correctAnswer` index.
- Open-ended: omit `choices` and `correctAnswer`.
- Coding-challenge: specify input/output and constraints; keep scope realistic.

Multiple-choice authoring rules
- If the question references lettered options (e.g., "Choose A and C"), set `fixedChoiceOrder: true` and `choiceLabels: "letters"`.
- If a choice is "All of the above" or "None of the above", keep it in its intended position and set `fixedChoiceOrder: true`.
- Avoid ambiguous options like "Both" unless the referenced options are clear with letter labels.
- Do not use `acceptedAnswers` for `multiple-choice` questions.

Authoring guidance: See the “Question Type Do’s/Don’ts” section in `docs/QUESTION_TEMPLATE.md`.

## Validation Workflow

Content is validated in multiple stages:

- `scripts/validate-content.js`: Main validator run in CI mode and pre-commit.
  - Verifies required fields, formats, and consistency with `content/registry.json`.
  - Adds soft warnings for missing `topic` or type/difficulty conflicts.
- `scripts/final-validation.js`: Additional structural checks (presence of fields, choice counts, correct answer validity).
- `scripts/basic-validation.sh` and `scripts/validate-routes.sh`: Existence, JSON validity, pairing to modules, and orphaned files.
- `scripts/link-checker.js`: Scans lesson/quiz content for broken or suspicious links.

Run CI validation locally

```
npm run ci:validate
```

Pre-commit hook
- The pre-commit hook runs `CI=1 node scripts/validate-content.js` and blocks commits on validation failures.

Pre-push hook
- A pre-push hook runs `npm run typecheck` to block pushes when TypeScript errors are present.
- Ensure Git uses the repo-managed hooks by running: `git config core.hooksPath scripts`.
- Keep heavy checks out of pre-commit to maintain fast local workflows; typecheck runs at push.

Preflight checks before push
- A full preflight script is available at `scripts/preflight.sh` and is invoked automatically by the pre-push hook.
- It performs:
  - Content validation: `CI=1 node scripts/validate-content.js`
  - Route validation: `bash scripts/validate-routes.sh` (skips if `jq` unavailable)
  - Optional link checks: enable with `PRECHECK_LINKS=1`
  - Frontend lint: `npm run lint`
  - TypeScript typecheck: `npm run typecheck`
- GitKraken compatibility: enable hooks via `git config core.hooksPath scripts`. GitKraken respects local hooks when hooksPath is set.

## Auto-Fix Tools

Use these scripts to automatically resolve common issues:

- `scripts/auto-fix-quiz-warnings.js`
  - Infers missing `topic` from module context.
  - Normalizes `difficulty` values to the allowed set.
  - Removes multiple-choice-only fields from non-multiple-choice questions.
  - Syncs `correctIndex`/`correctAnswer` when needed.
- `scripts/fix-quiz-files.js`: General cleanup and consistency fixes.
- `scripts/fix-json-errors.js`: Repairs malformed JSON where possible.

Run auto-fixes

```
node scripts/auto-fix-quiz-warnings.js
node scripts/fix-quiz-files.js
```

## Code Wrapping

To keep inline code formatting consistent in question text and explanations, the repository auto-wraps known code tokens and keywords:

- `scripts/wrap-code-in-quizzes.js`: Wraps framework/library terms (React/Next.js, Angular, Svelte), GraphQL tokens, CLI commands, configuration filenames, and SQL keywords in backticks.
- `scripts/wrap-code-in-lessons.js`: Performs similar wrapping across lesson content.

Run wrappers

```
node scripts/wrap-code-in-quizzes.js
node scripts/wrap-code-in-lessons.js
```

## Runtime Handling (Backend/UI)

- Backend answer validation (example: `glasscode/backend/Services/DataService.cs`):
  - Open-ended questions count as correct by design; `choices`/`correctAnswer` are not required.
  - Multiple-choice questions validate `answerIndex` against `correctAnswer`.
- GraphQL types expose fields for lessons and interview questions (see `glasscode/backend/GraphQL/*Types.cs`).
- Frontend renders quizzes per type, showing choices only for multiple-choice and handling open-ended prompts accordingly.

## Contribution Steps

1. Create or update quiz JSON following `docs/QUESTION_TEMPLATE.md`.
2. Run wrappers and auto-fixes:
   - `node scripts/wrap-code-in-quizzes.js`
   - `node scripts/auto-fix-quiz-warnings.js`
3. Validate locally: `npm run ci:validate`.
4. Preview the UI:
   - Frontend: `npm run dev` from `glasscode/frontend` and visit the local URL.
5. Commit changes; pre-commit validation will run automatically.

## Quick Start: Adding a New Quiz

Use this checklist to add or update quiz content quickly:

1. Pick the module slug from `content/registry.json`.
2. Edit or create `content/quizzes/<module-slug>.json` following `docs/QUESTION_TEMPLATE.md`.
3. Ensure each question has correct `type`, `topic`, and `difficulty`.
4. For multiple-choice, include 4 `choices` and `correctAnswer` (0–3).
5. Run wrappers and fixes:
   - `node scripts/wrap-code-in-quizzes.js`
   - `node scripts/auto-fix-quiz-warnings.js`
6. Validate locally: `npm run ci:validate`.
7. Preview UI: `npm run dev` in `glasscode/frontend` and open the local URL.
8. Commit; the pre-commit hook will verify content again.

By following this workflow, content stays consistent, readable, and production-ready across modules.