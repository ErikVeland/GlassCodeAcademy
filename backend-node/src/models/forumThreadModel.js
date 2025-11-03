const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumThread = sequelize.define(
  'ForumThread',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'forum_categories',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned',
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_locked',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count',
    },
    replyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'reply_count',
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reply_at',
    },
    lastReplyUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_reply_user_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    // Moderation fields
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_approved',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'report_count',
    },
  },
  {
    tableName: 'forum_threads',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category_id'],
        name: 'forum_threads_category_id_idx',
      },
      {
        fields: ['user_id'],
        name: 'forum_threads_user_id_idx',
      },
      {
        fields: ['slug'],
        name: 'forum_threads_slug_idx',
      },
      {
        fields: ['is_pinned'],
        name: 'forum_threads_is_pinned_idx',
      },
      {
        fields: ['is_active'],
        name: 'forum_threads_is_active_idx',
      },
      {
        fields: ['created_at'],
        name: 'forum_threads_created_at_idx',
      },
      {
        fields: ['last_reply_at'],
        name: 'forum_threads_last_reply_at_idx',
      },
      {
        fields: ['is_approved'],
        name: 'forum_threads_is_approved_idx',
      },
      {
        fields: ['report_count'],
        name: 'forum_threads_report_count_idx',
      },
    ],
  }
);

module.exports = ForumThread;
