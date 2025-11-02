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
      format: winston.format.simple(),
    }),
  ],
});

const registerController = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    logger.info('User registration attempt', { email });

    const result = await register({
      email,
      password,
      firstName,
      lastName,
    });

    logger.info('User registered successfully', {
      userId: result.user.id,
      email,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: result,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    logger.error('User registration failed', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getMeController = async (req, res, next) => {
  try {
    // User is already attached by authenticate middleware
    const user = req.user;

    // Remove sensitive fields
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: userResponse,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Get user profile failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info('User login attempt', { email });

    const result = await login(email, password);

    logger.info('User logged in successfully', {
      userId: result.user.id,
      email,
    });

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('User login failed', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
    });

    if (
      error.message &&
      error.message.toLowerCase().includes('invalid credentials')
    ) {
      const unauthorizedResponse = {
        type: 'https://glasscode/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid credentials',
        instance: req.originalUrl,
      };
      return res.status(401).json(unauthorizedResponse);
    }

    next(error);
  }
};

module.exports = {
  registerController,
  loginController,
  getMeController,
};
