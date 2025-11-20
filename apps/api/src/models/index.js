const Academy = require('./academyModel');
const Course = require('./courseModel');
const Module = require('./moduleModel');
const Lesson = require('./lessonModel');
const Quiz = require('./quizModel');

// Define relationships
Course.hasMany(Module, {
  foreignKey: 'courseId',
  as: 'modules',
});

Module.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course',
});

Module.hasMany(Lesson, {
  foreignKey: 'moduleId',
  as: 'lessons',
});

Lesson.belongsTo(Module, {
  foreignKey: 'moduleId',
  as: 'module',
});

Lesson.hasMany(Quiz, {
  foreignKey: 'lessonId',
  as: 'quizzes',
});

Quiz.belongsTo(Lesson, {
  foreignKey: 'lessonId',
  as: 'lesson',
});

// Export models and initialization function
module.exports = {
  Academy,
  Course,
  Module,
  Lesson,
  Quiz,
  initializeAssociations: () => {
    // Associations are already defined above
    // This function is for consistency with existing code patterns
  },
};
