const { v4: uuidv4 } = require('uuid');
const opentelemetry = require('@opentelemetry/api');

// Middleware to generate and attach a correlation ID to each request
const correlationMiddleware = (req, res, next) => {
  // Generate a correlation ID if one doesn't already exist
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();

  // Add correlation ID to response headers for client tracing
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Add correlation ID to OpenTelemetry context
  const span = opentelemetry.trace.getSpan(opentelemetry.context.active());
  if (span) {
    span.setAttribute('correlation.id', req.correlationId);
  }

  next();
};

module.exports = correlationMiddleware;
