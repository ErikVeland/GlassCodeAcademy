#!/usr/bin/env node
// Wrap code-like tokens in lesson content JSON files with backticks for proper formatting.
// Targets: content/lessons/**/*.json
// Fields: intro, description, title, objectives[], code.explanation, pitfalls[].mistake/solution, exercises[].prompt
// Note: Does NOT alter code blocks like code.example, exercises[].starterCode, output/codeExample.

const fs = require('fs');
const path = require('path');

const lessonsDir = path.resolve(__dirname, '..', 'content', 'lessons');

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
    // DOM selection methods with arguments
    { regex: /(?<!`)document\.getElementById\([^)]*\)(?!`)/g },
    { regex: /(?<!`)document\.querySelector\([^)]*\)(?!`)/g },
    { regex: /(?<!`)getElementsByClassName\b(?!`)/g },
    // Common JS function and variable patterns
    { regex: /(?<!`)(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(?:\([^)]*\)\s*=>|function\b)(?!`)/g },
    { regex: /(?<!`)function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)\s*\{[^}]*\}(?!`)/g },
    // Git commands (specific common forms)
    { regex: /(?<!`)git\s+checkout\s+-b\s+[a-zA-Z0-9._/-]+(?!`)/g },
    { regex: /(?<!`)git\s+switch\s+-c\s+[a-zA-Z0-9._/-]+(?!`)/g },
    { regex: /(?<!`)git\s+branch\s+[a-zA-Z0-9._/-]+(?!`)/g },
    // CSS properties commonly referenced inline
    { regex: /(?<!`)justify-content:\s*center(?!`)/g },
    { regex: /(?<!`)align-items:\s*center(?!`)/g },
    { regex: /(?<!`)place-items:\s*center(?!`)/g },
    { regex: /(?<!`)display:\s*(flex|grid|block)(?!`)/g },
    // Teleport 'to' prop and quoted tokens
    { regex: /(?<!`)'to'(?!`)/g },
  ];

  let result = text;
  for (const { regex } of patterns) {
    result = result.replace(regex, (m) => `\`${m}\``);
  }
  return result;
}

function processLesson(lesson) {
  const updated = { ...lesson };

  // Basic text fields
  if (typeof updated.title === 'string') updated.title = wrapTokens(updated.title);
  if (typeof updated.intro === 'string') updated.intro = wrapTokens(updated.intro);
  if (typeof updated.description === 'string') updated.description = wrapTokens(updated.description);

  // Objectives array
  if (Array.isArray(updated.objectives)) {
    updated.objectives = updated.objectives.map((obj) =>
      typeof obj === 'string' ? wrapTokens(obj) : obj
    );
  }

  // Code explanation (do not touch code.example/language)
  if (updated.code && typeof updated.code === 'object') {
    const code = { ...updated.code };
    if (typeof code.explanation === 'string') {
      code.explanation = wrapTokens(code.explanation);
    }
    updated.code = code;
  }

  // Pitfalls: wrap mistake/solution
  if (Array.isArray(updated.pitfalls)) {
    updated.pitfalls = updated.pitfalls.map((p) => {
      const np = { ...p };
      if (typeof np.mistake === 'string') np.mistake = wrapTokens(np.mistake);
      if (typeof np.solution === 'string') np.solution = wrapTokens(np.solution);
      return np;
    });
  }

  // Exercises: wrap prompt (do not touch starterCode/expectedOutput)
  if (Array.isArray(updated.exercises)) {
    updated.exercises = updated.exercises.map((ex) => {
      const ne = { ...ex };
      if (typeof ne.prompt === 'string') ne.prompt = wrapTokens(ne.prompt);
      return ne;
    });
  }

  return updated;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Skipping invalid JSON: ${filePath}`);
    return false;
  }

  let modified = false;

  if (Array.isArray(data)) {
    const updatedLessons = data.map((lesson) => {
      const updated = processLesson(lesson);
      // Detect changes via stringified comparison (shallow for our wrapped fields)
      if (JSON.stringify(lesson) !== JSON.stringify(updated)) modified = true;
      return updated;
    });
    data = updatedLessons;
  } else if (data && Array.isArray(data.lessons)) {
    // Some lesson files may be wrapped in an object
    data.lessons = data.lessons.map((lesson) => {
      const updated = processLesson(lesson);
      if (JSON.stringify(lesson) !== JSON.stringify(updated)) modified = true;
      return updated;
    });
  } else {
    // Unknown structure; skip
    return false;
  }

  if (modified) {
    const output = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, output, 'utf-8');
  }
  return modified;
}

function listLessonFiles(startDir) {
  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listLessonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(lessonsDir)) {
    console.error(`Lessons directory not found: ${lessonsDir}`);
    process.exit(1);
  }

  const files = listLessonFiles(lessonsDir);
  if (files.length === 0) {
    console.log('No lesson JSON files found.');
    return;
  }

  let updatedCount = 0;
  for (const file of files) {
    const ok = processFile(file);
    if (ok) {
      updatedCount++;
      console.log(`Updated: ${path.relative(lessonsDir, file)}`);
    }
  }
  console.log(`Completed. Files updated: ${updatedCount}/${files.length}`);
}

main();