module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/*.js',
    '!src/models/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // Load environment variables (including root-level .env) before tests run
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: []
};