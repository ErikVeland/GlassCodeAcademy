/*
  Checks backend DB coverage for modules, lessons, and quizzes,
  and compares against the content registry.
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const registryPath = path.join(__dirname, '..', 'content', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const registrySlugs = new Set(registry.modules.map((m) => m.slug));

  const base = 'http://127.0.0.1:8080';

  const modsResp = await fetch(`${base}/api/modules`);
  const modsJson = await modsResp.json();
  const modules = modsJson.data || modsJson || [];

  const missingInDB = [];
  registrySlugs.forEach((slug) => {
    if (!modules.find((m) => m.slug === slug)) missingInDB.push(slug);
  });

  const coverage = [];
  let totalLessons = 0;
  let totalQuizzes = 0;
  for (const m of modules) {
    const lessonsResp = await fetch(`${base}/api/modules/${m.id}/lessons`);
    const lessonsJson = await lessonsResp.json();
    const lessons = lessonsJson.data || lessonsJson || [];

    const quizzesResp = await fetch(`${base}/api/modules/${m.slug}/quiz`);
    const quizzesJson = await quizzesResp.json();
    const quizzes = quizzesJson.data || quizzesJson || [];

    const row = {
      id: m.id,
      slug: m.slug,
      title: m.title,
      lessonCount: Array.isArray(lessons) ? lessons.length : 0,
      quizCount: Array.isArray(quizzes) ? quizzes.length : 0,
      inRegistry: registrySlugs.has(m.slug),
    };
    coverage.push(row);
    if (row.inRegistry) {
      totalLessons += row.lessonCount;
      totalQuizzes += row.quizCount;
    }
  }

  console.log(
    JSON.stringify(
      {
        dbModuleCount: modules.length,
        registryModuleCount: registry.modules.length,
        registryMissingInDB: missingInDB,
        totalLessonsInRegistry: totalLessons,
        totalQuizzesInRegistry: totalQuizzes,
        coverage,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});