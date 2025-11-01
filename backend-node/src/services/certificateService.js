const { Certificate, User, Course, UserProgress } = require('../models');
const {
  recordBusinessOperation,
} = require('../utils/metrics');
const {
  traceAsyncFunction,
  addDatabaseQueryInfo,
} = require('../utils/tracing');
const { v4: uuidv4 } = require('uuid');

// Generate a unique certificate ID
const generateCertificateId = () => {
  return `CERT-${uuidv4().toUpperCase().replace(/-/g, '').substring(0, 12)}`;
};

// Get all certificates for a user
const getUserCertificates = async (userId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_certificates',
      async () => {
        const certificates = await Certificate.findAll({
          where: {
            user_id: userId,
            is_revoked: false,
          },
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title', 'description'],
            }
          ],
          order: [['issued_at', 'DESC']],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM certificates WHERE user_id = ? AND is_revoked = false ORDER BY issued_at DESC',
          [userId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_certificates', duration, userId);

        return certificates;
      },
      { userId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_certificates', duration, userId);
    throw new Error(`Error getting user certificates: ${error.message}`);
  }
};

// Get a specific certificate by ID
const getCertificateById = async (certificateId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_certificate_by_id',
      async () => {
        const certificate = await Certificate.findOne({
          where: {
            certificate_id: certificateId,
            is_revoked: false,
          },
          include: [
            {
              model: User,
              as: 'certificateUser',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title', 'description'],
            }
          ],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM certificates WHERE certificate_id = ? AND is_revoked = false',
          [certificateId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_certificate_by_id', duration, 'system');

        return certificate;
      },
      { certificateId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_certificate_by_id', duration, 'system');
    throw new Error(`Error getting certificate: ${error.message}`);
  }
};

// Check if a user is eligible for a certificate for a course
const isUserEligibleForCertificate = async (userId, courseId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'check_user_certificate_eligibility',
      async () => {
        // Get user progress for the course
        const userProgress = await UserProgress.findOne({
          where: {
            user_id: userId,
            course_id: courseId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_progress WHERE user_id = ? AND course_id = ?',
          [userId, courseId]
        );

        if (!userProgress) {
          return false;
        }

        // Check if course is completed
        const isCompleted = userProgress.completedAt !== null;
        
        // Check if progress is 100%
        const isFullyProgressed = userProgress.progressPercentage === 100;

        const isEligible = isCompleted && isFullyProgressed;

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('check_user_certificate_eligibility', duration, userId);

        return isEligible;
      },
      { userId, courseId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('check_user_certificate_eligibility', duration, userId);
    throw new Error(`Error checking certificate eligibility: ${error.message}`);
  }
};

// Generate a certificate for a user
const generateCertificate = async (userId, courseId, additionalData = {}) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'generate_certificate',
      async () => {
        // Check if user is eligible for certificate
        const isEligible = await isUserEligibleForCertificate(userId, courseId);
        
        if (!isEligible) {
          throw new Error('User is not eligible for certificate for this course');
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          where: {
            user_id: userId,
            course_id: courseId,
            is_revoked: false,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM certificates WHERE user_id = ? AND course_id = ? AND is_revoked = false',
          [userId, courseId]
        );

        if (existingCertificate) {
          // Return existing certificate
          const duration = (Date.now() - startTime) / 1000;
          recordBusinessOperation('generate_certificate', duration, userId);
          return existingCertificate;
        }

        // Get user and course information
        const user = await User.findByPk(userId);
        const course = await Course.findByPk(courseId);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM users WHERE id = ?; SELECT * FROM courses WHERE id = ?',
          [userId, courseId]
        );

        if (!user || !course) {
          throw new Error('User or course not found');
        }

        // Get user progress for additional data
        const userProgress = await UserProgress.findOne({
          where: {
            user_id: userId,
            course_id: courseId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_progress WHERE user_id = ? AND course_id = ?',
          [userId, courseId]
        );

        // Calculate grade based on quiz scores (if available)
        let grade = 'Pass';
        let score = userProgress ? userProgress.progressPercentage : null;
        
        if (score !== null) {
          if (score >= 90) grade = 'A';
          else if (score >= 80) grade = 'B';
          else if (score >= 70) grade = 'C';
          else if (score >= 60) grade = 'D';
          else grade = 'F';
        }

        // Create certificate data
        const certificateData = {
          user_id: userId,
          course_id: courseId,
          certificate_id: generateCertificateId(),
          title: `Certificate of Completion - ${course.title}`,
          description: `This certificate is awarded to ${user.firstName} ${user.lastName} for successfully completing the course "${course.title}".`,
          issued_at: new Date(),
          verification_url: `${process.env.BASE_URL || 'https://glasscode.academy'}/api/certificates/verify/${generateCertificateId()}`,
          template: 'default',
          grade,
          score,
          hours: userProgress ? Math.floor(userProgress.totalLessons * 2) : 0, // Estimate 2 hours per lesson
          metadata: {
            userName: `${user.firstName} ${user.lastName}`,
            courseTitle: course.title,
            completionDate: new Date().toISOString(),
            ...additionalData,
          },
        };

        // Create the certificate
        const certificate = await Certificate.create(certificateData);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'INSERT INTO certificates (user_id, course_id, certificate_id, title, description, issued_at, verification_url, template, grade, score, hours, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [certificateData.user_id, certificateData.course_id, certificateData.certificate_id, certificateData.title, certificateData.description, certificateData.issued_at, certificateData.verification_url, certificateData.template, certificateData.grade, certificateData.score, certificateData.hours, JSON.stringify(certificateData.metadata)]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('generate_certificate', duration, userId);

        return certificate;
      },
      { userId, courseId, additionalData }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('generate_certificate', duration, userId);
    throw new Error(`Error generating certificate: ${error.message}`);
  }
};

// Revoke a certificate
const revokeCertificate = async (certificateId, reason = '') => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'revoke_certificate',
      async () => {
        const certificate = await Certificate.findOne({
          where: {
            certificate_id: certificateId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM certificates WHERE certificate_id = ?',
          [certificateId]
        );

        if (!certificate) {
          throw new Error('Certificate not found');
        }

        // Update certificate as revoked
        await certificate.update({
          is_revoked: true,
          metadata: {
            ...certificate.metadata,
            revokedAt: new Date().toISOString(),
            revocationReason: reason,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'UPDATE certificates SET is_revoked = true, metadata = ? WHERE certificate_id = ?',
          [JSON.stringify(certificate.metadata), certificateId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('revoke_certificate', duration, 'system');

        return certificate;
      },
      { certificateId, reason }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('revoke_certificate', duration, 'system');
    throw new Error(`Error revoking certificate: ${error.message}`);
  }
};

// Verify a certificate
const verifyCertificate = async (certificateId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'verify_certificate',
      async () => {
        const certificate = await Certificate.findOne({
          where: {
            certificate_id: certificateId,
          },
          include: [
            {
              model: User,
              as: 'certificateUser',
              attributes: ['firstName', 'lastName'],
            },
            {
              model: Course,
              as: 'course',
              attributes: ['title'],
            }
          ],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM certificates WHERE certificate_id = ?',
          [certificateId]
        );

        if (!certificate) {
          throw new Error('Certificate not found');
        }

        if (certificate.isRevoked) {
          throw new Error('Certificate has been revoked');
        }

        const verificationResult = {
          isValid: true,
          certificateId: certificate.certificateId,
          issuedTo: `${certificate.user.firstName} ${certificate.user.lastName}`,
          courseTitle: certificate.course.title,
          issuedAt: certificate.issuedAt,
          expiresAt: certificate.expiresAt,
          grade: certificate.grade,
          score: certificate.score,
        };

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('verify_certificate', duration, 'system');

        return verificationResult;
      },
      { certificateId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('verify_certificate', duration, 'system');
    throw new Error(`Error verifying certificate: ${error.message}`);
  }
};

module.exports = {
  getUserCertificates,
  getCertificateById,
  isUserEligibleForCertificate,
  generateCertificate,
  revokeCertificate,
  verifyCertificate,
};