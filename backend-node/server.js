const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database initialization
const initializeDatabase = require('./src/utils/database');
initializeDatabase();

// Create Express server
const app = express();
const PORT = process.env.PORT || 8080;

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

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/profile', require('./src/routes/profileRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/content', require('./src/routes/contentManagementRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/modules', require('./src/routes/moduleRoutes'));
app.use('/api/lessons', require('./src/routes/lessonRoutes'));
app.use('/api/progress', require('./src/routes/progressRoutes'));
app.use('/api/quiz', require('./src/routes/quizRoutes'));

// Error handling middleware
app.use(require('./src/middleware/errorMiddleware'));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;