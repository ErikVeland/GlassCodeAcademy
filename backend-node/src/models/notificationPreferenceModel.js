<<<<<<< Local
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
=======
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
>>>>>>> Remote

<<<<<<< Local
const NotificationPreference = sequelize.define(
  'NotificationPreference',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'user_category_unique',
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'user_category_unique',
      comment: 'Category of notification (e.g., lesson, quiz, announcement)',
    },
    emailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'email_enabled',
    },
    inAppEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'in_app_enabled',
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'push_enabled',
    },
    smsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_enabled',
    },
    digestFrequency: {
      type: DataTypes.STRING,
      defaultValue: 'immediately', // immediately, daily, weekly, never
      field: 'digest_frequency',
    },
    lastDigestSent: {
      type: DataTypes.DATE,
      field: 'last_digest_sent',
    },
  },
  {
    tableName: 'notification_preferences',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'category'],
        name: 'user_category_unique',
      },
    ],
  }
);

// Define associations
NotificationPreference.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = NotificationPreference;
=======
const NotificationPreference = sequelize.define(
  'NotificationPreference',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'user_category_unique',
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'user_category_unique',
      comment: 'Category of notification (e.g., lesson, quiz, announcement)',
    },
    emailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'email_enabled',
    },
    inAppEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'in_app_enabled',
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'push_enabled',
    },
    smsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sms_enabled',
    },
    digestFrequency: {
      type: DataTypes.ENUM('immediately', 'hourly', 'daily', 'weekly', 'never'),
      defaultValue: 'immediately',
      field: 'digest_frequency',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    tableName: 'notification_preferences',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'category'],
        name: 'user_category_unique',
      },
      {
        fields: ['user_id'],
        name: 'notification_preferences_user_id_idx',
      },
      {
        fields: ['category'],
        name: 'notification_preferences_category_idx',
      },
    ],
  }
);

module.exports = NotificationPreference;
>>>>>>> Remote