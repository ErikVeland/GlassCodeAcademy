#!/usr/bin/env node
/*
 Wrap code-like tokens in quiz content JSON files with backticks for proper formatting.
 Targets: content/quizzes/*.json
 Fields: question, choices[], explanation
*/

const fs = require('fs');
const path = require('path');

const quizzesDir = path.resolve(__dirname, '..', 'content', 'quizzes');

function wrapTokens(text) {
  if (typeof text !== 'string' || !text.trim()) return text;

  const patterns = [
    // Vue app creation variants
    { regex: /(?<!`)Vue\.createApp\(\{\}\)(?!`)/g },
    { regex: /(?<!`)new Vue\(\{\}\)(?!`)/g },
    { regex: /(?<!`)Vue\.app\(\{\}\)(?!`)/g },
    { regex: /(?<!`)Vue\.init\(\{\}\)(?!`)/g },
    // Vue directives
    { regex: /(?<!`)v-(model|bind|on|show|if|for)(?!`)/g },
    // Vue API
    { regex: /(?<!`)defineAsyncComponent\(\)(?!`)/g },
    { regex: /(?<!`)keep-alive(?!`)/g },
    { regex: /(?<!`)(shallowRef|markRaw)(?!`)/g },
    // Playwright API
    { regex: /(?<!`)page\.(route|mock|intercept|fulfill)\(\)(?!`)/g },
    // Teleport 'to' prop
    { regex: /(?<!`)'to'(?!`)/g },
  ];

  let result = text;
  for (const { regex } of patterns) {
    result = result.replace(regex, (m) => `\`${m}\``);
  }
  return result;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`Skipping invalid JSON: ${filePath}`);
    return false;
  }

  if (Array.isArray(json.questions)) {
    json.questions = json.questions.map((q) => {
      const updated = { ...q };
      if (typeof updated.question === 'string') {
        updated.question = wrapTokens(updated.question);
      }
      if (typeof updated.explanation === 'string') {
        updated.explanation = wrapTokens(updated.explanation);
      }
      if (Array.isArray(updated.choices)) {
        updated.choices = updated.choices.map((choice) =>
          typeof choice === 'string' ? wrapTokens(choice) : choice
        );
      }
      return updated;
    });
  }

  const output = JSON.stringify(json, null, 2) + '\n';
  fs.writeFileSync(filePath, output, 'utf-8');
  return true;
}

function main() {
  if (!fs.existsSync(quizzesDir)) {
    console.error(`Quizzes directory not found: ${quizzesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(quizzesDir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No quiz JSON files found.');
    return;
  }

  let updatedCount = 0;
  for (const file of files) {
    const fp = path.join(quizzesDir, file);
    const ok = processFile(fp);
    if (ok) {
      updatedCount++;
      console.log(`Updated: ${file}`);
    }
  }
  console.log(`Completed. Files updated: ${updatedCount}/${files.length}`);
}

main();