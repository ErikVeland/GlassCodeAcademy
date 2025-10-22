const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Course = require('./courseModel');
const Lesson = require('./lessonModel');

const UserProgress = sequelize.define('UserProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  completedLessons: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'completed_lessons'
  },
  totalLessons: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_lessons'
  },
  progressPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'progress_percentage'
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
  tableName: 'user_progress',
  timestamps: true,
  underscored: true
});

// Define associations
UserProgress.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserProgress.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course'
});

module.exports = UserProgress;