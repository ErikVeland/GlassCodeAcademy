const { 
  getUserCourseProgress, 
  updateUserLessonProgress, 
  getUserLessonProgress 
} = require('../services/progressService');

const getUserCourseProgressController = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const progress = await getUserCourseProgress(userId, courseId);
    
    res.status(200).json({
      success: true,
      data: progress || {}
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

const updateUserLessonProgressController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const progress = await updateUserLessonProgress(userId, lessonId, updates);
    
    res.status(200).json({
      success: true,
      data: progress
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

const getUserLessonProgressController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    
    const progress = await getUserLessonProgress(userId, lessonId);
    
    res.status(200).json({
      success: true,
      data: progress || {}
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
  getUserCourseProgressController,
  updateUserLessonProgressController,
  getUserLessonProgressController
};