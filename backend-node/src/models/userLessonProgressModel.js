const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Lesson = require('./lessonModel');

const UserLessonProgress = sequelize.define('UserLessonProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  timeSpentMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'time_spent_minutes'
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  }
}, {
  tableName: 'user_lesson_progress',
  timestamps: true,
  underscored: true
});

// Define associations
UserLessonProgress.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserLessonProgress.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson'
});

module.exports = UserLessonProgress;