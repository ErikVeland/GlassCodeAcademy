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

    // Expanded ecosystem patterns (Angular, React/Next.js, Svelte, GraphQL, config files, CLI, SQL)
    { regex: /(?<!`)\bngFor\b(?!`)/g },
    { regex: /(?<!`)\bngIf\b(?!`)/g },
    { regex: /(?<!`)@Input\(\)(?!`)/g },
    { regex: /(?<!`)@Output\(\)(?!`)/g },
    { regex: /(?<!`)\buseEffect\b(?!`)/g },
    { regex: /(?<!`)\buseState\b(?!`)/g },
    { regex: /(?<!`)\bgetServerSideProps\b(?!`)/g },
    { regex: /(?<!`)\bgetStaticProps\b(?!`)/g },
    { regex: /(?<!`)next\.(config|env)\.(js|ts)(?!`)/g },
    { regex: /(?<!`)svelte:(head|options|fragment)(?!`)/g },
    { regex: /(?<!`)\bGraphQL\b(?!`)/g },
    { regex: /(?<!`)\bschema\b(?!`)/g },
    { regex: /(?<!`)\bresolver\b(?!`)/g },
    { regex: /(?<!`)\bquery\b(?!`)/g },
    { regex: /(?<!`)\bmutation\b(?!`)/g },
    { regex: /(?<!`)\bsubscription\b(?!`)/g },
    { regex: /(?<!`)docker-compose\.ya?ml(?!`)/g },
    { regex: /(?<!`)tailwind\.config\.(js|ts)(?!`)/g },
    { regex: /(?<!`)tsconfig\.json(?!`)/g },
    { regex: /(?<!`)package\.json(?!`)/g },
    { regex: /(?<!`)eslint\.(json|js|cjs)(?!`)/g },
    { regex: /(?<!`)npm\s+(run|install|start|test)(?!`)/g },
    { regex: /(?<!`)\bnpx\b(?!`)/g },
    { regex: /(?<!`)git\s+(commit|push|pull|merge|rebase)(?!`)/g },
    { regex: /(?<!`)\bpnpm\b(?!`)/g },
    { regex: /(?<!`)\byarn\b(?!`)/g },
    { regex: /(?<!`)\bprisma\b(?!`)/g },
    { regex: /(?<!`)\bsequelize\b(?!`)/g },
    { regex: /(?<!`)\btypeorm\b(?!`)/g },
    { regex: /(?<!`)\bJOIN\b(?!`)/g },
    { regex: /(?<!`)LEFT JOIN(?!`)/g },
    { regex: /(?<!`)RIGHT JOIN(?!`)/g },
    { regex: /(?<!`)INNER JOIN(?!`)/g },
    { regex: /(?<!`)GROUP BY(?!`)/g },
    { regex: /(?<!`)ORDER BY(?!`)/g },
    { regex: /(?<!`)\bSELECT\b(?!`)/g },
    { regex: /(?<!`)INSERT INTO(?!`)/g },
    { regex: /(?<!`)\bUPDATE\b(?!`)/g },
    { regex: /(?<!`)DELETE FROM(?!`)/g },
    { regex: /(?<!`)PRIMARY KEY(?!`)/g },
    { regex: /(?<!`)FOREIGN KEY(?!`)/g },
    { regex: /(?<!`)\bUNIQUE\b(?!`)/g },
    { regex: /(?<!`)\bINDEX\b(?!`)/g }
  ];

  let result = text;
  for (const { regex } of patterns) {
    result = result.replace(regex, (m) => `\`${m}\``);
  }
  return result;
}

// Heuristic: wrap entire choice if it looks like code, while preserving apostrophes as-is
function shouldWrapChoice(choice) {
  if (typeof choice !== 'string') return false;
  const alreadyWrapped = choice.startsWith('`') && choice.endsWith('`');
  if (alreadyWrapped) return false;
  const codeyPatterns = [
    /\bfunction\s+[a-zA-Z_$][a-zA-Z0-9_$]*\(/,
    /\b(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*/,
    /=>/,
    /document\.[a-zA-Z]+\(/,
    /\bgit\s+[a-z-]+\b/,
    /<\s*[a-zA-Z][^>]*>/,
    /\b(display|justify-content|align-items|place-items):\s*/,
  ];
  return codeyPatterns.some((re) => re.test(choice));
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
        updated.choices = updated.choices.map((choice) => {
          if (typeof choice !== 'string') return choice;
          let c = wrapTokens(choice);
          if (shouldWrapChoice(c)) {
            c = `\`${c}\``;
          }
          return c;
        });
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