const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProgress = sequelize.define(
  'UserProgress',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    completedLessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'completed_lessons',
    },
    totalLessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_lessons',
    },
    progressPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
      field: 'progress_percentage',
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
    },
  },
  {
    tableName: 'user_progress',
    timestamps: true,
    underscored: true,
  }
);

// Associations are initialized centrally in src/models/index.js

module.exports = UserProgress;
