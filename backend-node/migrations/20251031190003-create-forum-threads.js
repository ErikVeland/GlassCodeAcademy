'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('forum_threads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'forum_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reply_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_reply_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_reply_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('forum_threads', ['category_id'], {
      name: 'forum_threads_category_id_idx'
    });

    await queryInterface.addIndex('forum_threads', ['user_id'], {
      name: 'forum_threads_user_id_idx'
    });

    await queryInterface.addIndex('forum_threads', ['slug'], {
      name: 'forum_threads_slug_idx'
    });

    await queryInterface.addIndex('forum_threads', ['is_pinned'], {
      name: 'forum_threads_is_pinned_idx'
    });

    await queryInterface.addIndex('forum_threads', ['is_active'], {
      name: 'forum_threads_is_active_idx'
    });

    await queryInterface.addIndex('forum_threads', ['created_at'], {
      name: 'forum_threads_created_at_idx'
    });

    await queryInterface.addIndex('forum_threads', ['last_reply_at'], {
      name: 'forum_threads_last_reply_at_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('forum_threads');
  }
};