const { sequelize } = require('../../src/config/database');

async function checkTables() {
  try {
    console.log('Checking table structures...');

    // Check courses table structure
    const courseColumns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Courses table columns:');
    courseColumns.forEach((column) => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });

    // Check modules table structure
    const moduleColumns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'modules'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('\nModules table columns:');
    moduleColumns.forEach((column) => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });

    // Check lessons table structure
    const lessonColumns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('\nLessons table columns:');
    lessonColumns.forEach((column) => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error checking table structures:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  checkTables();
}
