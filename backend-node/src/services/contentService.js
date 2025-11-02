const { Course, Module, Lesson, LessonQuiz } = require('../models');
const logger = require('../utils/logger');

// Get all courses
const getAllCourses = async (options = {}) => {
  const { page = 1, limit = 10, sort = 'order' } = options;

  const offset = (page - 1) * limit;

  const { count, rows } = await Course.findAndCountAll({
    where: {
      isPublished: true,
    },
    order: [[sort, 'ASC']],
    limit,
    offset,
  });

  return {
    courses: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  };
};

// Get course by ID
const getCourseById = async (id) => {
  const course = await Course.findByPk(id, {
    include: [
      {
        model: Module,
        as: 'modules',
        where: {
          isPublished: true,
        },
        required: false,
        include: [
          {
            model: Lesson,
            as: 'lessons',
            where: {
              isPublished: true,
            },
            required: false,
          },
        ],
      },
    ],
  });

  return course;
};

// Get all modules (published only)
const getAllModules = async () => {
  const modules = await Module.findAll({
    where: {
      isPublished: true,
    },
    order: [['order', 'ASC']],
  });
  return modules;
};

// Get module by ID
const getModuleById = async (id) => {
  const module = await Module.findByPk(id, {
    include: [
      {
        model: Lesson,
        as: 'lessons',
        where: {
          isPublished: true,
        },
        required: false,
      },
    ],
  });

  return module;
};

// Get lesson by ID
const getLessonById = async (id) => {
  const lesson = await Lesson.findByPk(id);

  return lesson;
};

// Add: Get lessons by module ID (published only)
const getLessonsByModuleId = async (moduleId) => {
  const lessons = await Lesson.findAll({
    where: {
      module_id: moduleId,
      isPublished: true,
    },
    order: [['order', 'ASC']],
  });

  return lessons;
};

// Get quizzes by lesson ID
const getQuizzesByLessonId = async (lessonId) => {
  const quizzes = await LessonQuiz.findAll({
    where: {
      lesson_id: lessonId,
      isPublished: true,
    },
  });

  // Filter out any quizzes with invalid IDs
  const validQuizzes = quizzes.filter((quiz) => quiz.id && quiz.id > 0);

  return validQuizzes;
};

// Create a new course
const createCourse = async (courseData, createdBy) => {
  try {
    // Auto-generate slug from title if not provided
    const slug = courseData.slug || courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Get the next order number if not provided
    let order = courseData.order;
    if (!order) {
      const maxOrder = await Course.max('order');
      order = (maxOrder || 0) + 1;
    }

    const course = await Course.create({
      ...courseData,
      slug,
      order,
      created_by: createdBy,
      isPublished: courseData.isPublished || false,
    });

    logger.info('Course created successfully', {
      courseId: course.id,
      title: course.title,
      createdBy,
    });

    return course;
  } catch (error) {
    logger.error('Course creation failed', {
      error: error.message,
      courseData,
      createdBy,
    });
    throw error;
  }
};

// Update a course
const updateCourse = async (id, courseData) => {
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    await course.update(courseData);

    logger.info('Course updated successfully', {
      courseId: course.id,
      title: course.title,
    });

    return course;
  } catch (error) {
    logger.error('Course update failed', {
      error: error.message,
      courseId: id,
    });
    throw error;
  }
};

// Delete a course
const deleteCourse = async (id) => {
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    await course.destroy();

    logger.info('Course deleted successfully', {
      courseId: id,
    });

    return { message: 'Course deleted successfully' };
  } catch (error) {
    logger.error('Course deletion failed', {
      error: error.message,
      courseId: id,
    });
    throw error;
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllModules,
  getModuleById,
  getLessonById,
  getLessonsByModuleId,
  getQuizzesByLessonId,
};
