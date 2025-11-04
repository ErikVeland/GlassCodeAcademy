'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('info', 'warning', 'success', 'error'),
        defaultValue: 'info'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('announcements', ['is_published'], {
      name: 'announcements_is_published_idx'
    });

    await queryInterface.addIndex('announcements', ['priority'], {
      name: 'announcements_priority_idx'
    });

    await queryInterface.addIndex('announcements', ['type'], {
      name: 'announcements_type_idx'
    });

    await queryInterface.addIndex('announcements', ['published_at'], {
      name: 'announcements_published_at_idx'
    });

    await queryInterface.addIndex('announcements', ['expires_at'], {
      name: 'announcements_expires_at_idx'
    });

    await queryInterface.addIndex('announcements', ['created_by'], {
      name: 'announcements_created_by_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('announcements');
  }
};