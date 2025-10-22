const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'error-middleware' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const errorHandler = (err, req, res, next) => {
  // Log the error with request context
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Joi validation error
  if (err.isJoi) {
    logger.warn('Validation error', {
      details: err.details,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.details
      }
    });
  }
  
  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    logger.warn('Sequelize validation error', {
      errors: err.errors,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }
  
  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    logger.warn('Sequelize unique constraint error', {
      errors: err.errors,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
    
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT_ERROR',
        message: 'Resource already exists',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }
  
  // Default error
  logger.error('Internal server error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong!'
    }
  });
};

module.exports = errorHandler;