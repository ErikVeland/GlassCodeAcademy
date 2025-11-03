const {
  getUserCourseProgress,
  updateUserLessonProgress,
  getUserLessonProgress,
  getCourseLessonProgress,
  getUserQuizStatistics,
  getLeaderboard,
} = require('../services/progressService');

const getUserCourseProgressController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await getUserCourseProgress(userId, courseId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress || {},
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateUserLessonProgressController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const progress = await updateUserLessonProgress(userId, lessonId, updates);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserLessonProgressController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const progress = await getUserLessonProgress(userId, lessonId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress || {},
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getCourseLessonProgressController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await getCourseLessonProgress(userId, courseId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: progress,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getUserQuizStatisticsController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const statistics = await getUserQuizStatistics(userId);

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: statistics,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLeaderboardController = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await getLeaderboard(parseInt(limit));

    // RFC 7807 compliant success response
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: leaderboard,
    };

    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getUserCourseProgressController,
  updateUserLessonProgressController,
  getUserLessonProgressController,
  getCourseLessonProgressController,
  getUserQuizStatisticsController,
  getLeaderboardController,
};
