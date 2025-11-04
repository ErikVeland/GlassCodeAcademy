// Simple noop middleware for development
const noopMiddleware = (req, res, next) => {
  next();
};

// General rate limiter
const generalLimiter = noopMiddleware;

// Strict rate limiter for auth endpoints
const strictLimiter = noopMiddleware;

// API key rate limiter
const apiKeyLimiter = noopMiddleware;

// User-specific rate limiter (for authenticated users)
const userRateLimiter = noopMiddleware;

module.exports = {
  generalLimiter,
  strictLimiter,
  apiKeyLimiter,
  userRateLimiter,
};
