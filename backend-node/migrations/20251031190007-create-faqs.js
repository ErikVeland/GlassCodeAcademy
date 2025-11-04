'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('faqs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      question: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      answer: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      helpful_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      not_helpful_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('faqs', ['category'], {
      name: 'faqs_category_idx'
    });

    await queryInterface.addIndex('faqs', ['is_published'], {
      name: 'faqs_is_published_idx'
    });

    await queryInterface.addIndex('faqs', ['order'], {
      name: 'faqs_order_idx'
    });

    await queryInterface.addIndex('faqs', ['created_by'], {
      name: 'faqs_created_by_idx'
    });

    await queryInterface.addIndex('faqs', ['created_at'], {
      name: 'faqs_created_at_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('faqs');
  }
};