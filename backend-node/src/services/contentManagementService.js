const { Course, Module, Lesson, LessonQuiz } = require('../models');

// Course CRUD operations
const createCourse = async (courseData) => {
  try {
    const course = await Course.create(courseData);
    return course;
  } catch (error) {
    throw new Error(`Error creating course: ${error.message}`);
  }
};

const getAllCourses = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sort = 'order', order = 'ASC' } = options;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Course.findAndCountAll({
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
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
  } catch (error) {
    throw new Error(`Error getting courses: ${error.message}`);
  }
};

const getCourseById = async (id) => {
  try {
    const course = await Course.findByPk(id);
    return course;
  } catch (error) {
    throw new Error(`Error getting course: ${error.message}`);
  }
};

const updateCourse = async (id, updateData) => {
  try {
    const [updatedRows] = await Course.update(updateData, {
      where: { id }
    });
    
    if (updatedRows === 0) {
      throw new Error('Course not found');
    }
    
    const updatedCourse = await Course.findByPk(id);
    return updatedCourse;
  } catch (error) {
    throw new Error(`Error updating course: ${error.message}`);
  }
};

const deleteCourse = async (id) => {
  try {
    const deletedRows = await Course.destroy({
      where: { id }
    });
    
    if (deletedRows === 0) {
      throw new Error('Course not found');
    }
    
    return { message: 'Course deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting course: ${error.message}`);
  }
};

// Module CRUD operations
const createModule = async (moduleId, moduleData) => {
  try {
    const module = await Module.create({
      ...moduleData,
      course_id: moduleId
    });
    return module;
  } catch (error) {
    throw new Error(`Error creating module: ${error.message}`);
  }
};

const getModulesByCourseId = async (courseId) => {
  try {
    const modules = await Module.findAll({
      where: { course_id: courseId },
      order: [['order', 'ASC']]
    });
    return modules;
  } catch (error) {
    throw new Error(`Error getting modules: ${error.message}`);
  }
};

const getModuleById = async (id) => {
  try {
    const module = await Module.findByPk(id);
    return module;
  } catch (error) {
    throw new Error(`Error getting module: ${error.message}`);
  }
};

const updateModule = async (id, updateData) => {
  try {
    const [updatedRows] = await Module.update(updateData, {
      where: { id }
    });
    
    if (updatedRows === 0) {
      throw new Error('Module not found');
    }
    
    const updatedModule = await Module.findByPk(id);
    return updatedModule;
  } catch (error) {
    throw new Error(`Error updating module: ${error.message}`);
  }
};

const deleteModule = async (id) => {
  try {
    const deletedRows = await Module.destroy({
      where: { id }
    });
    
    if (deletedRows === 0) {
      throw new Error('Module not found');
    }
    
    return { message: 'Module deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting module: ${error.message}`);
  }
};

// Lesson CRUD operations
const createLesson = async (moduleId, lessonData) => {
  try {
    const lesson = await Lesson.create({
      ...lessonData,
      module_id: moduleId
    });
    return lesson;
  } catch (error) {
    throw new Error(`Error creating lesson: ${error.message}`);
  }
};

const getLessonsByModuleId = async (moduleId) => {
  try {
    const lessons = await Lesson.findAll({
      where: { module_id: moduleId },
      order: [['order', 'ASC']]
    });
    return lessons;
  } catch (error) {
    throw new Error(`Error getting lessons: ${error.message}`);
  }
};

const getLessonById = async (id) => {
  try {
    const lesson = await Lesson.findByPk(id);
    return lesson;
  } catch (error) {
    throw new Error(`Error getting lesson: ${error.message}`);
  }
};

const updateLesson = async (id, updateData) => {
  try {
    const [updatedRows] = await Lesson.update(updateData, {
      where: { id }
    });
    
    if (updatedRows === 0) {
      throw new Error('Lesson not found');
    }
    
    const updatedLesson = await Lesson.findByPk(id);
    return updatedLesson;
  } catch (error) {
    throw new Error(`Error updating lesson: ${error.message}`);
  }
};

const deleteLesson = async (id) => {
  try {
    const deletedRows = await Lesson.destroy({
      where: { id }
    });
    
    if (deletedRows === 0) {
      throw new Error('Lesson not found');
    }
    
    return { message: 'Lesson deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting lesson: ${error.message}`);
  }
};

// Quiz CRUD operations
const createQuiz = async (lessonId, quizData) => {
  try {
    const quiz = await LessonQuiz.create({
      ...quizData,
      lesson_id: lessonId
    });
    return quiz;
  } catch (error) {
    throw new Error(`Error creating quiz: ${error.message}`);
  }
};

const getQuizzesByLessonId = async (lessonId) => {
  try {
    const quizzes = await LessonQuiz.findAll({
      where: { lesson_id: lessonId },
      order: [['sort_order', 'ASC']]
    });
    return quizzes;
  } catch (error) {
    throw new Error(`Error getting quizzes: ${error.message}`);
  }
};

const getQuizById = async (id) => {
  try {
    const quiz = await LessonQuiz.findByPk(id);
    return quiz;
  } catch (error) {
    throw new Error(`Error getting quiz: ${error.message}`);
  }
};

const updateQuiz = async (id, updateData) => {
  try {
    const [updatedRows] = await LessonQuiz.update(updateData, {
      where: { id }
    });
    
    if (updatedRows === 0) {
      throw new Error('Quiz not found');
    }
    
    const updatedQuiz = await LessonQuiz.findByPk(id);
    return updatedQuiz;
  } catch (error) {
    throw new Error(`Error updating quiz: ${error.message}`);
  }
};

const deleteQuiz = async (id) => {
  try {
    const deletedRows = await LessonQuiz.destroy({
      where: { id }
    });
    
    if (deletedRows === 0) {
      throw new Error('Quiz not found');
    }
    
    return { message: 'Quiz deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting quiz: ${error.message}`);
  }
};

module.exports = {
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
};