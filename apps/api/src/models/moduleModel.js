const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Module = sequelize.define(
  'Module',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'course_id',
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    difficulty: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      allowNull: true,
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      field: 'estimated_hours',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    technologies: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    prerequisites: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'modules',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Module;
