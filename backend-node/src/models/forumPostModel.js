const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumPost = sequelize.define(
  'ForumPost',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    threadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'thread_id',
      references: {
        model: 'forum_threads',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'forum_posts',
        key: 'id',
      },
    },
    isAcceptedAnswer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_accepted_answer',
    },
    voteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'vote_count',
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
    tableName: 'forum_posts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['thread_id'],
        name: 'forum_posts_thread_id_idx',
      },
      {
        fields: ['user_id'],
        name: 'forum_posts_user_id_idx',
      },
      {
        fields: ['parent_id'],
        name: 'forum_posts_parent_id_idx',
      },
      {
        fields: ['is_accepted_answer'],
        name: 'forum_posts_is_accepted_answer_idx',
      },
      {
        fields: ['is_active'],
        name: 'forum_posts_is_active_idx',
      },
      {
        fields: ['created_at'],
        name: 'forum_posts_created_at_idx',
      },
      {
        fields: ['is_approved'],
        name: 'forum_posts_is_approved_idx',
      },
      {
        fields: ['report_count'],
        name: 'forum_posts_report_count_idx',
      },
    ],
  }
);

module.exports = ForumPost;
