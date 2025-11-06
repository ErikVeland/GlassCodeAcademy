const { sequelize } = require('./backend-node/src/models');

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    // Run raw queries to get counts
    const [courseResults] = await sequelize.query('SELECT COUNT(*) as count FROM courses');
    const [moduleResults] = await sequelize.query('SELECT COUNT(*) as count FROM modules');
    const [lessonResults] = await sequelize.query('SELECT COUNT(*) as count FROM lessons');
    const [quizResults] = await sequelize.query('SELECT COUNT(*) as count FROM lesson_quizzes');
    
    console.log(`Courses: ${courseResults[0].count}`);
    console.log(`Modules: ${moduleResults[0].count}`);
    console.log(`Lessons: ${lessonResults[0].count}`);
    console.log(`Quizzes: ${quizResults[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

checkDatabase();