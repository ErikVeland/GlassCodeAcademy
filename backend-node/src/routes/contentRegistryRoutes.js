const express = require('express');
const fs = require('fs');
const path = require('path');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const Academy = require('../models/academyModel');

const router = express.Router();

// GET /api/content/registry
// Serve academy-specific registry data
router.get('/registry', generalLimiter, async (req, res, next) => {
  try {
    // Get the default academy
    const defaultAcademy = await Academy.findOne({
      where: { slug: 'glasscode-academy' },
    });

    if (!defaultAcademy) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'https://glasscode/errors/not-found',
          title: 'Academy Not Found',
          status: 404,
          detail: 'Default academy not found',
        },
      });
    }

    // Load registry file
    const registryPath = path.join(__dirname, '../../../content/registry.json');

    if (!fs.existsSync(registryPath)) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'https://glasscode/errors/not-found',
          title: 'Registry Not Found',
          status: 404,
          detail: 'Registry file not found',
        },
      });
    }

    const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

    // Return registry data directly (not wrapped in data object) to match frontend expectations
    return res.status(200).json({
      ...registryData,
      version: 'db', // Indicate this is from database/api
      lastUpdated: new Date().toISOString(),
      academy: {
        id: defaultAcademy.id,
        name: defaultAcademy.name,
        slug: defaultAcademy.slug,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
