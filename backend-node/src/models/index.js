const Course = require('./courseModel');
const Module = require('./moduleModel');
const Lesson = require('./lessonModel');
const LessonQuiz = require('./quizModel');
const User = require('./userModel');
const UserProgress = require('./progressModel');
const UserLessonProgress = require('./userLessonProgressModel');
const Role = require('./roleModel');
const UserRole = require('./userRoleModel');
const Tier = require('./tierModel');
const Academy = require('./academyModel');
const AuditLog = require('./auditLogModel');
const QuizAttempt = require('./quizAttemptModel');

// Initialize associations that weren't set up in the model files
function initializeAssociations() {
  // Content associations
  // Course -> Modules
  Course.hasMany(Module, {
    foreignKey: 'course_id',
    as: 'modules'
  });

  // Module -> Lessons
  Module.hasMany(Lesson, {
    foreignKey: 'module_id',
    as: 'lessons'
  });

  // Lesson -> Quizzes
  Lesson.hasMany(LessonQuiz, {
    foreignKey: 'lesson_id',
    as: 'quizzes'
  });
  
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

  // User -> Audit Logs
  User.hasMany(AuditLog, {
    foreignKey: 'user_id',
    as: 'auditLogs'
  });
  AuditLog.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'auditUser'
  });

  // User -> Quiz Attempts
  User.hasMany(QuizAttempt, {
    foreignKey: 'user_id',
    as: 'quizAttempts'
  });

  // Lesson -> Quiz Attempts
  Lesson.hasMany(QuizAttempt, {
    foreignKey: 'lesson_id',
    as: 'quizAttempts'
  });

  // Quiz -> Quiz Attempts
  LessonQuiz.hasMany(QuizAttempt, {
    foreignKey: 'quiz_id',
    as: 'quizAttempts'
  });

  // Note: Tiers are standalone for now; modules embed tier key in registry synthesis
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
  Tier,
  Academy,
  AuditLog,
  QuizAttempt,
  initializeAssociations
};