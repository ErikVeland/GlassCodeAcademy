const { getModuleById, getLessonsByModuleId } = require('../services/contentService');
const { Module, Lesson, LessonQuiz } = require('../models');

const getModuleByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await getModuleById(id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Module not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: module
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

const getLessonsByModuleIdController = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const lessons = await getLessonsByModuleId(moduleId);
    
    res.status(200).json({
      success: true,
      data: lessons
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

// Add new controller to get quizzes by module slug
const getQuizzesByModuleSlugController = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // First find the module by slug
    const module = await Module.findOne({
      where: {
        slug: slug
      }
    });
    
    if (!module) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Module not found'
        }
      });
    }
    
    // Get all lessons for this module
    const lessons = await Lesson.findAll({
      where: {
        module_id: module.id,
        isPublished: true
      },
      order: [['order', 'ASC']]
    });
    
    // Get all quizzes for all lessons
    const lessonIds = lessons.map(lesson => lesson.id);
    const quizzes = await LessonQuiz.findAll({
      where: {
        lesson_id: lessonIds,
        isPublished: true
      },
      order: [['sort_order', 'ASC']]
    });
    
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
  getModuleByIdController,
  getLessonsByModuleIdController,
  getQuizzesByModuleSlugController
};