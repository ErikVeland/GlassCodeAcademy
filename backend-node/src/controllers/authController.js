const { register, login } = require('../services/authService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const registerController = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    logger.info('User registration attempt', { email });
    
    const result = await register({
      email,
      password,
      firstName,
      lastName
    });
    
    logger.info('User registered successfully', { userId: result.user.id, email });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('User registration failed', { 
      email: req.body.email,
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('User login attempt', { email });
    
    const result = await login(email, password);
    
    logger.info('User logged in successfully', { userId: result.user.id, email });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('User login failed', { 
      email: req.body.email,
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error.message
      }
    });
  }
};

module.exports = {
  registerController,
  loginController
};