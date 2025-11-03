const authenticate = require('./authMiddleware');
const authorize = require('./authorizeMiddleware');

// Compatibility adapter for routes importing '../middleware/auth'
// Expose authenticateToken and requireAdmin to match expected named exports
module.exports = {
  authenticateToken: authenticate,
  requireAdmin: authorize('admin'),
};
