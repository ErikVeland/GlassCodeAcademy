const { Course, Module, Lesson, Quiz } = require('../models');

class ContentService {
  // Course methods
  async getAllCourses() {
    try {
      return await Course.findAll({
        where: { isPublished: true },
        order: [['order', 'ASC']],
        include: [{
          model: Module,
          as: 'modules',
          where: { isPublished: true },
          required: false,
          include: [{
            model: Lesson,
            as: 'lessons',
            where: { isPublished: true },
            required: false
          }]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  async getCourseBySlug(slug) {
    try {
      return await Course.findOne({
        where: { slug, isPublished: true },
        include: [{
          model: Module,
          as: 'modules',
          where: { isPublished: true },
          required: false,
          order: [['order', 'ASC']],
          include: [{
            model: Lesson,
            as: 'lessons',
            where: { isPublished: true },
            required: false,
            order: [['order', 'ASC']]
          }]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  }

  async getCourseById(id) {
    try {
      return await Course.findByPk(id, {
        include: [{
          model: Module,
          as: 'modules',
          order: [['order', 'ASC']],
          include: [{
            model: Lesson,
            as: 'lessons',
            order: [['order', 'ASC']],
            include: [{
              model: Quiz,
              as: 'quizzes',
              order: [['sortOrder', 'ASC']]
            }]
          }]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  }

  // Module methods
  async getModulesByCourseId(courseId) {
    try {
      return await Module.findAll({
        where: { courseId, isPublished: true },
        order: [['order', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }
  }

  async getModuleBySlug(slug) {
    try {
      return await Module.findOne({
        where: { slug, isPublished: true },
        include: [{
          model: Lesson,
          as: 'lessons',
          where: { isPublished: true },
          order: [['order', 'ASC']]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch module: ${error.message}`);
    }
  }

  async getModuleById(id) {
    try {
      return await Module.findByPk(id, {
        include: [{
          model: Lesson,
          as: 'lessons',
          order: [['order', 'ASC']],
          include: [{
            model: Quiz,
            as: 'quizzes',
            order: [['sortOrder', 'ASC']]
          }]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch module: ${error.message}`);
    }
  }

  // Lesson methods
  async getLessonsByModuleId(moduleId) {
    try {
      return await Lesson.findAll({
        where: { moduleId, isPublished: true },
        order: [['order', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch lessons: ${error.message}`);
    }
  }

  async getLessonBySlug(slug) {
    try {
      return await Lesson.findOne({
        where: { slug, isPublished: true },
        include: [{
          model: Quiz,
          as: 'quizzes',
          order: [['sortOrder', 'ASC']]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch lesson: ${error.message}`);
    }
  }

  async getLessonById(id) {
    try {
      return await Lesson.findByPk(id, {
        include: [{
          model: Quiz,
          as: 'quizzes',
          order: [['sortOrder', 'ASC']]
        }]
      });
    } catch (error) {
      throw new Error(`Failed to fetch lesson: ${error.message}`);
    }
  }

  // Quiz methods
  async getQuizzesByLessonId(lessonId) {
    try {
      return await Quiz.findAll({
        where: { lessonId, isPublished: true },
        order: [['sortOrder', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch quizzes: ${error.message}`);
    }
  }

  async getQuizById(id) {
    try {
      return await Quiz.findByPk(id);
    } catch (error) {
      throw new Error(`Failed to fetch quiz: ${error.message}`);
    }
  }

  // Admin methods for CMS
  async createCourse(courseData) {
    try {
      return await Course.create(courseData);
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  async updateCourse(id, courseData) {
    try {
      const course = await Course.findByPk(id);
      if (!course) {
        throw new Error('Course not found');
      }
      return await course.update(courseData);
    } catch (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  async deleteCourse(id) {
    try {
      const course = await Course.findByPk(id);
      if (!course) {
        throw new Error('Course not found');
      }
      return await course.destroy();
    } catch (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  async createModule(moduleData) {
    try {
      return await Module.create(moduleData);
    } catch (error) {
      throw new Error(`Failed to create module: ${error.message}`);
    }
  }

  async updateModule(id, moduleData) {
    try {
      const module = await Module.findByPk(id);
      if (!module) {
        throw new Error('Module not found');
      }
      return await module.update(moduleData);
    } catch (error) {
      throw new Error(`Failed to update module: ${error.message}`);
    }
  }

  async deleteModule(id) {
    try {
      const module = await Module.findByPk(id);
      if (!module) {
        throw new Error('Module not found');
      }
      return await module.destroy();
    } catch (error) {
      throw new Error(`Failed to delete module: ${error.message}`);
    }
  }

  async createLesson(lessonData) {
    try {
      return await Lesson.create(lessonData);
    } catch (error) {
      throw new Error(`Failed to create lesson: ${error.message}`);
    }
  }

  async updateLesson(id, lessonData) {
    try {
      const lesson = await Lesson.findByPk(id);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      return await lesson.update(lessonData);
    } catch (error) {
      throw new Error(`Failed to update lesson: ${error.message}`);
    }
  }

  async deleteLesson(id) {
    try {
      const lesson = await Lesson.findByPk(id);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      return await lesson.destroy();
    } catch (error) {
      throw new Error(`Failed to delete lesson: ${error.message}`);
    }
  }

  async createQuiz(quizData) {
    try {
      return await Quiz.create(quizData);
    } catch (error) {
      throw new Error(`Failed to create quiz: ${error.message}`);
    }
  }

  async updateQuiz(id, quizData) {
    try {
      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        throw new Error('Quiz not found');
      }
      return await quiz.update(quizData);
    } catch (error) {
      throw new Error(`Failed to update quiz: ${error.message}`);
    }
  }

  async deleteQuiz(id) {
    try {
      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        throw new Error('Quiz not found');
      }
      return await quiz.destroy();
    } catch (error) {
      throw new Error(`Failed to delete quiz: ${error.message}`);
    }
  }
}

module.exports = new ContentService();