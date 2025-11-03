const {
  getUserCertificates,
  getCertificateById,
  isUserEligibleForCertificate,
  generateCertificate,
  revokeCertificate,
  verifyCertificate,
} = require('../services/certificateService');

const getUserCertificatesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const certificates = await getUserCertificates(userId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: certificates,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getCertificateByIdController = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const certificate = await getCertificateById(certificateId);

    if (!certificate) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Certificate not found',
        instance: req.originalUrl,
      };
      return res.status(404).json(errorResponse);
    }

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: certificate,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const checkCertificateEligibilityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const isEligible = await isUserEligibleForCertificate(userId, courseId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        isEligible,
        userId,
        courseId,
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const generateCertificateController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const additionalData = req.body;

    const certificate = await generateCertificate(userId, courseId, additionalData);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: certificate,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const revokeCertificateController = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;
    const certificate = await revokeCertificate(certificateId, reason);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: certificate,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const verifyCertificateController = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const verificationResult = await verifyCertificate(certificateId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: verificationResult,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getUserCertificatesController,
  getCertificateByIdController,
  checkCertificateEligibilityController,
  generateCertificateController,
  revokeCertificateController,
  verifyCertificateController,
};