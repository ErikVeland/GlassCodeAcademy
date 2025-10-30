const { getAllTiers } = require('../services/tierService');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tier-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const getAllTiersController = async (req, res, next) => {
  try {
    logger.info('Fetching all tiers', { correlationId: req.correlationId });
    const tiers = await getAllTiers();

    // Return as record keyed by tier.key to ease frontend usage
    const record = {};
    tiers.forEach(t => {
      record[t.key] = {
        id: t.id,
        key: t.key,
        level: t.level,
        title: t.title,
        description: t.description,
        focusArea: t.focusArea,
        color: t.color,
        learningObjectives: t.learningObjectives
      };
    });

    logger.info('Tiers fetched', { count: tiers.length, correlationId: req.correlationId });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: record
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching tiers', { 
      error: error.message, 
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getAllTiersController
};