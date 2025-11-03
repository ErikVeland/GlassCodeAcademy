const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const AuditLog = sequelize.define(
  'AuditLog',
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type',
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'resource_id',
    },
    resourceName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'resource_name',
    },
    details: {
      type: getJSONType(),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_agent',
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
  }
);

// Associations initialized centrally in src/models/index.js

module.exports = AuditLog;
