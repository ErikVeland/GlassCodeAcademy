const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Course = require('./courseModel');

const Module = sequelize.define(
  'Module',
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
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'course_id',
      references: {
        model: 'courses', // Changed to lowercase table name
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
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
  },
  {
    tableName: 'modules',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
Module.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
});

module.exports = Module;
