const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define(
  'Announcement',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
      defaultValue: 'info',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'announcements',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['is_published'],
        name: 'announcements_is_published_idx',
      },
      {
        fields: ['priority'],
        name: 'announcements_priority_idx',
      },
      {
        fields: ['type'],
        name: 'announcements_type_idx',
      },
      {
        fields: ['published_at'],
        name: 'announcements_published_at_idx',
      },
      {
        fields: ['expires_at'],
        name: 'announcements_expires_at_idx',
      },
      {
        fields: ['created_by'],
        name: 'announcements_created_by_idx',
      },
    ],
  }
);

module.exports = Announcement;
