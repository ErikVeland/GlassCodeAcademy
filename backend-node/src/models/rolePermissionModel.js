const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const RolePermission = sequelize.define(
  'RolePermission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
      references: {
        model: 'academies',
        key: 'id',
      },
      comment: 'Academy context for permission, null for global',
    },
    scope: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      comment: 'Additional scope constraints for permission',
    },
  },
  {
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id', 'academy_id'],
        name: 'role_permissions_unique',
      },
    ],
  }
);

// Define associations
RolePermission.associate = (models) => {
  RolePermission.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role',
  });

  RolePermission.belongsTo(models.Permission, {
    foreignKey: 'permission_id',
    as: 'permission',
  });

  RolePermission.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
};

module.exports = RolePermission;
