const Course = require('./courseModel');
const Module = require('./moduleModel');
const Lesson = require('./lessonModel');
const LessonQuiz = require('./quizModel');
const User = require('./userModel');
const UserProgress = require('./progressModel');
const UserLessonProgress = require('./userLessonProgressModel');
const Role = require('./roleModel');
const UserRole = require('./userRoleModel');

// Initialize associations that weren't set up in the model files
function initializeAssociations() {
  // Course -> Modules (already defined in moduleModel.js)
  // Module -> Lessons (already defined in lessonModel.js)
  // Lesson -> Quizzes (already defined in quizModel.js)
  
  // User -> Progress
  User.hasMany(UserProgress, {
    foreignKey: 'user_id',
    as: 'userProgressRecords'
  });
  UserProgress.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'progressUser'
  });

  // User -> Lesson Progress
  User.hasMany(UserLessonProgress, {
    foreignKey: 'user_id',
    as: 'lessonProgressRecords'
  });
  UserLessonProgress.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'lessonProgressUser'
  });

  // Lesson -> Lesson Progress
  Lesson.hasMany(UserLessonProgress, {
    foreignKey: 'lesson_id',
    as: 'progressRecords'
  });
  UserLessonProgress.belongsTo(Lesson, {
    foreignKey: 'lesson_id',
    as: 'progressLesson'
  });

  // Course -> Progress
  Course.hasMany(UserProgress, {
    foreignKey: 'course_id',
    as: 'progressRecords'
  });
  UserProgress.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'progressCourse'
  });

  // User -> Roles (Many-to-Many)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'userRoles'
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'roleUsers'
  });
}

module.exports = {
  Course,
  Module,
  Lesson,
  LessonQuiz,
  User,
  UserProgress,
  UserLessonProgress,
  Role,
  UserRole,
  initializeAssociations
};