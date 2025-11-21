import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
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

// Use Sequelize with Umzug for migrations
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

function printEnvHint(error) {
  const hasUrl = !!process.env.DATABASE_URL;
  if (!hasUrl) {
    console.error('\nEnvironment variables missing for DB connection.');
    console.error('Set DATABASE_URL.');
    console.error('Example:');
    console.error('  DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error(
      '\nOriginal error:',
      error && error.message ? error.message : error
    );
  }
}

(async () => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const isTest = process.env.NODE_ENV === 'test';
    const useRealDbForTests =
      (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';

    if (isTest && !useRealDbForTests) {
      // In test mode with sqlite, avoid migration complexity
      console.log(
        'Test mode: Skipping database migrations (use real DB for tests if needed)'
      );
      process.exit(0);
    }

    // Set up Sequelize
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false, // Set to console.log if you want to see SQL queries
    });

    // Set up Umzug for running migrations
    const umzug = new Umzug({
      migrations: {
        glob: ['../migrations/*.js', { cwd: __dirname }],
        resolve: async ({ name, path, context }) => {
          // Adjust the migration from the migrations folder to match the expected Umzug interface
          // Use dynamic import for ES modules
          const migrationModule = await import(path);
          const migration = migrationModule.default || migrationModule;
          return {
            name,
            up: async () =>
              migration.up({ queryInterface: context, Sequelize }),
            down: async () =>
              migration.down({ queryInterface: context, Sequelize }),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({
        sequelize,
        modelName: 'SequelizeMeta', // Default table name for migration metadata
      }),
      logger: console,
    });

    // Run pending migrations
    console.log('Running Sequelize migrations...');
    await umzug.up();
    console.log('Sequelize migrations executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Failed to run database migrations');
    printEnvHint(error);
    console.error(error);
    process.exit(1);
  }
})();
