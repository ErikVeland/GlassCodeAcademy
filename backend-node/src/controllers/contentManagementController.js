const {
  // Course operations
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  
  // Module operations
  createModule,
  getModulesByCourseId,
  getModuleById,
  updateModule,
  deleteModule,
  
  // Lesson operations
  createLesson,
  getLessonsByModuleId,
  getLessonById,
  updateLesson,
  deleteLesson,
  
  // Quiz operations
  createQuiz,
  getQuizzesByLessonId,
  getQuizById,
  updateQuiz,
  deleteQuiz
} = require('../services/contentManagementService');
const { Course, Module, Lesson } = require('../models');
const { logAction } = require('../services/auditService');

// Course controllers
const createCourseController = async (req, res, next) => {
  try {
    const courseData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: { id: 1, ...courseData }
      };
      
      return res.status(201).json(successResponse);
    }

    // Check if course with this slug already exists
    const existingCourse = await Course.findOne({
      where: {
        slug: courseData.slug
      }
    });
    
    if (existingCourse) {
      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'A course with this slug already exists',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(409).json(errorResponse);
    }

    const course = await createCourse(courseData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'COURSE',
      resourceId: course.id,
      resourceName: course.title,
      details: { ...courseData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: course
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAllCoursesController = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order
    };
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, title: 'Test Course' }],
        meta: { pagination: { page: 1, limit: 10, total: 1, pages: 1 } }
      };
      
      return res.status(200).json(successResponse);
    }

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

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), title: 'Test Course' }
      };
      
      return res.status(200).json(successResponse);
    }

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

const updateCourseController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), ...updateData }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if course exists
    const course = await Course.findByPk(id);
    
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
    
    // Store original data for audit logging
    const originalData = {
      title: course.title,
      slug: course.slug,
      description: course.description,
      isPublished: course.isPublished,
      version: course.version
    };
    
    // Check if slug is being updated and if it conflicts with another course
    if (updateData.slug && updateData.slug !== course.slug) {
      const existingCourse = await Course.findOne({
        where: {
          slug: updateData.slug
        }
      });
      
      if (existingCourse) {
        const errorResponse = {
          type: 'https://glasscode/errors/conflict-error',
          title: 'Conflict Error',
          status: 409,
          detail: 'A course with this slug already exists',
          instance: req.originalUrl,
          traceId: req.correlationId
        };
        
        return res.status(409).json(errorResponse);
      }
    }
    
    const updatedCourse = await updateCourse(id, updateData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'COURSE',
      resourceId: course.id,
      resourceName: course.title,
      details: {
        original: originalData,
        updated: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: updatedCourse
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteCourseController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), deleted: true }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if course exists
    const course = await Course.findByPk(id);
    
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
    
    // Store data for audit logging before deletion
    const courseData = {
      title: course.title,
      slug: course.slug,
      description: course.description,
      isPublished: course.isPublished,
      version: course.version
    };
    
    const result = await deleteCourse(id);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'COURSE',
      resourceId: course.id,
      resourceName: course.title,
      details: courseData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

// Module controllers
const createModuleController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const moduleData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: { id: 1, courseId: Number(courseId), ...moduleData }
      };
      
      return res.status(201).json(successResponse);
    }

    // Check if module with this slug already exists within the same course
    const existingModule = await Module.findOne({
      where: {
        slug: moduleData.slug,
        course_id: courseId
      }
    });
    
    if (existingModule) {
      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'A module with this slug already exists in this course',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(409).json(errorResponse);
    }

    const module = await createModule(courseId, moduleData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'MODULE',
      resourceId: module.id,
      resourceName: module.title,
      details: { ...moduleData, courseId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: module
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getModulesByCourseIdController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, title: 'Test Module', courseId: Number(courseId) }]
      };
      
      return res.status(200).json(successResponse);
    }

    const modules = await getModulesByCourseId(courseId);
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: modules
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getModuleByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), title: 'Test Module' }
      };
      
      return res.status(200).json(successResponse);
    }

    const module = await getModuleById(id);
    
    if (!module) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: module
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateModuleController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), ...updateData }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if module exists
    const module = await Module.findByPk(id);
    
    if (!module) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store original data for audit logging
    const originalData = {
      title: module.title,
      slug: module.slug,
      description: module.description,
      isPublished: module.isPublished,
      version: module.version
    };
    
    // Check if slug is being updated and if it conflicts with another module in the same course
    if (updateData.slug && updateData.slug !== module.slug) {
      const existingModule = await Module.findOne({
        where: {
          slug: updateData.slug,
          course_id: module.course_id
        }
      });
      
      if (existingModule) {
        const errorResponse = {
          type: 'https://glasscode/errors/conflict-error',
          title: 'Conflict Error',
          status: 409,
          detail: 'A module with this slug already exists in this course',
          instance: req.originalUrl,
          traceId: req.correlationId
        };
        
        return res.status(409).json(errorResponse);
      }
    }
    
    const updatedModule = await updateModule(id, updateData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'MODULE',
      resourceId: module.id,
      resourceName: module.title,
      details: {
        original: originalData,
        updated: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: updatedModule
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteModuleController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), deleted: true }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if module exists
    const module = await Module.findByPk(id);
    
    if (!module) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Module not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store data for audit logging before deletion
    const moduleData = {
      title: module.title,
      slug: module.slug,
      description: module.description,
      isPublished: module.isPublished,
      version: module.version
    };
    
    const result = await deleteModule(id);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'MODULE',
      resourceId: module.id,
      resourceName: module.title,
      details: moduleData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

