/* eslint-disable no-console */
process.env.NODE_ENV = 'test';

(async () => {
  try {
    const {
      setupTestDb,
      teardownTestDb,
      clearDatabase,
    } = require('../src/__tests__/fixtures/testDatabase');
    const app = require('../server');
    const request = require('supertest');

    await setupTestDb();
    await clearDatabase();

    // Simple health check request to ensure app loads without starting server or DB init
    const res = await request(app).get('/health');
    console.log(
      'Health response:',
      res.status,
      res.body && res.body.data && res.body.data.message
    );

    await teardownTestDb();
    console.log('Debug auth test env completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Debug auth test env failed:', err);
    process.exit(1);
  }
})();
