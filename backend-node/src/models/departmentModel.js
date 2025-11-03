const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const Department = sequelize.define(
  'Department',
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'departments',
        key: 'id',
      },
      comment: 'Parent department for hierarchical structure',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
    metadata: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: {},
      comment: 'Custom fields and additional data',
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['academy_id', 'slug'],
        name: 'departments_academy_slug_unique',
      },
    ],
  }
);

// Define associations
Department.associate = (models) => {
  Department.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  Department.belongsTo(models.Department, {
    foreignKey: 'parent_id',
    as: 'parent',
  });

  Department.hasMany(models.Department, {
    foreignKey: 'parent_id',
    as: 'children',
  });

  Department.belongsTo(models.User, {
    foreignKey: 'manager_id',
    as: 'manager',
  });

  Department.hasMany(models.AcademyMembership, {
    foreignKey: 'department_id',
    as: 'memberships',
  });
};

module.exports = Department;
