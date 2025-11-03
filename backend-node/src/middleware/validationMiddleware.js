const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    // RFC 7807 shape with added compatibility fields expected by some tests
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
      // Legacy-compatible fields
      success: false,
      message: `Validation failed: ${error.details.map((d) => d.path.join('.')).join(', ')}`,
    };

    return res.status(400).json(errorResponse);
  }

  next();
};

module.exports = validate;
