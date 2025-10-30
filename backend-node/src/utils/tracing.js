const opentelemetry = require('@opentelemetry/api');

// Get the tracer instance
const tracer = opentelemetry.trace.getTracer('glasscode-backend');

// Function to create a span for a business operation
const createBusinessOperationSpan = (operationName, attributes = {}) => {
  return tracer.startSpan(operationName, {
    attributes: {
      'business.operation': operationName,
      ...attributes,
    },
  });
};

// Function to wrap an async function with tracing
const traceAsyncFunction = async (operationName, fn, attributes = {}) => {
  const span = createBusinessOperationSpan(operationName, attributes);

  try {
    const result = await opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      fn
    );
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message,
    });
    span.setAttribute('error', true);
    span.setAttribute('error.message', error.message);
    throw error;
  } finally {
    span.end();
  }
};

// Function to wrap a synchronous function with tracing
const traceSyncFunction = (operationName, fn, attributes = {}) => {
  const span = createBusinessOperationSpan(operationName, attributes);

  try {
    const result = opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      fn
    );
    span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: opentelemetry.SpanStatusCode.ERROR,
      message: error.message,
    });
    span.setAttribute('error', true);
    span.setAttribute('error.message', error.message);
    throw error;
  } finally {
    span.end();
  }
};

// Function to add database query information to the current span
const addDatabaseQueryInfo = (queryText, queryParameters = []) => {
  const currentSpan = opentelemetry.trace.getActiveSpan();
  if (currentSpan) {
    currentSpan.setAttribute('db.query.text', queryText);
    if (queryParameters.length > 0) {
      currentSpan.setAttribute(
        'db.query.parameters',
        JSON.stringify(queryParameters)
      );
    }
  }
};

// Function to add user journey information to the current span
const addUserJourneyInfo = (userId, action, resourceId = null) => {
  const currentSpan = opentelemetry.trace.getActiveSpan();
  if (currentSpan) {
    currentSpan.setAttribute('user.id', userId);
    currentSpan.setAttribute('user.action', action);
    if (resourceId) {
      currentSpan.setAttribute('resource.id', resourceId);
    }
  }
};

module.exports = {
  createBusinessOperationSpan,
  traceAsyncFunction,
  traceSyncFunction,
  addDatabaseQueryInfo,
  addUserJourneyInfo,
};
