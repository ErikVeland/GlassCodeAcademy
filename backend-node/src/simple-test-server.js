const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Create Express server
const app = express();

// App Configuration
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
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

// Mount routes for testing
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/academies', require('./routes/academyRoutes'));
app.use('/api/content', require('./routes/contentManagementRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Route not found'
    }
  });
});

module.exports = app;