const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const Academy = sequelize.define(
  'Academy',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
    theme: {
      type: getJSONType(),
      allowNull: true,
    },
    metadata: {
      type: getJSONType(),
      allowNull: true,
    },
  },
  {
    tableName: 'academies',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Academy;
