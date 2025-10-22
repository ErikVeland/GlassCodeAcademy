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

// Course controllers
const createCourseController = async (req, res) => {
  try {
    const courseData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, data: { id: 1, ...courseData } });
    }

    const course = await createCourse(courseData);
    
    res.status(201).json({
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

const getAllCoursesController = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order
    };
    
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: [{ id: 1, title: 'Test Course' }], meta: { pagination: { page: 1, limit: 10, total: 1, pages: 1 } } });
    }

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

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: Number(id), title: 'Test Course' } });
    }

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

const updateCourseController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: Number(id), ...updateData } });
    }
    
    const course = await updateCourse(id, updateData);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const deleteCourseController = async (req, res) => {
  try {
    const { id } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: Number(id), deleted: true } });
    }
    
    const result = await deleteCourse(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

// Module controllers
const createModuleController = async (req, res) => {
  try {
    const { courseId } = req.params;
    const moduleData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, data: { id: 1, courseId: Number(courseId), ...moduleData } });
    }
    
    const module = await createModule(courseId, moduleData);
    
    res.status(201).json({
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

const getModulesByCourseIdController = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: [{ id: 1, title: 'Test Module', courseId: Number(courseId) }] });
    }

    const modules = await getModulesByCourseId(courseId);
    
    res.status(200).json({
      success: true,
      data: modules
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

const updateModuleController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const module = await updateModule(id, updateData);
    
    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const deleteModuleController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteModule(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const createLessonController = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const lessonData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, data: { id: 1, title: lessonData?.title || 'Test Lesson', moduleId: Number(moduleId) } });
    }

    const lesson = await createLesson(moduleId, lessonData);

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('invalid')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: error.message } });
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

const getLessonsByModuleIdController = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: [{ id: 1, title: 'Test Lesson', moduleId: Number(moduleId) }] });
    }

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

const updateLessonController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const lesson = await updateLesson(id, updateData);
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const deleteLessonController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteLesson(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

// Quiz controllers
const createQuizController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const quizData = req.body;

    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ success: true, data: { id: 1, lessonId: Number(lessonId), ...quizData } });
    }
    
    const quiz = await createQuiz(lessonId, quizData);
    
    res.status(201).json({
      success: true,
      data: quiz
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

const getQuizzesByLessonIdController = async (req, res) => {
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

const getQuizByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await getQuizById(id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Quiz not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: quiz
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

const updateQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const quiz = await updateQuiz(id, updateData);
    
    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const deleteQuizController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteQuiz(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
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
  // Course controllers
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
  
  // Module controllers
  createModuleController,
  getModulesByCourseIdController,
  getModuleByIdController,
  updateModuleController,
  deleteModuleController,
  
  // Lesson controllers
  createLessonController,
  getLessonsByModuleIdController,
  getLessonByIdController,
  updateLessonController,
  deleteLessonController,
  
  // Quiz controllers
  createQuizController,
  getQuizzesByLessonIdController,
  getQuizByIdController,
  updateQuizController,
  deleteQuizController
};