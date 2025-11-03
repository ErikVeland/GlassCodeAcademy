const sequelize = require('../config/database');
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
const AcademySettings = require('./academySettingsModel');
const AcademyMembership = require('./academyMembershipModel');
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

// Phase 2 Models
const Department = require('./departmentModel');
const Permission = require('./permissionModel');
const RolePermission = require('./rolePermissionModel');
const ContentVersion = require('./contentVersionModel');
const ContentWorkflow = require('./contentWorkflowModel');
const ContentApproval = require('./contentApprovalModel');
const Asset = require('./assetModel');
const AssetUsage = require('./assetUsageModel');
const ValidationRule = require('./validationRuleModel');
const ValidationResult = require('./validationResultModel');
const ContentPackage = require('./contentPackageModel');
const ContentImport = require('./contentImportModel');
const Announcement = require('./announcementModel');
const FAQ = require('./faqModel');
const ModerationAction = require('./moderationModel');
const Report = require('./reportModel');

// Initialize associations that weren't set up in the model files
function initializeAssociations() {
  // Academy -> Settings (One-to-One)
  Academy.hasOne(AcademySettings, {
    foreignKey: 'academy_id',
    as: 'settings',
  });
  AcademySettings.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  // Academy -> Memberships (One-to-Many)
  Academy.hasMany(AcademyMembership, {
    foreignKey: 'academy_id',
    as: 'memberships',
  });
  AcademyMembership.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  // User -> Academy Memberships (One-to-Many)
  User.hasMany(AcademyMembership, {
    foreignKey: 'user_id',
    as: 'academyMemberships',
  });
  AcademyMembership.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

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

  // Phase 2 Associations

  // Academy -> Departments
  Academy.hasMany(Department, {
    foreignKey: 'academy_id',
    as: 'departments',
  });
  Department.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  // Department hierarchy
  Department.hasMany(Department, {
    foreignKey: 'parent_id',
    as: 'subDepartments',
  });
  Department.belongsTo(Department, {
    foreignKey: 'parent_id',
    as: 'parentDepartment',
  });

  // Role -> Permissions (Many-to-Many)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
  });

  // Content Versioning
  Academy.hasMany(ContentVersion, {
    foreignKey: 'academy_id',
    as: 'contentVersions',
  });
  ContentVersion.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  ContentVersion.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator',
  });

  // Content Workflows
  Academy.hasMany(ContentWorkflow, {
    foreignKey: 'academy_id',
    as: 'workflows',
  });
  ContentWorkflow.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  ContentWorkflow.hasMany(ContentApproval, {
    foreignKey: 'workflow_id',
    as: 'approvals',
  });
  ContentApproval.belongsTo(ContentWorkflow, {
    foreignKey: 'workflow_id',
    as: 'workflow',
  });
  ContentApproval.belongsTo(User, {
    foreignKey: 'approver_id',
    as: 'approver',
  });

  // Assets
  Academy.hasMany(Asset, {
    foreignKey: 'academy_id',
    as: 'assets',
  });
  Asset.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  Asset.belongsTo(User, {
    foreignKey: 'uploaded_by',
    as: 'uploader',
  });
  Asset.hasMany(AssetUsage, {
    foreignKey: 'asset_id',
    as: 'usages',
  });
  AssetUsage.belongsTo(Asset, {
    foreignKey: 'asset_id',
    as: 'asset',
  });

  // Validation Rules and Results
  Academy.hasMany(ValidationRule, {
    foreignKey: 'academy_id',
    as: 'validationRules',
  });
  ValidationRule.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  ValidationRule.hasMany(ValidationResult, {
    foreignKey: 'rule_id',
    as: 'results',
  });
  ValidationResult.belongsTo(ValidationRule, {
    foreignKey: 'rule_id',
    as: 'rule',
  });

  // Content Packages and Imports
  Academy.hasMany(ContentPackage, {
    foreignKey: 'academy_id',
    as: 'packages',
  });
  ContentPackage.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  ContentPackage.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator',
  });
  ContentPackage.hasMany(ContentImport, {
    foreignKey: 'package_id',
    as: 'imports',
  });
  ContentImport.belongsTo(ContentPackage, {
    foreignKey: 'package_id',
    as: 'package',
  });
  ContentImport.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  ContentImport.belongsTo(User, {
    foreignKey: 'imported_by',
    as: 'importer',
  });

  // Announcements and FAQs
  Academy.hasMany(Announcement, {
    foreignKey: 'academy_id',
    as: 'announcements',
  });
  Announcement.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  Announcement.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator',
  });

  Academy.hasMany(FAQ, {
    foreignKey: 'academy_id',
    as: 'faqs',
  });
  FAQ.belongsTo(Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
  FAQ.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator',
  });

  // Moderation and Reports
  User.hasMany(ModerationAction, {
    foreignKey: 'moderator_id',
    as: 'moderationActions',
  });
  ModerationAction.belongsTo(User, {
    foreignKey: 'moderator_id',
    as: 'moderator',
  });

  User.hasMany(Report, {
    foreignKey: 'reporter_id',
    as: 'reports',
  });
  Report.belongsTo(User, {
    foreignKey: 'reporter_id',
    as: 'reporter',
  });
  Report.belongsTo(User, {
    foreignKey: 'reviewed_by',
    as: 'reviewer',
  });
}

module.exports = {
  sequelize,
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
  AcademySettings,
  AcademyMembership,
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
  // Phase 2 Models
  Department,
  Permission,
  RolePermission,
  ContentVersion,
  ContentWorkflow,
  ContentApproval,
  Asset,
  AssetUsage,
  ValidationRule,
  ValidationResult,
  ContentPackage,
  ContentImport,
  Announcement,
  FAQ,
  ModerationAction,
  Report,
  initializeAssociations,
};
