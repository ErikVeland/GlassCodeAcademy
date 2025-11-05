/* eslint-env node */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env, prefer .env.production in production
(function loadEnv() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const candidates = isProd
      ? [path.resolve(__dirname, '../.env.production'), path.resolve(__dirname, '../.env')]
      : [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../.env.production')];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        break;
      }
    }
  } catch {
    dotenv.config();
  }
})();

const sequelize = require('../src/config/database');

async function main() {
  try {
    console.log('--- DB Debug Summary ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL || '(none)');
    console.log(
      'Discrete:',
      JSON.stringify(
        {
          DB_DIALECT: process.env.DB_DIALECT,
          DB_HOST: process.env.DB_HOST,
          DB_PORT: process.env.DB_PORT,
          DB_NAME: process.env.DB_NAME,
          DB_USER: process.env.DB_USER,
          DB_SSL: process.env.DB_SSL,
        },
        null,
        2
      )
    );

    await sequelize.authenticate();
    console.log('Connection OK');

    // Ensure associations for joins
    const { initializeAssociations } = require('../src/models');
    initializeAssociations();

    // Use raw SQL for counts to avoid any model/table-name casing mismatches
    const [[coursesTotal]] = await sequelize.query('SELECT count(*)::int AS count FROM courses');
    const [[coursesPublished]] = await sequelize.query('SELECT count(*)::int AS count FROM courses WHERE is_published = true');
    const [[modulesTotal]] = await sequelize.query('SELECT count(*)::int AS count FROM modules');
    const [[modulesPublished]] = await sequelize.query('SELECT count(*)::int AS count FROM modules WHERE is_published = true');
    const [[lessonsTotal]] = await sequelize.query('SELECT count(*)::int AS count FROM lessons');
    const [[lessonsPublished]] = await sequelize.query('SELECT count(*)::int AS count FROM lessons WHERE is_published = true');
    const [[quizzesTotal]] = await sequelize.query('SELECT count(*)::int AS count FROM lesson_quizzes');
    const [[quizzesPublished]] = await sequelize.query('SELECT count(*)::int AS count FROM lesson_quizzes WHERE is_published = true');

    console.log('Counts:', {
      courses_total: coursesTotal.count,
      courses_published: coursesPublished.count,
      modules_total: modulesTotal.count,
      modules_published: modulesPublished.count,
      lessons_total: lessonsTotal.count,
      lessons_published: lessonsPublished.count,
      quizzes_total: quizzesTotal.count,
      quizzes_published: quizzesPublished.count,
    });

    // Show a recent published course with module/lesson counts via raw SQL
    const [recentCourses] = await sequelize.query(
      `SELECT id, title, slug FROM courses WHERE is_published = true ORDER BY updated_at DESC LIMIT 1`
    );
    if (recentCourses && recentCourses.length > 0) {
      const course = recentCourses[0];
      const [[moduleCount]] = await sequelize.query(
        `SELECT count(*)::int AS count FROM modules WHERE course_id = $1`,
        { bind: [course.id] }
      );
      const [[lessonCount]] = await sequelize.query(
        `SELECT count(*)::int AS count FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)`,
        { bind: [course.id] }
      );
      console.log('Recent published course:', {
        id: course.id,
        title: course.title,
        slug: course.slug,
        moduleCount: moduleCount.count,
        lessonCount: lessonCount.count,
      });
    } else {
      console.log('No published course found.');
    }

    await sequelize.close();
    console.log('--- End Summary ---');
    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

main();