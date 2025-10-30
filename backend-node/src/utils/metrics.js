const opentelemetry = require('@opentelemetry/api');

// Get the meter instance
const meter = opentelemetry.metrics.getMeter('glasscode-backend');

// Create custom metrics
const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  unit: 'seconds',
});

const httpRequestCount = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
  unit: 'requests',
});

const dbQueryDuration = meter.createHistogram('db_query_duration_seconds', {
  description: 'Database query duration in seconds',
  unit: 'seconds',
});

const businessOperationDuration = meter.createHistogram('business_operation_duration_seconds', {
  description: 'Business operation duration in seconds',
  unit: 'seconds',
});

const userActivityCounter = meter.createCounter('user_activity_total', {
  description: 'Total user activities',
  unit: 'activities',
});

const quizAttemptCounter = meter.createCounter('quiz_attempts_total', {
  description: 'Total quiz attempts',
  unit: 'attempts',
});

const lessonProgressCounter = meter.createCounter('lesson_progress_updates_total', {
  description: 'Total lesson progress updates',
  unit: 'updates',
});

const errorCounter = meter.createCounter('errors_total', {
  description: 'Total errors',
  unit: 'errors',
});

// Function to record HTTP request metrics
const recordHttpRequest = (method, route, statusCode, duration) => {
  httpRequestDuration.record(duration, {
    method: method,
    route: route,
    status_code: statusCode.toString(),
  });
  
  httpRequestCount.add(1, {
    method: method,
    route: route,
    status_code: statusCode.toString(),
  });
};

// Function to record database query metrics
const recordDbQuery = (operation, duration) => {
  dbQueryDuration.record(duration, {
    operation: operation,
  });
};

// Function to record business operation metrics
const recordBusinessOperation = (operation, duration, userId) => {
  businessOperationDuration.record(duration, {
    operation: operation,
    user_id: userId,
  });
};

// Function to record user activity
const recordUserActivity = (activity, userId) => {
  userActivityCounter.add(1, {
    activity: activity,
    user_id: userId,
  });
};

// Function to record quiz attempt
const recordQuizAttempt = (userId, moduleId, success) => {
  quizAttemptCounter.add(1, {
    user_id: userId,
    module_id: moduleId,
    success: success.toString(),
  });
};

// Function to record lesson progress update
const recordLessonProgress = (userId, lessonId, completed) => {
  lessonProgressCounter.add(1, {
    user_id: userId,
    lesson_id: lessonId,
    completed: completed.toString(),
  });
};

// Function to record error
const recordError = (errorType, userId, endpoint) => {
  errorCounter.add(1, {
    error_type: errorType,
    user_id: userId,
    endpoint: endpoint,
  });
};

module.exports = {
  recordHttpRequest,
  recordDbQuery,
  recordBusinessOperation,
  recordUserActivity,
  recordQuizAttempt,
  recordLessonProgress,
  recordError,
};