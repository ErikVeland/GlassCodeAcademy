const { Course, Module, Lesson, LessonQuiz } = require('../models');

// Get all courses
const getAllCourses = async (options = {}) => {
  const { page = 1, limit = 10, sort = 'order' } = options;
  
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Course.findAndCountAll({
    where: {
      isPublished: true
    },
    order: [[sort, 'ASC']],
    limit,
    offset
  });
  
  return {
    courses: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
};

// Get course by ID
const getCourseById = async (id) => {
  const course = await Course.findByPk(id, {
    include: [{
      model: Module,
      as: 'modules',
      where: {
        isPublished: true
      },
      required: false,
      include: [{
        model: Lesson,
        as: 'lessons',
        where: {
          isPublished: true
        },
        required: false
      }]
    }]
  });
  
  return course;
};

// Get all modules (published only)
const getAllModules = async () => {
  const modules = await Module.findAll({
    where: {
      isPublished: true
    },
    order: [['order', 'ASC']]
  });
  return modules;
};

// Get module by ID
const getModuleById = async (id) => {
  const module = await Module.findByPk(id, {
    include: [{
      model: Lesson,
      as: 'lessons',
      where: {
        isPublished: true
      },
      required: false
    }]
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
      isPublished: true
    },
    order: [['order', 'ASC']]
  });
  
  return lessons;
};

// Get quizzes by lesson ID
const getQuizzesByLessonId = async (lessonId) => {
  const quizzes = await LessonQuiz.findAll({
    where: {
      lesson_id: lessonId,
      isPublished: true
    }
  });
  
  // Filter out any quizzes with invalid IDs
  const validQuizzes = quizzes.filter(quiz => quiz.id && quiz.id > 0);
  
  return validQuizzes;
};

module.exports = {
  getAllCourses,
  getCourseById,
  getAllModules,
  getModuleById,
  getLessonById,
  getLessonsByModuleId,
  getQuizzesByLessonId
};