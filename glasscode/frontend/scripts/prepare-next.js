/*
 Ensures .next/package.json exists before Next build.
 Some Next versions expect this for standalone builds.
*/

async function main() {
  const fs = await import('fs');
  const path = await import('path');

  const projectRoot = typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : process.cwd();
  const nextDir = path.join(projectRoot, '.next');
  const srcPkg = path.join(projectRoot, 'package.json');
  const destPkg = path.join(nextDir, 'package.json');

  try {
    fs.mkdirSync(nextDir, { recursive: true });
    if (fs.existsSync(srcPkg)) {
      fs.copyFileSync(srcPkg, destPkg);
      console.log('[prepare-next] Created .next/package.json from project package.json');
    } else {
      const stub = JSON.stringify({ name: 'frontend', private: true }, null, 2);
      fs.writeFileSync(destPkg, stub, 'utf8');
      console.log('[prepare-next] Wrote stub .next/package.json');
    }
  } catch (err) {
    console.error('[prepare-next] Failed to prepare .next/package.json:', err);
    process.exitCode = 1;
  }
}

main();