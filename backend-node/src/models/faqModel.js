const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FAQ = sequelize.define(
  'FAQ',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count',
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'helpful_count',
    },
    notHelpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'not_helpful_count',
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
    tableName: 'faqs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category'],
        name: 'faqs_category_idx',
      },
      {
        fields: ['is_published'],
        name: 'faqs_is_published_idx',
      },
      {
        fields: ['order'],
        name: 'faqs_order_idx',
      },
      {
        fields: ['created_by'],
        name: 'faqs_created_by_idx',
      },
      {
        fields: ['created_at'],
        name: 'faqs_created_at_idx',
      },
    ],
  }
);

module.exports = FAQ;
