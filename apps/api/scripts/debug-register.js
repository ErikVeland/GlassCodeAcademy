/* eslint-disable no-console */
process.env.NODE_ENV = 'test';

(async () => {
  const app = require('../server');
  const request = require('supertest');
  try {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();