const { addUserJourneyInfo } = require('../utils/tracing');

// Middleware to track user journey across services
const userJourneyMiddleware = (req, res, next) => {
  try {
    // Extract user information from request
    const userId = req.user
      ? req.user.id
      : req.headers['x-user-id'] || 'anonymous';
    const action = `${req.method} ${req.path}`;

    // Add user journey information to the current span
    addUserJourneyInfo(userId, action, req.params.id || req.query.id || null);

    // Add request information to the span
    const currentSpan = require('@opentelemetry/api').trace.getActiveSpan();
    if (currentSpan) {
      currentSpan.setAttribute('http.method', req.method);
      currentSpan.setAttribute('http.url', req.url);
      currentSpan.setAttribute('http.user_agent', req.get('User-Agent') || '');

      // Add correlation ID if available
      if (req.correlationId) {
        currentSpan.setAttribute('correlation.id', req.correlationId);
      }
    }
  } catch (error) {
    // Log error but don't interrupt the request
    console.warn('Failed to add user journey information to trace:', error);
  }

  next();
};

module.exports = userJourneyMiddleware;
