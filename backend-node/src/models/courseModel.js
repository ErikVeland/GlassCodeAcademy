const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
      references: {
        model: 'academies', // Changed to lowercase table name
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: 'Beginner',
    },
    estimatedHours: {
      type: DataTypes.INTEGER,
      field: 'estimated_hours',
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
  },
  {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Course;
