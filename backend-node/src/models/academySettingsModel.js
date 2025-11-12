const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const AcademySettings = sequelize.define(
  'AcademySettings',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'academy_id',
      references: {
        model: 'academies',
        key: 'id',
      },
    },
    tenantMode: {
      type: DataTypes.ENUM('shared', 'schema', 'database'),
      defaultValue: 'shared',
      allowNull: false,
      field: 'tenant_mode',
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_users',
      comment: 'Maximum number of users allowed, null for unlimited',
    },
    maxStorageGb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_storage_gb',
      comment: 'Maximum storage in GB, null for unlimited',
    },
    featuresEnabled: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      field: 'features_enabled',
      comment: 'Feature flags and enabled features',
    },
    branding: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      comment: 'Custom branding configuration',
    },
    integrations: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      comment: 'External service integration configs',
    },
  },
  {
    tableName: 'academy_settings',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
AcademySettings.associate = (models) => {
  AcademySettings.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
};

module.exports = AcademySettings;
