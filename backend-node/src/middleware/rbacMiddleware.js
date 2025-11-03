// Compatibility adapter for legacy imports expecting authorizeRoles
// Re-uses the existing authorize middleware which accepts variadic roles
const authorize = require('./authorizeMiddleware');

// Accepts either an array of roles or a single role string
const authorizeRoles = (roles = []) => {
  if (Array.isArray(roles)) {
    return authorize(...roles);
  }
  return authorize(roles);
};

module.exports = { authorizeRoles };