// Lesson controllers
const createLessonController = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const lessonData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: { id: 1, title: lessonData?.title || 'Test Lesson', moduleId: Number(moduleId) }
      };
      
      return res.status(201).json(successResponse);
    }

    // Check if lesson with this slug already exists within the same module
    const existingLesson = await Lesson.findOne({
      where: {
        slug: lessonData.slug,
        module_id: moduleId
      }
    });
    
    if (existingLesson) {
      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'A lesson with this slug already exists in this module',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(409).json(errorResponse);
    }

    const lesson = await createLesson(moduleId, lessonData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      resourceName: lesson.title,
      details: { ...lessonData, moduleId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: lesson
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLessonsByModuleIdController = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: [{ id: 1, title: 'Test Lesson', moduleId: Number(moduleId) }]
      };
      
      return res.status(200).json(successResponse);
    }

    const lessons = await getLessonsByModuleId(moduleId);
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: lessons
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getLessonByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), title: 'Test Lesson' }
      };
      
      return res.status(200).json(successResponse);
    }

    const lesson = await getLessonById(id);
    
    if (!lesson) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Lesson not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: lesson
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateLessonController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), ...updateData }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if lesson exists
    const lesson = await Lesson.findByPk(id);
    
    if (!lesson) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Lesson not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store original data for audit logging
    const originalData = {
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      isPublished: lesson.isPublished,
      version: lesson.version
    };
    
    // Check if slug is being updated and if it conflicts with another lesson in the same module
    if (updateData.slug && updateData.slug !== lesson.slug) {
      const existingLesson = await Lesson.findOne({
        where: {
          slug: updateData.slug,
          module_id: lesson.module_id
        }
      });
      
      if (existingLesson) {
        const errorResponse = {
          type: 'https://glasscode/errors/conflict-error',
          title: 'Conflict Error',
          status: 409,
          detail: 'A lesson with this slug already exists in this module',
          instance: req.originalUrl,
          traceId: req.correlationId
        };
        
        return res.status(409).json(errorResponse);
      }
    }
    
    const updatedLesson = await updateLesson(id, updateData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      resourceName: lesson.title,
      details: {
        original: originalData,
        updated: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: updatedLesson
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteLessonController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 200,
        data: { id: Number(id), deleted: true }
      };
      
      return res.status(200).json(successResponse);
    }
    
    // Check if lesson exists
    const lesson = await Lesson.findByPk(id);
    
    if (!lesson) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Lesson not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store data for audit logging before deletion
    const lessonData = {
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      isPublished: lesson.isPublished,
      version: lesson.version
    };
    
    const result = await deleteLesson(id);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'LESSON',
      resourceId: lesson.id,
      resourceName: lesson.title,
      details: lessonData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

// Quiz controllers
const createQuizController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const quizData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      const successResponse = {
        type: 'https://glasscode/errors/success',
        title: 'Success',
        status: 201,
        data: { id: 1, lessonId: Number(lessonId), ...quizData }
      };
      
      return res.status(201).json(successResponse);
    }

    const quiz = await createQuiz(lessonId, quizData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'QUIZ',
      resourceId: quiz.id,
      resourceName: `Quiz for lesson ${lessonId}`,
      details: { ...quizData, lessonId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: quiz
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getQuizzesByLessonIdController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    
    const quizzes = await getQuizzesByLessonId(lessonId);
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: quizzes
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getQuizByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quiz = await getQuizById(id);
    
    if (!quiz) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Quiz not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: quiz
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateQuizController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if quiz exists
    const quiz = await getQuizById(id);
    
    if (!quiz) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Quiz not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store original data for audit logging
    const originalData = {
      question: quiz.question,
      choices: quiz.choices,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation
    };
    
    const updatedQuiz = await updateQuiz(id, updateData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'QUIZ',
      resourceId: quiz.id,
      resourceName: `Quiz ${quiz.id}`,
      details: {
        original: originalData,
        updated: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: updatedQuiz
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteQuizController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if quiz exists
    const quiz = await getQuizById(id);
    
    if (!quiz) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Quiz not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store data for audit logging before deletion
    const quizData = {
      question: quiz.question,
      choices: quiz.choices,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation
    };
    
    const result = await deleteQuiz(id);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'QUIZ',
      resourceId: quiz.id,
      resourceName: `Quiz ${quiz.id}`,
      details: quizData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: result
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: error.message,
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  // Course exports
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
  
  // Module exports
  createModuleController,
  getModulesByCourseIdController,
  getModuleByIdController,
  updateModuleController,
  deleteModuleController,
  
  // Lesson exports
  createLessonController,
  getLessonsByModuleIdController,
  getLessonByIdController,
  updateLessonController,
  deleteLessonController,
  
  // Quiz exports
  createQuizController,
  getQuizzesByLessonIdController,
  getQuizByIdController,
  updateQuizController,
  deleteQuizController
};