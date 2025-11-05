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
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
      references: {
        model: 'academies', // Changed to lowercase table name
        key: 'id',
      },
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'module_id',
      references: {
        model: 'modules', // Changed to lowercase table name
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
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
