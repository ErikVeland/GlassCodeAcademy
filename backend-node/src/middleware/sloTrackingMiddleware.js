const { recordHttpRequest } = require('../utils/metrics');

// SLO tracking middleware to monitor SLI compliance
const sloTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Function to record SLO metrics
  const recordSloMetrics = () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const method = req.method;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;

    // Record HTTP request metrics for SLO tracking
    recordHttpRequest(method, route, statusCode, duration);

    // Check if this request meets our SLO targets
    const latencySloTarget = 0.2; // 200ms for 95% of requests
    const errorRateSloTarget = 0.05; // 5% error rate

    // Record SLO compliance metrics
    const currentSpan = require('@opentelemetry/api').trace.getActiveSpan();
    if (currentSpan) {
      // Add SLO compliance information to the span
      currentSpan.setAttribute('slo.latency.target', latencySloTarget);
      currentSpan.setAttribute('slo.latency.actual', duration);
      currentSpan.setAttribute(
        'slo.latency.compliant',
        duration <= latencySloTarget
      );

      const isError = statusCode >= 500;
      currentSpan.setAttribute('slo.error_rate.target', errorRateSloTarget);
      currentSpan.setAttribute('slo.error_rate.is_error', isError);

      // Calculate error budget consumption
      if (isError) {
        currentSpan.setAttribute('slo.error_budget.consumed', 1);
      }
    }
  };

  // Record metrics when response finishes
  res.on('finish', recordSloMetrics);

  // Record metrics when response closes (in case of errors)
  res.on('close', () => {
    // Only record if not already recorded
    if (!res.headersSent) {
      recordSloMetrics();
    }
  });

  next();
};

module.exports = sloTrackingMiddleware;
