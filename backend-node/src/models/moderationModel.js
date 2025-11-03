const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModerationAction = sequelize.define(
  'ModerationAction',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    targetType: {
      type: DataTypes.ENUM('thread', 'post', 'user'),
      allowNull: false,
      field: 'target_type',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id',
    },
    actionType: {
      type: DataTypes.ENUM(
        'approve',
        'reject',
        'delete',
        'lock',
        'unlock',
        'pin',
        'unpin',
        'warn',
        'ban'
      ),
      allowNull: false,
      field: 'action_type',
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    moderatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'moderator_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'moderation_actions',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['target_type', 'target_id'],
        name: 'moderation_actions_target_idx',
      },
      {
        fields: ['moderator_id'],
        name: 'moderation_actions_moderator_id_idx',
      },
      {
        fields: ['action_type'],
        name: 'moderation_actions_action_type_idx',
      },
      {
        fields: ['created_at'],
        name: 'moderation_actions_created_at_idx',
      },
    ],
  }
);

module.exports = ModerationAction;
