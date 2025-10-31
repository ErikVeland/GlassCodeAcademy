<<<<<<< Local
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
=======
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
>>>>>>> Remote

<<<<<<< Local
const Notification = sequelize.define(
  'Notification',
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'info', // info, warning, success, error
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at',
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // 0 = low, 1 = medium, 2 = high
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., 'lesson', 'quiz', 'announcement', 'system'
    },
    entityId: {
      type: DataTypes.INTEGER,
      field: 'entity_id',
      comment: 'ID of the related entity (e.g., lesson_id, quiz_id)',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata about the notification',
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_at',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      field: 'delivered_at',
    },
    deliveryMethod: {
      type: DataTypes.STRING,
      field: 'delivery_method', // 'email', 'in_app', 'sms', 'push'
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['is_read'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['sent_at'],
      },
    ],
  }
);

// Define associations
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = Notification;
=======
const Notification = sequelize.define(
  'Notification',
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'info', // info, warning, success, error
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category of notification (e.g., lesson, quiz, announcement)',
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'entity_id',
      comment: 'Reference to specific entity (lesson, quiz, etc.)',
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'entity_type',
      comment: 'Type of entity referenced (lesson, quiz, etc.)',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data related to the notification',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
        name: 'notifications_user_id_idx',
      },
      {
        fields: ['is_read'],
        name: 'notifications_is_read_idx',
      },
      {
        fields: ['category'],
        name: 'notifications_category_idx',
      },
      {
        fields: ['priority'],
        name: 'notifications_priority_idx',
      },
      {
        fields: ['created_at'],
        name: 'notifications_created_at_idx',
      },
    ],
  }
);

module.exports = Notification;
>>>>>>> Remote