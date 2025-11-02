const {
  getAllBadges,
  getUserBadges,
  awardBadgeToUser,
  checkAndAwardProgressBadges,
  createBadge,
  updateBadge,
  deleteBadge,
} = require('../services/badgeService');
const winston = require('winston');

const getAllBadgesController = async (req, res, next) => {
  try {
    const badges = await getAllBadges();

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: badges,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserBadgesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userBadges = await getUserBadges(userId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: userBadges,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const awardBadgeToUserController = async (req, res, next) => {
  try {
    const { userId, badgeId } = req.params;
    const awardedBy = req.user.id; // The user who is awarding the badge
    
    const userBadge = await awardBadgeToUser(userId, badgeId, awardedBy);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: userBadge,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const checkAndAwardProgressBadgesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const awardedBadges = await checkAndAwardProgressBadges(userId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: awardedBadges,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const createBadgeController = async (req, res, next) => {
  try {
    const badgeData = req.body;
    const badge = await createBadge(badgeData);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: badge,
    };

    res.status(201).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateBadgeController = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    const badgeData = req.body;
    const badge = await updateBadge(badgeId, badgeData);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: badge,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteBadgeController = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    const badge = await deleteBadge(badgeId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: badge,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getAllBadgesController,
  getUserBadgesController,
  awardBadgeToUserController,
  checkAndAwardProgressBadgesController,
  createBadgeController,
  updateBadgeController,
  deleteBadgeController,
};