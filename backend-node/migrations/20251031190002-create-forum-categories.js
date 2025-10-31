'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('forum_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      icon: {
        type: Sequelize.STRING(50),
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
    await queryInterface.addIndex('forum_categories', ['slug'], {
      name: 'forum_categories_slug_idx'
    });

    await queryInterface.addIndex('forum_categories', ['is_active'], {
      name: 'forum_categories_is_active_idx'
    });

    await queryInterface.addIndex('forum_categories', ['order'], {
      name: 'forum_categories_order_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('forum_categories');
  }
};