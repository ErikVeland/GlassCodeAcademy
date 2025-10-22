const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Course = require('./courseModel');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published'
  }
}, {
  tableName: 'modules',
  timestamps: true,
  underscored: true
});

// Define associations
Module.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course'
});

module.exports = Module;