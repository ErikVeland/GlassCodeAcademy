const { getAllCourses, getCourseById } = require('../services/contentService');

const getAllCoursesController = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    };
    
    const result = await getAllCourses(options);
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result.courses,
      meta: {
        pagination: result.pagination
      }
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getCourseByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const course = await getCourseById(id);
    
    if (!course) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Course not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: course
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  getAllCoursesController,
  getCourseByIdController
};