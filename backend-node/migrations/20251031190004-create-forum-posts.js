'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('forum_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'forum_threads',
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
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'forum_posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_accepted_answer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      vote_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('forum_posts', ['thread_id'], {
      name: 'forum_posts_thread_id_idx'
    });

    await queryInterface.addIndex('forum_posts', ['user_id'], {
      name: 'forum_posts_user_id_idx'
    });

    await queryInterface.addIndex('forum_posts', ['parent_id'], {
      name: 'forum_posts_parent_id_idx'
    });

    await queryInterface.addIndex('forum_posts', ['is_accepted_answer'], {
      name: 'forum_posts_is_accepted_answer_idx'
    });

    await queryInterface.addIndex('forum_posts', ['is_active'], {
      name: 'forum_posts_is_active_idx'
    });

    await queryInterface.addIndex('forum_posts', ['created_at'], {
      name: 'forum_posts_created_at_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('forum_posts');
  }
};