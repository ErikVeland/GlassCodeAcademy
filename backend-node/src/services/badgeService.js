const { Badge, UserBadge, User, UserProgress, QuizAttempt } = require('../models');
const {
  recordBusinessOperation,
} = require('../utils/metrics');
const {
  traceAsyncFunction,
  addDatabaseQueryInfo,
} = require('../utils/tracing');

// Get all badges
const getAllBadges = async () => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_all_badges',
      async () => {
        const badges = await Badge.findAll({
          where: {
            isActive: true,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM badges WHERE is_active = true',
          []
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_all_badges', duration, 'system');

        return badges;
      }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_all_badges', duration, 'system');
    throw new Error(`Error getting badges: ${error.message}`);
  }
};

// Get badges for a specific user
const getUserBadges = async (userId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_badges',
      async () => {
        const userBadges = await UserBadge.findAll({
          where: {
            user_id: userId,
          },
          include: [
            {
              model: Badge,
              as: 'badge',
              attributes: ['id', 'name', 'description', 'icon', 'category', 'points'],
            }
          ],
          order: [['awarded_at', 'DESC']],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_badges WHERE user_id = ? ORDER BY awarded_at DESC',
          [userId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_badges', duration, userId);

        return userBadges;
      },
      { userId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_badges', duration, userId);
    throw new Error(`Error getting user badges: ${error.message}`);
  }
};

// Award a badge to a user
const awardBadgeToUser = async (userId, badgeId, awardedBy = 'system') => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'award_badge_to_user',
      async () => {
        // Check if user already has this badge
        const existingAward = await UserBadge.findOne({
          where: {
            user_id: userId,
            badge_id: badgeId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
          [userId, badgeId]
        );

        if (existingAward) {
          // User already has this badge
          const duration = (Date.now() - startTime) / 1000;
          recordBusinessOperation('award_badge_to_user', duration, userId);
          return existingAward;
        }

        // Award the badge
        const userBadge = await UserBadge.create({
          user_id: userId,
          badge_id: badgeId,
          awarded_by: awardedBy,
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'INSERT INTO user_badges (user_id, badge_id, awarded_by) VALUES (?, ?, ?)',
          [userId, badgeId, awardedBy]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('award_badge_to_user', duration, userId);

        return userBadge;
      },
      { userId, badgeId, awardedBy }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('award_badge_to_user', duration, userId);
    throw new Error(`Error awarding badge to user: ${error.message}`);
  }
};

// Check and award badges based on user progress
const checkAndAwardProgressBadges = async (userId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'check_and_award_progress_badges',
      async () => {
        // Get user progress data
        const userProgress = await UserProgress.findAll({
          where: {
            user_id: userId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_progress WHERE user_id = ?',
          [userId]
        );

        // Get quiz attempts
        const quizAttempts = await QuizAttempt.findAll({
          where: {
            user_id: userId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM quiz_attempts WHERE user_id = ?',
          [userId]
        );

        // Get all active badges
        const badges = await Badge.findAll({
          where: {
            isActive: true,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM badges WHERE is_active = true',
          []
        );

        // Check each badge's criteria
        const awardedBadges = [];
        for (const badge of badges) {
          const criteria = badge.criteria;
          
          // Check if user meets the criteria
          let meetsCriteria = false;
          
          switch (criteria.type) {
            case 'course_completion':
              // Check if user has completed a certain number of courses
              const completedCourses = userProgress.filter(
                (progress) => progress.completedAt
              ).length;
              meetsCriteria = completedCourses >= (criteria.minCourses || 1);
              break;
              
            case 'lesson_completion':
              // Check if user has completed a certain number of lessons
              const completedLessons = userProgress.reduce(
                (total, progress) => total + (progress.completedLessons || 0), 0
              );
              meetsCriteria = completedLessons >= (criteria.minLessons || 1);
              break;
              
            case 'quiz_excellence':
              // Check if user has achieved high scores on quizzes
              if (quizAttempts.length > 0) {
                const averageScore = quizAttempts.reduce(
                  (total, attempt) => total + (parseFloat(attempt.score) || 0), 0
                ) / quizAttempts.length;
                meetsCriteria = averageScore >= (criteria.minAverageScore || 90);
              }
              break;
              
            case 'quiz_participation':
              // Check if user has attempted a certain number of quizzes
              meetsCriteria = quizAttempts.length >= (criteria.minAttempts || 1);
              break;
              
            case 'perfect_score':
              // Check if user has achieved a perfect score on any quiz
              meetsCriteria = quizAttempts.some(
                (attempt) => parseFloat(attempt.score) === 100
              );
              break;
              
            default:
              // Unknown badge type
              break;
          }
          
          // Award badge if criteria are met
          if (meetsCriteria) {
            const awardedBadge = await awardBadgeToUser(userId, badge.id);
            awardedBadges.push(awardedBadge);
          }
        }

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('check_and_award_progress_badges', duration, userId);

        return awardedBadges;
      },
      { userId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('check_and_award_progress_badges', duration, userId);
    throw new Error(`Error checking and awarding progress badges: ${error.message}`);
  }
};

// Create a new badge
const createBadge = async (badgeData) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'create_badge',
      async () => {
        const badge = await Badge.create(badgeData);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'INSERT INTO badges (name, description, icon, criteria, category, points, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [badgeData.name, badgeData.description, badgeData.icon, JSON.stringify(badgeData.criteria), badgeData.category, badgeData.points, badgeData.isActive]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('create_badge', duration, 'system');

        return badge;
      },
      { badgeData }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('create_badge', duration, 'system');
    throw new Error(`Error creating badge: ${error.message}`);
  }
};

// Update a badge
const updateBadge = async (badgeId, badgeData) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'update_badge',
      async () => {
        const badge = await Badge.findByPk(badgeId);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM badges WHERE id = ?',
          [badgeId]
        );

        if (!badge) {
          throw new Error('Badge not found');
        }

        await badge.update(badgeData);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'UPDATE badges SET name = ?, description = ?, icon = ?, criteria = ?, category = ?, points = ?, is_active = ? WHERE id = ?',
          [badgeData.name, badgeData.description, badgeData.icon, JSON.stringify(badgeData.criteria), badgeData.category, badgeData.points, badgeData.isActive, badgeId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('update_badge', duration, 'system');

        return badge;
      },
      { badgeId, badgeData }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('update_badge', duration, 'system');
    throw new Error(`Error updating badge: ${error.message}`);
  }
};

// Delete a badge
const deleteBadge = async (badgeId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'delete_badge',
      async () => {
        const badge = await Badge.findByPk(badgeId);

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM badges WHERE id = ?',
          [badgeId]
        );

        if (!badge) {
          throw new Error('Badge not found');
        }

        await badge.update({ isActive: false });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'UPDATE badges SET is_active = false WHERE id = ?',
          [badgeId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('delete_badge', duration, 'system');

        return badge;
      },
      { badgeId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('delete_badge', duration, 'system');
    throw new Error(`Error deleting badge: ${error.message}`);
  }
};

module.exports = {
  getAllBadges,
  getUserBadges,
  awardBadgeToUser,
  checkAndAwardProgressBadges,
  createBadge,
  updateBadge,
  deleteBadge,
};