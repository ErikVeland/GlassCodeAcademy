const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumCategory = sequelize.define(
  'ForumCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: 'forum_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['slug'],
        name: 'forum_categories_slug_idx',
      },
      {
        fields: ['is_active'],
        name: 'forum_categories_is_active_idx',
      },
      {
        fields: ['order'],
        name: 'forum_categories_order_idx',
      },
    ],
  }
);

module.exports = ForumCategory;