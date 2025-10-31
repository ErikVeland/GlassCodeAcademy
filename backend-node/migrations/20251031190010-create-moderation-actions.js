'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('moderation_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      target_type: {
        type: Sequelize.ENUM('thread', 'post', 'user'),
        allowNull: false
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      action_type: {
        type: Sequelize.ENUM('approve', 'reject', 'delete', 'lock', 'unlock', 'pin', 'unpin', 'warn', 'ban'),
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      moderator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('moderation_actions', ['target_type', 'target_id'], {
      name: 'moderation_actions_target_idx'
    });

    await queryInterface.addIndex('moderation_actions', ['moderator_id'], {
      name: 'moderation_actions_moderator_id_idx'
    });

    await queryInterface.addIndex('moderation_actions', ['action_type'], {
      name: 'moderation_actions_action_type_idx'
    });

    await queryInterface.addIndex('moderation_actions', ['created_at'], {
      name: 'moderation_actions_created_at_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('moderation_actions');
  }
};