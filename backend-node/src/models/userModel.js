const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name',
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'student',
      validate: {
        isIn: [['admin', 'instructor', 'student', 'guest']],
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_hash',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
    },
    oauthProvider: {
      type: DataTypes.STRING(50),
      field: 'oauth_provider',
    },
    oauthId: {
      type: DataTypes.STRING(255),
      field: 'oauth_id',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['oauth_provider', 'oauth_id'],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Only hash password if user is not using OAuth
        if (user.passwordHash && !user.oauthProvider) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      beforeUpdate: async (user) => {
        // Only hash password if it's being changed and user is not using OAuth
        if (user.changed('passwordHash') && !user.oauthProvider) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
    },
  }
);

// Method to validate password
User.prototype.validatePassword = async function (password) {
  // OAuth users don't have passwords
  if (this.oauthProvider) {
    return false;
  }
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
