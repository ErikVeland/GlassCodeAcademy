const {
  UserProgress,
  UserLessonProgress,
  LessonQuiz,
  QuizAttempt,
} = require('../models');
const {
  recordLessonProgress,
  recordQuizAttempt: recordQuizAttemptMetric,
  recordBusinessOperation,
} = require('../utils/metrics');
const {
  traceAsyncFunction,
  addDatabaseQueryInfo,
} = require('../utils/tracing');
const { sendLessonCompletionNotification, sendQuizResultNotification } = require('./notificationIntegrationService');

// Get user progress for a course
const getUserCourseProgress = async (userId, courseId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_course_progress',
      async () => {
        const progress = await UserProgress.findOne({
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

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_course_progress', duration, userId);

        return progress;
      },
      { userId, courseId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_course_progress', duration, userId);
    throw error;
  }
};

// Update or create user lesson progress
const updateUserLessonProgress = async (userId, lessonId, updates) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'update_user_lesson_progress',
      async () => {
        const [progress, created] = await UserLessonProgress.findOrCreate({
          where: {
            user_id: userId,
            lesson_id: lessonId,
          },
          defaults: {
            user_id: userId,
            lesson_id: lessonId,
            ...updates,
          },
        });

        // Add database query information to the span
        if (created) {
          addDatabaseQueryInfo(
            'INSERT INTO user_lesson_progress (user_id, lesson_id, ...) VALUES (?, ?, ...)',
            [userId, lessonId]
          );
        } else {
          // For updates, we need to handle time tracking specially
          const updateData = { ...updates };
          
          // If we're adding time, increment the existing time values
          if (updateData.timeSpentSeconds !== undefined) {
            updateData.timeSpentSeconds = progress.timeSpentSeconds + updateData.timeSpentSeconds;
            updateData.timeSpentMinutes = Math.floor(updateData.timeSpentSeconds / 60);
          }
          
          // Update access count and last accessed time
          if (updateData.timeSpentSeconds !== undefined || updateData.isCompleted !== undefined) {
            updateData.accessCount = progress.accessCount + 1;
            updateData.lastAccessedAt = new Date();
          }
          
          addDatabaseQueryInfo(
            'UPDATE user_lesson_progress SET ... WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
          );
          await progress.update(updateData);
        }

        // Send notification if lesson is completed
        if (updates.isCompleted && !progress.isCompleted) {
          // Lesson was just completed
          await sendLessonCompletionNotification(userId, lessonId, {
            // TODO: Add logic to determine next lesson
            nextLessonId: null,
          });
        }

        // Record metrics
        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation(
          'update_user_lesson_progress',
          duration,
          userId
        );
        recordLessonProgress(userId, lessonId, progress.isCompleted);

        return progress;
      },
      { userId, lessonId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('update_user_lesson_progress', duration, userId);
    throw error;
  }
};

// Get user lesson progress
const getUserLessonProgress = async (userId, lessonId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_lesson_progress',
      async () => {
        const progress = await UserLessonProgress.findOne({
          where: {
            user_id: userId,
            lesson_id: lessonId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
          [userId, lessonId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_lesson_progress', duration, userId);

        return progress;
      },
      { userId, lessonId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_lesson_progress', duration, userId);
    throw error;
  }
};

// Submit quiz answers
const submitQuizAnswers = async (userId, lessonId, answers) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'submit_quiz_answers',
      async () => {
        // Get all quizzes for the lesson
        const quizzes = await LessonQuiz.findAll({
          where: {
            lesson_id: lessonId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM lesson_quizzes WHERE lesson_id = ?',
          [lessonId]
        );

        // Calculate score
        let correctAnswers = 0;
        const results = [];

        for (const answer of answers) {
          const quiz = quizzes.find((q) => q.id === answer.quizId);

          if (!quiz) {
            throw new Error(`Quiz with ID ${answer.quizId} not found`);
          }

          let isCorrect = false;

          // Check answer based on question type
          if (quiz.questionType === 'multiple-choice') {
            isCorrect = quiz.correctAnswer === answer.selectedAnswer;
          } else if (quiz.questionType === 'open-ended') {
            // For open-ended questions, check against accepted answers
            isCorrect =
              quiz.acceptedAnswers &&
              quiz.acceptedAnswers.some(
                (accepted) =>
                  accepted.toLowerCase() === answer.userAnswer.toLowerCase()
              );
          }

          if (isCorrect) {
            correctAnswers++;
          }

          results.push({
            quizId: quiz.id,
            isCorrect,
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation,
          });
        }

        const score = {
          totalQuestions: quizzes.length,
          correctAnswers,
          scorePercentage:
            quizzes.length > 0 ? (correctAnswers / quizzes.length) * 100 : 0,
          results,
          passed: quizzes.length > 0 ? (correctAnswers / quizzes.length) * 100 >= 70 : false,
        };

        // Send notification with quiz results
        await sendQuizResultNotification(userId, lessonId, {
          scorePercentage: score.scorePercentage,
          passed: score.passed,
        });

        // Record metrics
        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('submit_quiz_answers', duration, userId);
        recordQuizAttemptMetric(userId, lessonId, score.scorePercentage >= 70);

        return score;
      },
      { userId, lessonId, answerCount: answers.length }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('submit_quiz_answers', duration, userId);
    throw new Error(`Error submitting quiz answers: ${error.message}`);
  }
};

// Record a quiz attempt
const createQuizAttempt = async (userId, lessonId, quizId, attemptData) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'record_quiz_attempt',
      async () => {
        // Calculate additional metrics if not provided
        const enhancedAttemptData = { ...attemptData };
        
        // Calculate time spent if not provided and we have start/end times
        if (!enhancedAttemptData.timeSpentSeconds && enhancedAttemptData.startedAt && enhancedAttemptData.completedAt) {
          enhancedAttemptData.timeSpentSeconds = Math.floor(
            (new Date(enhancedAttemptData.completedAt) - new Date(enhancedAttemptData.startedAt)) / 1000
          );
        }
        
        // Determine device type based on user agent if provided
        if (enhancedAttemptData.userAgent) {
          const userAgent = enhancedAttemptData.userAgent.toLowerCase();
          if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            enhancedAttemptData.deviceType = 'mobile';
          } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
            enhancedAttemptData.deviceType = 'tablet';
          } else {
            enhancedAttemptData.deviceType = 'desktop';
          }
        }
        
        const quizAttempt = await QuizAttempt.create({
          userId,
          lessonId,
          quizId,
          ...enhancedAttemptData,
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'INSERT INTO quiz_attempts (user_id, lesson_id, quiz_id, ...) VALUES (?, ?, ?, ...)',
          [userId, lessonId, quizId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('record_quiz_attempt', duration, userId);
        recordQuizAttemptMetric(userId, lessonId, quizAttempt.score >= 70);

        return quizAttempt;
      },
      { userId, lessonId, quizId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('record_quiz_attempt', duration, userId);
    throw new Error(`Error recording quiz attempt: ${error.message}`);
  }
};

// Get quiz attempts for a user and lesson
const getQuizAttempts = async (userId, lessonId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_quiz_attempts',
      async () => {
        const attempts = await QuizAttempt.findAll({
          where: {
            user_id: userId,
            lesson_id: lessonId,
          },
          order: [['completed_at', 'DESC']],
          include: [
            {
              model: LessonQuiz,
              as: 'quiz',
              attributes: ['question', 'questionType'],
            },
          ],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM quiz_attempts WHERE user_id = ? AND lesson_id = ? ORDER BY completed_at DESC',
          [userId, lessonId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_quiz_attempts', duration, userId);

        return attempts;
      },
      { userId, lessonId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_quiz_attempts', duration, userId);
    throw new Error(`Error fetching quiz attempts: ${error.message}`);
  }
};

// Get quiz attempts for a specific quiz
const getQuizAttemptsByQuizId = async (userId, quizId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_quiz_attempts_by_quiz_id',
      async () => {
        const attempts = await QuizAttempt.findAll({
          where: {
            user_id: userId,
            quiz_id: quizId,
          },
          order: [['completed_at', 'DESC']],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC',
          [userId, quizId]
        );

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation(
          'get_quiz_attempts_by_quiz_id',
          duration,
          userId
        );

        return attempts;
      },
      { userId, quizId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_quiz_attempts_by_quiz_id', duration, userId);
    throw new Error(`Error fetching quiz attempts: ${error.message}`);
  }
};

// Get user progress summary
const getUserProgressSummary = async (userId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_progress_summary',
      async () => {
        // Get all course progress for the user
        const courseProgress = await UserProgress.findAll({
          where: {
            user_id: userId,
          },
          include: [
            {
              model: require('../models/courseModel'),
              as: 'course',
            },
          ],
        });

        // Add database query information to the span
        addDatabaseQueryInfo('SELECT * FROM user_progress WHERE user_id = ?', [
          userId,
        ]);

        // Get all lesson progress for the user
        const lessonProgress = await UserLessonProgress.findAll({
          where: {
            user_id: userId,
          },
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM user_lesson_progress WHERE user_id = ?',
          [userId]
        );

        // Get recent quiz attempts
        const recentQuizAttempts = await QuizAttempt.findAll({
          where: {
            user_id: userId,
          },
          order: [['completed_at', 'DESC']],
          limit: 10,
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC LIMIT 10',
          [userId]
        );

        // Calculate summary statistics
        const completedLessons = lessonProgress.filter(
          (lp) => lp.isCompleted
        ).length;
        const totalLessons = lessonProgress.length;
        
        // Calculate total time spent
        const totalTimeSpentSeconds = lessonProgress.reduce(
          (total, lp) => total + (lp.timeSpentSeconds || 0), 0
        );
        
        // Calculate average quiz score
        const totalQuizScore = recentQuizAttempts.reduce(
          (total, attempt) => total + (parseFloat(attempt.score) || 0), 0
        );
        const averageQuizScore = recentQuizAttempts.length > 0 
          ? totalQuizScore / recentQuizAttempts.length 
          : 0;

        const summary = {
          totalCourses: courseProgress.length,
          completedCourses: courseProgress.filter((cp) => cp.completedAt)
            .length,
          totalLessons,
          completedLessons,
          progressPercentage:
            totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          totalTimeSpentSeconds,
          totalTimeSpentFormatted: `${Math.floor(totalTimeSpentSeconds / 3600)}h ${Math.floor((totalTimeSpentSeconds % 3600) / 60)}m ${totalTimeSpentSeconds % 60}s`,
          averageQuizScore: parseFloat(averageQuizScore.toFixed(2)),
          courseProgress,
          recentQuizAttempts: recentQuizAttempts.map((attempt) => ({
            id: attempt.id,
            lessonId: attempt.lessonId,
            quizId: attempt.quizId,
            score: attempt.score,
            completedAt: attempt.completedAt,
          })),
        };

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_progress_summary', duration, userId);

        return summary;
      },
      { userId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_progress_summary', duration, userId);
    throw new Error(`Error getting user progress summary: ${error.message}`);
  }
};

// Get detailed lesson progress for a course
const getCourseLessonProgress = async (userId, courseId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_course_lesson_progress',
      async () => {
        // Get course progress
        const courseProgress = await UserProgress.findOne({
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

        // Get all lessons for this course
        const lessons = await require('../models/lessonModel').findAll({
          where: {
            course_id: courseId,
          },
          order: [['sort_order', 'ASC']],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC',
          [courseId]
        );

        // Get lesson progress for each lesson
        const lessonProgressPromises = lessons.map(async (lesson) => {
          const progress = await UserLessonProgress.findOne({
            where: {
              user_id: userId,
              lesson_id: lesson.id,
            },
          });

          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            isCompleted: progress ? progress.isCompleted : false,
            timeSpentSeconds: progress ? progress.timeSpentSeconds : 0,
            lastAccessedAt: progress ? progress.lastAccessedAt : null,
            accessCount: progress ? progress.accessCount : 0,
          };
        });

        const lessonProgress = await Promise.all(lessonProgressPromises);

        const summary = {
          courseId,
          courseProgress,
          lessons: lessonProgress,
          totalLessons: lessons.length,
          completedLessons: lessonProgress.filter(lp => lp.isCompleted).length,
        };

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_course_lesson_progress', duration, userId);

        return summary;
      },
      { userId, courseId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_course_lesson_progress', duration, userId);
    throw new Error(`Error getting course lesson progress: ${error.message}`);
  }
};

// Get quiz statistics for a user
const getUserQuizStatistics = async (userId) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_user_quiz_statistics',
      async () => {
        // Get all quiz attempts for the user
        const allQuizAttempts = await QuizAttempt.findAll({
          where: {
            user_id: userId,
          },
          include: [
            {
              model: require('../models/lessonModel'),
              as: 'attemptLesson',
              attributes: ['title'],
            },
          ],
          order: [['completed_at', 'DESC']],
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC',
          [userId]
        );

        // Calculate statistics
        const totalAttempts = allQuizAttempts.length;
        const passedAttempts = allQuizAttempts.filter(attempt => parseFloat(attempt.score) >= 70).length;
        const failedAttempts = totalAttempts - passedAttempts;
        
        // Calculate average score
        const totalScore = allQuizAttempts.reduce(
          (total, attempt) => total + (parseFloat(attempt.score) || 0), 0
        );
        const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
        
        // Find best and worst scores
        const scores = allQuizAttempts.map(attempt => parseFloat(attempt.score)).filter(score => !isNaN(score));
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const worstScore = scores.length > 0 ? Math.min(...scores) : 0;
        
        // Group by lesson
        const lessonStats = {};
        allQuizAttempts.forEach(attempt => {
          const lessonId = attempt.lessonId;
          if (!lessonStats[lessonId]) {
            lessonStats[lessonId] = {
              lessonTitle: attempt.attemptLesson ? attempt.attemptLesson.title : 'Unknown Lesson',
              attempts: 0,
              totalScore: 0,
              bestScore: 0,
              worstScore: 100,
            };
          }
          
          lessonStats[lessonId].attempts++;
          lessonStats[lessonId].totalScore += parseFloat(attempt.score);
          lessonStats[lessonId].bestScore = Math.max(lessonStats[lessonId].bestScore, parseFloat(attempt.score));
          lessonStats[lessonId].worstScore = Math.min(lessonStats[lessonId].worstScore, parseFloat(attempt.score));
        });
        
        // Calculate averages for each lesson
        Object.values(lessonStats).forEach(stats => {
          stats.averageScore = parseFloat((stats.totalScore / stats.attempts).toFixed(2));
        });

        const statistics = {
          totalAttempts,
          passedAttempts,
          failedAttempts,
          passRate: totalAttempts > 0 ? parseFloat(((passedAttempts / totalAttempts) * 100).toFixed(2)) : 0,
          averageScore: parseFloat(averageScore.toFixed(2)),
          bestScore,
          worstScore,
          lessonStatistics: lessonStats,
        };

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_user_quiz_statistics', duration, userId);

        return statistics;
      },
      { userId }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_quiz_statistics', duration, userId);
    throw new Error(`Error getting user quiz statistics: ${error.message}`);
  }
};

// Get leaderboard data
const getLeaderboard = async (limit = 10) => {
  const startTime = Date.now();

  try {
    return await traceAsyncFunction(
      'get_leaderboard',
      async () => {
        // Get all users with their progress data
        const users = await require('../models/userModel').findAll({
          attributes: ['id', 'firstName', 'lastName', 'username'],
          include: [
            {
              model: UserProgress,
              as: 'progress',
              attributes: ['completedLessons', 'totalLessons', 'progressPercentage'],
            },
            {
              model: QuizAttempt,
              as: 'quizAttempts',
              attributes: ['score'],
            }
          ]
        });

        // Add database query information to the span
        addDatabaseQueryInfo(
          'SELECT * FROM users JOIN user_progress ON users.id = user_progress.user_id JOIN quiz_attempts ON users.id = quiz_attempts.user_id',
          []
        );

        // Calculate leaderboard scores for each user
        const leaderboardData = users.map(user => {
          // Calculate completion score (0-50 points based on lesson completion)
          const totalLessons = user.progress.reduce((total, p) => total + (p.totalLessons || 0), 0);
          const completedLessons = user.progress.reduce((total, p) => total + (p.completedLessons || 0), 0);
          const completionScore = totalLessons > 0 ? (completedLessons / totalLessons) * 50 : 0;
          
          // Calculate quiz score (0-30 points based on average quiz scores)
          const totalQuizScore = user.quizAttempts.reduce(
            (total, attempt) => total + (parseFloat(attempt.score) || 0), 0
          );
          const averageQuizScore = user.quizAttempts.length > 0 
            ? totalQuizScore / user.quizAttempts.length 
            : 0;
          const quizScore = (averageQuizScore / 100) * 30;
          
          // Calculate activity score (0-20 points based on number of quiz attempts)
          const activityScore = Math.min((user.quizAttempts.length / 10) * 20, 20);
          
          // Calculate total score
          const totalScore = completionScore + quizScore + activityScore;
          
          return {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            totalScore: parseFloat(totalScore.toFixed(2)),
            completionScore: parseFloat(completionScore.toFixed(2)),
            quizScore: parseFloat(quizScore.toFixed(2)),
            activityScore: parseFloat(activityScore.toFixed(2)),
            completedLessons,
            totalLessons,
            quizAttempts: user.quizAttempts.length,
            averageQuizScore: parseFloat(averageQuizScore.toFixed(2))
          };
        });

        // Sort by total score descending
        leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
        
        // Take only the top N users
        const leaderboard = leaderboardData.slice(0, limit);
        
        // Add rankings
        leaderboard.forEach((user, index) => {
          user.rank = index + 1;
        });

        const duration = (Date.now() - startTime) / 1000;
        recordBusinessOperation('get_leaderboard', duration, 'system');

        return leaderboard;
      },
      { limit }
    );
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_leaderboard', duration, 'system');
    throw new Error(`Error getting leaderboard: ${error.message}`);
  }
};

module.exports = {
  getUserCourseProgress,
  updateUserLessonProgress,
  getUserLessonProgress,
  submitQuizAnswers,
  recordQuizAttempt: createQuizAttempt,
  getQuizAttempts,
  getQuizAttemptsByQuizId,
  getUserProgressSummary,
  getCourseLessonProgress,
  getUserQuizStatistics,
  getLeaderboard,
};
