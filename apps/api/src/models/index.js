import Academy from './academyModel.js';
import Course from './courseModel.js';
import Module from './moduleModel.js';
import Lesson from './lessonModel.js';
import Quiz from './quizModel.js';
import User from './userModel.js';
import Role from './roleModel.js';
import UserRole from './userRoleModel.js';
import { sequelize } from '../config/database.js';

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

// User-Role relationships
User.hasMany(UserRole, {
  foreignKey: 'userId',
  as: 'userRoles',
});

UserRole.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Role.hasMany(UserRole, {
  foreignKey: 'roleId',
  as: 'userRoles',
});

UserRole.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
});

// Export models and initialization function
const initializeAssociations = () => {
  // Associations are already defined above
  // This function is for consistency with existing code patterns
};

export {
  Academy,
  Course,
  Module,
  Lesson,
  Quiz,
  User,
  Role,
  UserRole,
  sequelize,
  initializeAssociations,
};
