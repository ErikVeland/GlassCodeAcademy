const jwt = require('jsonwebtoken');

/**
 * Authentication Test Helpers
 * Utilities for generating test tokens and users
 */

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const JWT_EXPIRES_IN = '1h';

/**
 * Generate a valid JWT token for testing
 * @param {Object} payload - Token payload
 * @param {number} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
function generateTestToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'student',
  };

  const tokenPayload = { ...defaultPayload, ...payload };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Generate admin token
 * @returns {string} JWT token
 */
function generateAdminToken() {
  return generateTestToken({
    id: 1,
    email: 'admin@example.com',
    role: 'admin',
  });
}

/**
 * Generate instructor token
 * @returns {string} JWT token
 */
function generateInstructorToken() {
  return generateTestToken({
    id: 2,
    email: 'instructor@example.com',
    role: 'instructor',
  });
}

/**
 * Generate student token
 * @returns {string} JWT token
 */
function generateStudentToken() {
  return generateTestToken({
    id: 3,
    email: 'student@example.com',
    role: 'student',
  });
}

/**
 * Generate guest token
 * @returns {string} JWT token
 */
function generateGuestToken() {
  return generateTestToken({
    id: 4,
    email: 'guest@example.com',
    role: 'guest',
  });
}

/**
 * Decode a JWT token without verification (for testing)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateTestToken,
  generateAdminToken,
  generateInstructorToken,
  generateStudentToken,
  generateGuestToken,
  decodeToken,
  JWT_SECRET,
};
