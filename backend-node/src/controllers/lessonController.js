const { getLessonById, getQuizzesByLessonId } = require('../services/contentService');

const getLessonByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await getLessonById(id);
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: lesson
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

const getLessonQuizzesController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const quizzes = await getQuizzesByLessonId(lessonId);
    
    res.status(200).json({
      success: true,
      data: quizzes
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
  getLessonByIdController,
  getLessonQuizzesController
};