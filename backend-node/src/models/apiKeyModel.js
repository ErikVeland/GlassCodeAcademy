const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  hashedKey: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'hashed_key',
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  }
}, {
  tableName: 'api_keys',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['hashed_key']
    }
  ]
});

module.exports = ApiKey;