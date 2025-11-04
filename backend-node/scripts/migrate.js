const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env from backend-node/.env or .env.production, preferring production file when NODE_ENV=production
(() => {
  const isProd = process.env.NODE_ENV === 'production';
  const envCandidates = isProd
    ? [
      path.resolve(__dirname, '../.env.production'),
      path.resolve(__dirname, '../.env'),
    ]
    : [
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../.env.production'),
    ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
})();

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
      glob: ['../migrations/*.js', { cwd: __dirname }],
    },
    context: { queryInterface: sequelizeInstance.getQueryInterface(), Sequelize: sequelizeInstance.constructor }, // Pass both queryInterface and Sequelize constructor
    storage: new SequelizeStorage({ sequelize: sequelizeInstance }),
    logger: console,
  });
}

(async () => {
  try {
    await sequelize.authenticate();

    const isTest = process.env.NODE_ENV === 'test';
    const useRealDbForTests = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';

    if (isTest && !useRealDbForTests) {
      // In test mode with sqlite, avoid Umzug complexity; use sync
      await sequelize.sync({ force: true });
      console.log('Test mode (sqlite): database synced successfully');
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