const { UserProgress, UserLessonProgress, LessonQuiz, QuizAttempt } = require('../models');
const { recordLessonProgress, recordQuizAttempt: recordQuizAttemptMetric, recordBusinessOperation } = require('../utils/metrics');
const { traceAsyncFunction, addDatabaseQueryInfo } = require('../utils/tracing');

// Get user progress for a course
const getUserCourseProgress = async (userId, courseId) => {
  const startTime = Date.now();
  
  try {
    return await traceAsyncFunction('get_user_course_progress', async () => {
      const progress = await UserProgress.findOne({
        where: {
          user_id: userId,
          course_id: courseId
        }
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM user_progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('get_user_course_progress', duration, userId);
      
      return progress;
    }, { userId, courseId });
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
    return await traceAsyncFunction('update_user_lesson_progress', async () => {
      const [progress, created] = await UserLessonProgress.findOrCreate({
        where: {
          user_id: userId,
          lesson_id: lessonId
        },
        defaults: {
          user_id: userId,
          lesson_id: lessonId,
          ...updates
        }
      });
      
      // Add database query information to the span
      if (created) {
        addDatabaseQueryInfo('INSERT INTO user_lesson_progress (user_id, lesson_id, ...) VALUES (?, ?, ...)', [userId, lessonId]);
      } else {
        addDatabaseQueryInfo('UPDATE user_lesson_progress SET ... WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
        await progress.update(updates);
      }
      
      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('update_user_lesson_progress', duration, userId);
      recordLessonProgress(userId, lessonId, progress.isCompleted);
      
      return progress;
    }, { userId, lessonId });
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
    return await traceAsyncFunction('get_user_lesson_progress', async () => {
      const progress = await UserLessonProgress.findOne({
        where: {
          user_id: userId,
          lesson_id: lessonId
        }
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?', [userId, lessonId]);
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('get_user_lesson_progress', duration, userId);
      
      return progress;
    }, { userId, lessonId });
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
    return await traceAsyncFunction('submit_quiz_answers', async () => {
      // Get all quizzes for the lesson
      const quizzes = await LessonQuiz.findAll({
        where: {
          lesson_id: lessonId
        }
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM lesson_quizzes WHERE lesson_id = ?', [lessonId]);
      
      // Calculate score
      let correctAnswers = 0;
      const results = [];
      
      for (const answer of answers) {
        const quiz = quizzes.find(q => q.id === answer.quizId);
        
        if (!quiz) {
          throw new Error(`Quiz with ID ${answer.quizId} not found`);
        }
        
        let isCorrect = false;
        
        // Check answer based on question type
        if (quiz.questionType === 'multiple-choice') {
          isCorrect = quiz.correctAnswer === answer.selectedAnswer;
        } else if (quiz.questionType === 'open-ended') {
          // For open-ended questions, check against accepted answers
          isCorrect = quiz.acceptedAnswers && 
                     quiz.acceptedAnswers.some(accepted => 
                       accepted.toLowerCase() === answer.userAnswer.toLowerCase());
        }
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        results.push({
          quizId: quiz.id,
          isCorrect,
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation
        });
      }
      
      const score = {
        totalQuestions: quizzes.length,
        correctAnswers,
        scorePercentage: quizzes.length > 0 ? (correctAnswers / quizzes.length) * 100 : 0,
        results
      };
      
      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('submit_quiz_answers', duration, userId);
      recordQuizAttemptMetric(userId, lessonId, score.scorePercentage >= 70);
      
      return score;
    }, { userId, lessonId, answerCount: answers.length });
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
    return await traceAsyncFunction('record_quiz_attempt', async () => {
      const quizAttempt = await QuizAttempt.create({
        userId,
        lessonId,
        quizId,
        ...attemptData
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('INSERT INTO quiz_attempts (user_id, lesson_id, quiz_id, ...) VALUES (?, ?, ?, ...)', [userId, lessonId, quizId]);
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('record_quiz_attempt', duration, userId);
      
      return quizAttempt;
    }, { userId, lessonId, quizId });
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
    return await traceAsyncFunction('get_quiz_attempts', async () => {
      const attempts = await QuizAttempt.findAll({
        where: {
          user_id: userId,
          lesson_id: lessonId
        },
        order: [['completed_at', 'DESC']],
        include: [{
          model: LessonQuiz,
          as: 'quiz',
          attributes: ['question', 'questionType']
        }]
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM quiz_attempts WHERE user_id = ? AND lesson_id = ? ORDER BY completed_at DESC', [userId, lessonId]);
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('get_quiz_attempts', duration, userId);
      
      return attempts;
    }, { userId, lessonId });
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
    return await traceAsyncFunction('get_quiz_attempts_by_quiz_id', async () => {
      const attempts = await QuizAttempt.findAll({
        where: {
          user_id: userId,
          quiz_id: quizId
        },
        order: [['completed_at', 'DESC']]
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC', [userId, quizId]);
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('get_quiz_attempts_by_quiz_id', duration, userId);
      
      return attempts;
    }, { userId, quizId });
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
    return await traceAsyncFunction('get_user_progress_summary', async () => {
      // Get all course progress for the user
      const courseProgress = await UserProgress.findAll({
        where: {
          user_id: userId
        },
        include: [{
          model: require('../models/courseModel'),
          as: 'course'
        }]
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM user_progress WHERE user_id = ?', [userId]);
      
      // Get all lesson progress for the user
      const lessonProgress = await UserLessonProgress.findAll({
        where: {
          user_id: userId
        }
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM user_lesson_progress WHERE user_id = ?', [userId]);
      
      // Get recent quiz attempts
      const recentQuizAttempts = await QuizAttempt.findAll({
        where: {
          user_id: userId
        },
        order: [['completed_at', 'DESC']],
        limit: 10
      });
      
      // Add database query information to the span
      addDatabaseQueryInfo('SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC LIMIT 10', [userId]);
      
      // Calculate summary statistics
      const completedLessons = lessonProgress.filter(lp => lp.isCompleted).length;
      const totalLessons = lessonProgress.length;
      
      const summary = {
        totalCourses: courseProgress.length,
        completedCourses: courseProgress.filter(cp => cp.completedAt).length,
        totalLessons,
        completedLessons,
        progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        courseProgress,
        recentQuizAttempts: recentQuizAttempts.map(attempt => ({
          id: attempt.id,
          lessonId: attempt.lessonId,
          quizId: attempt.quizId,
          score: attempt.score,
          completedAt: attempt.completedAt
        }))
      };
      
      const duration = (Date.now() - startTime) / 1000;
      recordBusinessOperation('get_user_progress_summary', duration, userId);
      
      return summary;
    }, { userId });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordBusinessOperation('get_user_progress_summary', duration, userId);
    throw new Error(`Error getting user progress summary: ${error.message}`);
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
  getUserProgressSummary
};