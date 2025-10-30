const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Module = require('./moduleModel');

const Lesson = sequelize.define(
  'Lesson',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: 'Beginner',
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      field: 'estimated_minutes',
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
  },
  {
    tableName: 'lessons',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
Lesson.belongsTo(Module, {
  foreignKey: 'module_id',
  as: 'module',
});

module.exports = Lesson;
