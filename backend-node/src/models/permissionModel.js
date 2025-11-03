const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define(
  'Permission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment:
        'Unique permission identifier (e.g., content.create, user.manage)',
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type',
      comment: 'Resource type this permission applies to',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Action type (create, read, update, delete, etc.)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of permission',
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_system',
      comment: 'System-level permission (cannot be deleted)',
    },
  },
  {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
Permission.associate = (models) => {
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
  });

  Permission.hasMany(models.RolePermission, {
    foreignKey: 'permission_id',
    as: 'rolePermissions',
  });
};

module.exports = Permission;
