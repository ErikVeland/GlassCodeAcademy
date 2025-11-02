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
const ApiKey = require('./apiKeyModel');
const Badge = require('./badgeModel');
const UserBadge = require('./userBadgeModel');
const Certificate = require('./certificateModel');
const ForumCategory = require('./forumCategoryModel');
const ForumThread = require('./forumThreadModel');
const ForumPost = require('./forumPostModel');
const ForumVote = require('./forumVoteModel');
const Notification = require('./notificationModel');
const NotificationPreference = require('./notificationPreferenceModel');

// Initialize associations that weren't set up in the model files
function initializeAssociations() {
  // Content associations
  // Course -> Modules
  Course.hasMany(Module, {
    foreignKey: 'course_id',
    as: 'modules',
  });

  // Module -> Lessons
  Module.hasMany(Lesson, {
    foreignKey: 'module_id',
    as: 'lessons',
  });

  // Lesson -> Quizzes
  Lesson.hasMany(LessonQuiz, {
    foreignKey: 'lesson_id',
    as: 'quizzes',
  });

  // User -> Progress
  User.hasMany(UserProgress, {
    foreignKey: 'user_id',
    as: 'userProgressRecords',
  });

  // User -> Lesson Progress
  User.hasMany(UserLessonProgress, {
    foreignKey: 'user_id',
    as: 'userLessonProgressRecords',
  });
  UserLessonProgress.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'lessonProgressUser',
  });

  // Lesson -> Lesson Progress
  Lesson.hasMany(UserLessonProgress, {
    foreignKey: 'lesson_id',
    as: 'lessonProgressRecords',
  });
  UserLessonProgress.belongsTo(Lesson, {
    foreignKey: 'lesson_id',
    as: 'progressLesson',
  });

  // Course -> Progress
  Course.hasMany(UserProgress, {
    foreignKey: 'course_id',
    as: 'courseProgressRecords',
  });
  UserProgress.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'progressCourse',
  });

  // User -> Roles (Many-to-Many)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'userRoles',
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'roleUsers',
  });

  // User -> Audit Logs
  User.hasMany(AuditLog, {
    foreignKey: 'user_id',
    as: 'auditLogs',
  });
  AuditLog.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'auditUser',
  });

  // User -> Quiz Attempts
  User.hasMany(QuizAttempt, {
    foreignKey: 'user_id',
    as: 'userQuizAttempts',
  });

  // Lesson -> Quiz Attempts
  Lesson.hasMany(QuizAttempt, {
    foreignKey: 'lesson_id',
    as: 'lessonQuizAttempts',
  });

  // Quiz -> Quiz Attempts
  LessonQuiz.hasMany(QuizAttempt, {
    foreignKey: 'quiz_id',
    as: 'quizQuestionAttempts',
  });

  // Note: Tiers are standalone for now; modules embed tier key in registry synthesis

  // User -> Api Keys
  User.hasMany(ApiKey, {
    foreignKey: 'user_id',
    as: 'apiKeys',
  });
  ApiKey.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'apiKeyUser',
  });
  
  // Badge associations
  Badge.belongsToMany(User, {
    through: UserBadge,
    foreignKey: 'badge_id',
    otherKey: 'user_id',
    as: 'users',
  });
  User.belongsToMany(Badge, {
    through: UserBadge,
    foreignKey: 'user_id',
    otherKey: 'badge_id',
    as: 'badges',
  });
  
  // UserBadge associations
  UserBadge.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'userBadgeUser',
  });
  UserBadge.belongsTo(Badge, {
    foreignKey: 'badge_id',
    as: 'badge',
  });
  
  // Certificate associations
  Certificate.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'certificateUser',
  });
  Certificate.belongsTo(Course, {
    foreignKey: 'user_id',
    as: 'course',
  });
  
  // Forum associations
  ForumCategory.hasMany(ForumThread, {
    foreignKey: 'category_id',
    as: 'threads',
  });
  ForumThread.belongsTo(ForumCategory, {
    foreignKey: 'category_id',
    as: 'category',
  });
  ForumThread.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'author',
  });
  ForumThread.hasMany(ForumPost, {
    foreignKey: 'thread_id',
    as: 'posts',
  });
  ForumPost.belongsTo(ForumThread, {
    foreignKey: 'thread_id',
    as: 'thread',
  });
  ForumPost.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'author',
  });
  ForumPost.hasMany(ForumVote, {
    foreignKey: 'post_id',
    as: 'votes',
  });
  ForumVote.belongsTo(ForumPost, {
    foreignKey: 'post_id',
    as: 'post',
  });
  ForumVote.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'voter',
  });
  
  // Notification associations are already defined in the model files
  // User -> Notifications (hasMany)
  User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications',
  });
  // User -> Notification Preferences (hasOne)
  User.hasOne(NotificationPreference, {
    foreignKey: 'user_id',
    as: 'notificationPreferences',
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
  Tier,
  Academy,
  AuditLog,
  QuizAttempt,
  ApiKey,
  Badge,
  UserBadge,
  Certificate,
  ForumCategory,
  ForumThread,
  ForumPost,
  ForumVote,
  Notification,
  NotificationPreference,
  initializeAssociations,
};
