const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    const errorResponse = {
      type: 'https://glasscode/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'Validation failed',
      instance: req.originalUrl,
      traceId: req.correlationId,
      validationErrors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    };

    return res.status(400).json(errorResponse);
  }

  next();
};

module.exports = validate;
