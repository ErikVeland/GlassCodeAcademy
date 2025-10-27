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
  } catch (_) {
    dotenv.config();
  }
})();

const sequelize = require('../src/config/database');
const { Course, Module, Lesson, LessonQuiz } = require('../src/models');

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

    const counts = {
      courses_total: await Course.count(),
      courses_published: await Course.count({ where: { isPublished: true } }),
      modules_total: await Module.count(),
      modules_published: await Module.count({ where: { isPublished: true } }),
      lessons_total: await Lesson.count(),
      lessons_published: await Lesson.count({ where: { isPublished: true } }),
      quizzes_total: await LessonQuiz.count(),
      quizzes_published: await LessonQuiz.count({ where: { isPublished: true } }),
    };
    console.log('Counts:', counts);

    const sampleCourse = await Course.findOne({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
      include: [{ model: Module, as: 'modules', include: [{ model: Lesson, as: 'lessons' }] }],
    }).catch(() => null);

    if (sampleCourse) {
      console.log('Recent published course:', {
        id: sampleCourse.id,
        title: sampleCourse.title,
        slug: sampleCourse.slug,
        moduleCount: sampleCourse.modules ? sampleCourse.modules.length : 0,
        lessonCount:
          sampleCourse.modules && sampleCourse.modules[0] && sampleCourse.modules[0].lessons
            ? sampleCourse.modules[0].lessons.length
            : 0,
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