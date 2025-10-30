module.exports = {
  testEnvironment: 'node',
  // Ensure Jest scans both project root and src for tests
  roots: ['<rootDir>', '<rootDir>/src'],
  // Explicitly include tests in root and under src
  testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/src/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/*.js',
    '!src/models/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // Load environment variables (including root-level .env) before tests run
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: [],
  // Handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!uuid)/'
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid')
  },
  // Transform ES modules to CommonJS
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};