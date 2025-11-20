const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lesson = sequelize.define(
  'Lesson',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'module_id',
      references: {
        model: 'modules',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_minutes',
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
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
    },
    workflowState: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'workflow_state',
    },
    currentVersionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'current_version_id',
    },
    qualityScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'quality_score',
    },
    lastValidatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_validated_at',
    },
  },
  {
    tableName: 'lessons',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Lesson;
