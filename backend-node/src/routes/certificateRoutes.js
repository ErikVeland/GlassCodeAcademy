const express = require('express');
const {
  getUserCertificatesController,
  getCertificateByIdController,
  checkCertificateEligibilityController,
  generateCertificateController,
  revokeCertificateController,
  verifyCertificateController,
} = require('../controllers/certificateController');
const authenticate = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimitMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

const router = express.Router();

// User routes (authenticated)
router.get(
  '/',
  authenticate,
  generalLimiter,
  getUserCertificatesController
);

router.get(
  '/my-certificates',
  authenticate,
  generalLimiter,
  getUserCertificatesController
);

router.get(
  '/:certificateId',
  authenticate,
  generalLimiter,
  getCertificateByIdController
);

router.get(
  '/eligibility/:courseId',
  authenticate,
  generalLimiter,
  checkCertificateEligibilityController
);

router.post(
  '/generate/:courseId',
  authenticate,
  generalLimiter,
  generateCertificateController
);

// Public verification route (no authentication required)
router.get(
  '/verify/:certificateId',
  generalLimiter,
  verifyCertificateController
);

// Admin routes (authenticated + authorized)
router.post(
  '/revoke/:certificateId',
  authenticate,
  authorizeRoles(['admin']),
  generalLimiter,
  revokeCertificateController
);

module.exports = router;