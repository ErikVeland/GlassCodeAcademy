const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Badge = require('./badgeModel');

const UserBadge = sequelize.define(
  'UserBadge',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    badgeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'badge_id',
    },
    awardedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'awarded_at',
    },
    awardedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'awarded_by',
      comment: 'System or user who awarded the badge',
    },
  },
  {
    tableName: 'user_badges',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
UserBadge.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

UserBadge.belongsTo(Badge, {
  foreignKey: 'badge_id',
  as: 'badge',
});

module.exports = UserBadge;