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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.INTEGER,
      field: 'role_id',
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
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
  foreignKey: 'userId',
  as: 'roleUser',
});

UserRole.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
});

module.exports = UserRole;
