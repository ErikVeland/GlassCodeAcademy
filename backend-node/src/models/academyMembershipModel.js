const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const AcademyMembership = sequelize.define(
  'AcademyMembership',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'academy_id',
      references: {
        model: 'academies',
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
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'suspended', 'archived'),
      defaultValue: 'active',
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
    customPermissions: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: {},
      field: 'custom_permissions',
      comment: 'User-specific permission overrides',
    },
    metadata: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: {},
      comment: 'Additional membership data',
    },
  },
  {
    tableName: 'academy_memberships',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['academy_id', 'user_id'],
        name: 'academy_memberships_academy_user_unique',
      },
    ],
  }
);

// Define associations
AcademyMembership.associate = (models) => {
  AcademyMembership.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  AcademyMembership.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  AcademyMembership.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role',
  });

  AcademyMembership.belongsTo(models.Department, {
    foreignKey: 'department_id',
    as: 'department',
  });
};

module.exports = AcademyMembership;
