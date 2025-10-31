const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');

const Badge = sequelize.define(
  'Badge',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON object defining the criteria for earning this badge',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category of the badge (e.g., completion, excellence, participation)',
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points awarded for earning this badge',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'badges',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
Badge.belongsToMany(User, {
  through: 'user_badges',
  foreignKey: 'badge_id',
  otherKey: 'user_id',
  as: 'users',
});

module.exports = Badge;