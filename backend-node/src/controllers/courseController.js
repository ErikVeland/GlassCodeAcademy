const { getAllCourses, getCourseById } = require('../services/contentService');

const getAllCoursesController = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    };
    
    const result = await getAllCourses(options);
    
    res.status(200).json({
      success: true,
      data: result.courses,
      meta: {
        pagination: result.pagination
      }
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

const getCourseByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await getCourseById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Course not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: course
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
  getAllCoursesController,
  getCourseByIdController
};