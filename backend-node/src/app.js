/* eslint-disable no-unused-vars */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

/**
 * Creates and configures the Express application
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableSentry - Whether to enable Sentry error tracking
 * @param {boolean} options.enableMetrics - Whether to enable Prometheus metrics
 * @returns {express.Application} Configured Express app
 */
function createApp(options = {}) {
  const {
    enableSentry = !!process.env.SENTRY_DSN,
    enableMetrics = true,
    disableRateLimit = false,
  } = options;

  const app = express();

  // Sentry initialization (if enabled and DSN provided)
  if (enableSentry && process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });

    console.log('Sentry initialized successfully');

    // Request and tracing handlers
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  } else {
    console.log('Sentry disabled or DSN not provided');
  }

  // Security and CORS
  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));

  // Add correlation ID middleware
  const correlationMiddleware = require('./middleware/correlationMiddleware');
  app.use(correlationMiddleware);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Metrics middleware (if enabled)
  if (enableMetrics) {
    const metricsMiddleware = require('./middleware/metricsMiddleware');
    app.use(metricsMiddleware);

    const sloTrackingMiddleware = require('./middleware/sloTrackingMiddleware');
    app.use(sloTrackingMiddleware);

    const userJourneyMiddleware = require('./middleware/userJourneyMiddleware');
    app.use(userJourneyMiddleware);
  }

  // Rate limiting middleware
  const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
  if (!disableRateLimit) {
    app.use('/api/auth', rateLimitMiddleware.strictLimiter);
    app.use('/api/oauth', rateLimitMiddleware.generalLimiter);
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/oauth', require('./routes/oauthRoutes'));
  app.use('/api/profile', require('./routes/profileRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/admin/academies', require('./routes/academyRoutes'));
  app.use('/api/content', require('./routes/contentManagementRoutes'));
  app.use('/api/courses', require('./routes/courseRoutes'));
  app.use('/api/modules', require('./routes/moduleRoutes'));
  app.use('/api/lessons', require('./routes/lessonRoutes'));
  app.use('/api/progress', require('./routes/progressRoutes'));
  app.use('/api/quiz', require('./routes/quizRoutes'));
  app.use('/api/tiers', require('./routes/tierRoutes'));
  app.use('/api/badges', require('./routes/badgeRoutes'));
  app.use('/api/certificates', require('./routes/certificateRoutes'));
  app.use(
    '/api/api-keys',
    rateLimitMiddleware.apiKeyLimiter,
    require('./routes/apiKeyRoutes')
  );
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/forum', require('./routes/forumRoutes'));
  app.use('/api/announcements', require('./routes/announcementRoutes'));
  app.use('/api/faqs', require('./routes/faqRoutes'));
  app.use('/api/admin/moderation', require('./routes/moderationRoutes'));
  app.use('/api/reports', require('./routes/reportRoutes'));

  // General rate limiting for remaining API routes
  if (!disableRateLimit) {
    app.use('/api/', rateLimitMiddleware.generalLimiter);
  }

  // Sentry error handler (must be before other error handlers)
  if (enableSentry && process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    app.use(Sentry.Handlers.errorHandler());
  }

  // Error handling middleware
  app.use(require('./middleware/errorMiddleware'));

  // 404 handler
  app.use('*', (req, res) => {
    const errorResponse = {
      type: 'https://glasscode/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource was not found',
      instance: req.originalUrl,
      traceId: req.correlationId,
    };

    res.status(404).json(errorResponse);
  });

  return app;
}

module.exports = createApp;
