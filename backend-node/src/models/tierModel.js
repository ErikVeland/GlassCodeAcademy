const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tier = sequelize.define('Tier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'key'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  focusArea: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'focus_area'
  },
  color: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  learningObjectives: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'learning_objectives'
  }
}, {
  tableName: 'tiers',
  timestamps: true,
  underscored: true
});

module.exports = Tier;