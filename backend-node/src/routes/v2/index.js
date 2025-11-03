/**
 * API v2 Routes Index
 * 
 * Consolidated router for all API v2 endpoints.
 * Provides RESTful routes for multi-tenant academy management,
 * content versioning, workflows, and validation.
 * 
 * @module routes/v2/index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const academyRoutes = require('./academyRoutes');
const membershipRoutes = require('./membershipRoutes');
const departmentRoutes = require('./departmentRoutes');
const versioningRoutes = require('./versioningRoutes');
const workflowRoutes = require('./workflowRoutes');
const validationRoutes = require('./validationRoutes');

/**
 * Mount route modules
 * 
 * Base path: /api/v2
 */

// Academy management routes
router.use('/academies', academyRoutes);

// Membership routes (includes both /academies/:id/members and /memberships)
router.use('/', membershipRoutes);

// Department routes (includes both /academies/:id/departments and /departments)
router.use('/', departmentRoutes);

// Content versioning routes
router.use('/', versioningRoutes);

// Workflow and approval routes
router.use('/', workflowRoutes);

// Validation routes
router.use('/', validationRoutes);

/**
 * API v2 Health Check
 * GET /api/v2/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    version: '2.0.0',
    services: {
      academyManagement: 'operational',
      membership: 'operational',
      departments: 'operational',
      versioning: 'operational',
      workflows: 'operational',
      validation: 'operational',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * API v2 Info
 * GET /api/v2
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    version: '2.0.0',
    name: 'GlassCode Academy API v2',
    description: 'Enterprise-grade multi-tenant academy management API',
    endpoints: {
      academies: '/api/v2/academies',
      memberships: '/api/v2/memberships',
      departments: '/api/v2/departments',
      versioning: '/api/v2/versions',
      workflows: '/api/v2/workflows',
      approvals: '/api/v2/approvals',
      validation: '/api/v2/validation',
    },
    features: [
      'Multi-tenant academy isolation',
      'Hierarchical permissions',
      'Content version control',
      'Approval workflows',
      'Quality validation',
      'Department hierarchies',
      'Bulk operations',
    ],
    documentation: '/api/v2/docs',
  });
});

module.exports = router;
