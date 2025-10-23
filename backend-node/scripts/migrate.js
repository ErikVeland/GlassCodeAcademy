const sequelize = require('../src/config/database');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

function printEnvHint(error) {
  const hasUrl = !!process.env.DATABASE_URL;
  const hasDiscrete = !!process.env.DB_HOST && !!process.env.DB_NAME && !!process.env.DB_USER;
  if (!hasUrl && !hasDiscrete) {
    console.error('\nEnvironment variables missing for DB connection.');
    console.error('Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.');
    console.error('Examples:');
    console.error('  DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('  DB_DIALECT=postgres DB_HOST=host DB_PORT=5432 DB_NAME=dbname DB_USER=user DB_PASSWORD=pass');
    console.error('\nOriginal error:', error && error.message ? error.message : error);
  }
}

function createMigrator(sequelizeInstance) {
  return new Umzug({
    migrations: {
      glob: ['../src/migrations/*.js', { cwd: __dirname }],
    },
    context: sequelizeInstance.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: sequelizeInstance }),
    logger: console,
  });
}

(async () => {
  try {
    await sequelize.authenticate();

    if (process.env.NODE_ENV === 'test') {
      // In test mode, avoid Umzug complexity; use sync on sqlite
      await sequelize.sync({ force: true });
      console.log('Test mode: database synced successfully');
      process.exit(0);
    }

    const migrator = createMigrator(sequelize);
    await migrator.up();
    console.log('Migrations executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Failed to run database migrations');
    printEnvHint(error);
    console.error(error);
    process.exit(1);
  }
})();