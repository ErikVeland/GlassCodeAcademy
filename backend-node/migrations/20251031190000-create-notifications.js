'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'info'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'notifications_user_id_idx'
    });

    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'notifications_is_read_idx'
    });

    await queryInterface.addIndex('notifications', ['category'], {
      name: 'notifications_category_idx'
    });

    await queryInterface.addIndex('notifications', ['priority'], {
      name: 'notifications_priority_idx'
    });

    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'notifications_created_at_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('notifications');
  }
};