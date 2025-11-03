const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define(
  'Report',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reporter_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    targetType: {
      type: DataTypes.ENUM('thread', 'post', 'user', 'comment'),
      allowNull: false,
      field: 'target_type',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id',
    },
    reason: {
      type: DataTypes.ENUM(
        'spam',
        'harassment',
        'inappropriate_content',
        'plagiarism',
        'offensive_language',
        'other'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
      defaultValue: 'pending',
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'resolved_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'resolution_notes',
    },
  },
  {
    tableName: 'reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['reporter_id'],
        name: 'reports_reporter_id_idx',
      },
      {
        fields: ['target_type', 'target_id'],
        name: 'reports_target_idx',
      },
      {
        fields: ['reason'],
        name: 'reports_reason_idx',
      },
      {
        fields: ['status'],
        name: 'reports_status_idx',
      },
      {
        fields: ['created_at'],
        name: 'reports_created_at_idx',
      },
    ],
  }
);

module.exports = Report;
