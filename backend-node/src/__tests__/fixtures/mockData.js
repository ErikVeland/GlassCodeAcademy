/**
 * Mock Data Factory
 * Provides consistent test data for various models
 */

/**
 * Create a mock user
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user data
 */
function createMockUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // bcrypt hash format
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock module
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock module data
 */
function createMockModule(overrides = {}) {
  return {
    id: 1,
    slug: 'test-module',
    title: 'Test Module',
    description: 'A test module for testing',
    tier: 1,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock lesson
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock lesson data
 */
function createMockLesson(overrides = {}) {
  return {
    id: 1,
    moduleId: 1,
    slug: 'test-lesson',
    title: 'Test Lesson',
    content: { sections: [] },
    order: 1,
    estimatedMinutes: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock quiz
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock quiz data
 */
function createMockQuiz(overrides = {}) {
  return {
    id: 1,
    lessonId: 1,
    questionText: 'What is a test?',
    questionType: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: 'Test explanation',
    difficulty: 'beginner',
    tier: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock progress data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock progress data
 */
function createMockProgress(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    lessonId: 1,
    completed: false,
    timeSpentSeconds: 0,
    lastAccessedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock quiz attempt data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock quiz attempt data
 */
function createMockQuizAttempt(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    quizId: 1,
    selectedAnswer: 'A',
    isCorrect: true,
    attemptedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock certificate data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock certificate data
 */
function createMockCertificate(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    courseId: 1,
    certificateId: 'CERT-123456',
    issuedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

module.exports = {
  createMockUser,
  createMockModule,
  createMockLesson,
  createMockQuiz,
  createMockProgress,
  createMockQuizAttempt,
  createMockCertificate,
};
