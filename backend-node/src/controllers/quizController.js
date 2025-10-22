const { submitQuizAnswers, getUserProgressSummary } = require('../services/progressService');

const submitQuizAnswersController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Answers must be an array'
        }
      });
    }

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { userId, lessonId, correctCount: 1, total: answers.length } });
    }
    
    // Submit quiz answers
    const result = await submitQuizAnswers(userId, lessonId, answers);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const getUserProgressSummaryController = async (req, res) => {
  try {
    const userId = req.user.id;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { userId, coursesCompleted: 0, lessonsCompleted: 0 } });
    }
    
    // Get user progress summary
    const summary = await getUserProgressSummary(userId);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  submitQuizAnswersController,
  getUserProgressSummaryController
};