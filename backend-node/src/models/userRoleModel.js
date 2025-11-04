const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Role = require('./roleModel');

const UserRole = sequelize.define(
  'UserRole',
  {
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      field: 'role_id',
      allowNull: false,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'assigned_at',
    },
  },
  {
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
UserRole.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'roleUser',
});

UserRole.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

module.exports = UserRole;
