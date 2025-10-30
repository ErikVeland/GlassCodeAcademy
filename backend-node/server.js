const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables with a safe default to production when available
(function loadEnv() {
  try {
    const prodPath = path.resolve(__dirname, '.env.production');
    const devPath = path.resolve(__dirname, '.env');
    // Prefer .env.production whenever it exists to avoid accidental dev overrides in prod
    if (fs.existsSync(prodPath)) {
      dotenv.config({ path: prodPath });
      return;
    }
    if (fs.existsSync(devPath)) {
      dotenv.config({ path: devPath });
      return;
    }
    dotenv.config();
  } catch (_) {
    dotenv.config();
  }
})();

// Initialize OpenTelemetry
const { sdk } = require('./src/utils/opentelemetry');

// Database initialization
const initializeDatabase = require('./src/utils/database');
initializeDatabase();

// Create Express server
const app = express();
const PORT = process.env.PORT || 8080;

// Sentry initialization
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Add profiling integration
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });
  
  console.log('Sentry initialized successfully');
  
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
  
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
} else {
  console.log('Sentry DSN not provided, skipping initialization');
}

// Start OpenTelemetry SDK
try {
  sdk.start();
  console.log('OpenTelemetry SDK started');
} catch (error) {
  console.error('Error starting OpenTelemetry SDK:', error);
}

// App Configuration
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging

// Add correlation ID middleware
const correlationMiddleware = require('./src/middleware/correlationMiddleware');
app.use(correlationMiddleware);

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Server is running',
      timestamp: new Date().toISOString()
    }
  });
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/profile', require('./src/routes/profileRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/admin/academies', require('./src/routes/academyRoutes'));
app.use('/api/content', require('./src/routes/contentManagementRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/modules', require('./src/routes/moduleRoutes'));
app.use('/api/lessons', require('./src/routes/lessonRoutes'));
app.use('/api/progress', require('./src/routes/progressRoutes'));
app.use('/api/quiz', require('./src/routes/quizRoutes'));
app.use('/api/tiers', require('./src/routes/tierRoutes'));

// Error handling middleware
app.use(require('./src/middleware/errorMiddleware'));

// 404 handler
app.use('*', (req, res) => {
  const errorResponse = {
    type: 'https://glasscode/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: 'The requested resource was not found',
    instance: req.originalUrl,
    traceId: req.correlationId
  };
  
  res.status(404).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch(error => console.error('Error shutting down OpenTelemetry SDK:', error))
    .finally(() => process.exit(0));
});

module.exports = app;