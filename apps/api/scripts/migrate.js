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

// Use Prisma migrate instead of Sequelize
const { execSync } = require('child_process');

function printEnvHint(error) {
  const hasUrl = !!process.env.DATABASE_URL;
  if (!hasUrl) {
    console.error('\nEnvironment variables missing for DB connection.');
    console.error('Set DATABASE_URL.');
    console.error('Example:');
    console.error('  DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('\nOriginal error:', error && error.message ? error.message : error);
  }
}

(async () => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const isTest = process.env.NODE_ENV === 'test';
    const useRealDbForTests = (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';

    if (isTest && !useRealDbForTests) {
      // In test mode with sqlite, avoid migration complexity
      console.log('Test mode: Skipping database migrations (use real DB for tests if needed)');
      process.exit(0);
    }

    // Run Prisma migrations
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Prisma migrations executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Failed to run database migrations');
    printEnvHint(error);
    console.error(error);
    process.exit(1);
  }
})();