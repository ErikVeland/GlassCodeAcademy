/*
 Copies content JSON into Next.js public directory before build.
 Source: ../../content/{lessons,quizzes}
 Dest:  ./public/content/{lessons,quizzes}
*/

function copyDir(fs, path, src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`[copy-content] Source not found, skipping: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(fs, path, srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  // Use dynamic ESM imports to satisfy lint rules
  const fs = await import('fs');
  const path = await import('path');

  const projectRoot = typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : process.cwd();
  const repoRoot = path.resolve(projectRoot, '..', '..');
  const srcLessons = path.join(repoRoot, 'content', 'lessons');
  const srcQuizzes = path.join(repoRoot, 'content', 'quizzes');
  const destBase = path.join(projectRoot, 'public', 'content');
  const destLessons = path.join(destBase, 'lessons');
  const destQuizzes = path.join(destBase, 'quizzes');

  try {
    console.log('[copy-content] Copying lessons...');
    copyDir(fs, path, srcLessons, destLessons);
    console.log('[copy-content] Copying quizzes...');
    copyDir(fs, path, srcQuizzes, destQuizzes);
    
    // Copy registry.json file
    const srcRegistry = path.join(repoRoot, 'content', 'registry.json');
    const destRegistry = path.join(projectRoot, 'public', 'registry.json');
    if (fs.existsSync(srcRegistry)) {
      console.log('[copy-content] Copying registry.json...');
      fs.copyFileSync(srcRegistry, destRegistry);
    } else {
      console.warn('[copy-content] Registry file not found at:', srcRegistry);
    }
    
    console.log('[copy-content] Done.');
  } catch (err) {
    console.error('[copy-content] Error while copying content:', err);
    process.exitCode = 1;
  }
}

main();