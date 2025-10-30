const { recordHttpRequest } = require('../utils/metrics');

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Function to record metrics after response is finished
  const recordMetrics = () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const method = req.method;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;
    
    recordHttpRequest(method, route, statusCode, duration);
  };
  
  // Record metrics when response finishes
  res.on('finish', recordMetrics);
  
  // Record metrics when response closes (in case of errors)
  res.on('close', () => {
    // Only record if not already recorded
    if (!res.headersSent) {
      recordMetrics();
    }
  });
  
  next();
};

module.exports = metricsMiddleware;