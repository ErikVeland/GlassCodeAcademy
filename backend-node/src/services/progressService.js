const { UserProgress, UserLessonProgress, LessonQuiz, QuizAttempt } = require('../models');

// Get user progress for a course
const getUserCourseProgress = async (userId, courseId) => {
  const progress = await UserProgress.findOne({
    where: {
      user_id: userId,
      course_id: courseId
    }
  });
  
  return progress;
};

// Update or create user lesson progress
const updateUserLessonProgress = async (userId, lessonId, updates) => {
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
  
  if (!created) {
    await progress.update(updates);
  }
  
  return progress;
};

// Get user lesson progress
const getUserLessonProgress = async (userId, lessonId) => {
  const progress = await UserLessonProgress.findOne({
    where: {
      user_id: userId,
      lesson_id: lessonId
    }
  });
  
  return progress;
};

// Submit quiz answers
const submitQuizAnswers = async (userId, lessonId, answers) => {
  try {
    // Get all quizzes for the lesson
    const quizzes = await LessonQuiz.findAll({
      where: {
        lesson_id: lessonId
      }
    });
    
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
    
    return score;
  } catch (error) {
    throw new Error(`Error submitting quiz answers: ${error.message}`);
  }
};

// Record a quiz attempt
const recordQuizAttempt = async (userId, lessonId, quizId, attemptData) => {
  try {
    const quizAttempt = await QuizAttempt.create({
      userId,
      lessonId,
      quizId,
      ...attemptData
    });
    
    return quizAttempt;
  } catch (error) {
    throw new Error(`Error recording quiz attempt: ${error.message}`);
  }
};

// Get quiz attempts for a user and lesson
const getQuizAttempts = async (userId, lessonId) => {
  try {
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
    
    return attempts;
  } catch (error) {
    throw new Error(`Error fetching quiz attempts: ${error.message}`);
  }
};

// Get quiz attempts for a specific quiz
const getQuizAttemptsByQuizId = async (userId, quizId) => {
  try {
    const attempts = await QuizAttempt.findAll({
      where: {
        user_id: userId,
        quiz_id: quizId
      },
      order: [['completed_at', 'DESC']]
    });
    
    return attempts;
  } catch (error) {
    throw new Error(`Error fetching quiz attempts: ${error.message}`);
  }
};

// Get user progress summary
const getUserProgressSummary = async (userId) => {
  try {
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
    
    // Get all lesson progress for the user
    const lessonProgress = await UserLessonProgress.findAll({
      where: {
        user_id: userId
      }
    });
    
    // Get recent quiz attempts
    const recentQuizAttempts = await QuizAttempt.findAll({
      where: {
        user_id: userId
      },
      order: [['completed_at', 'DESC']],
      limit: 10
    });
    
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
    
    return summary;
  } catch (error) {
    throw new Error(`Error getting user progress summary: ${error.message}`);
  }
};

module.exports = {
  getUserCourseProgress,
  updateUserLessonProgress,
  getUserLessonProgress,
  submitQuizAnswers,
  recordQuizAttempt,
  getQuizAttempts,
  getQuizAttemptsByQuizId,
  getUserProgressSummary
};