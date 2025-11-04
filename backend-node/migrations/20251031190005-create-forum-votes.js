'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('forum_votes', {
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
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'forum_posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vote_type: {
        type: Sequelize.ENUM('up', 'down'),
        allowNull: false
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

    // Add unique constraint for user_id and post_id combination
    await queryInterface.addConstraint('forum_votes', {
      fields: ['user_id', 'post_id'],
      type: 'unique',
      name: 'forum_votes_user_post_unique'
    });

    // Add indexes
    await queryInterface.addIndex('forum_votes', ['post_id'], {
      name: 'forum_votes_post_id_idx'
    });

    await queryInterface.addIndex('forum_votes', ['user_id'], {
      name: 'forum_votes_user_id_idx'
    });

    await queryInterface.addIndex('forum_votes', ['vote_type'], {
      name: 'forum_votes_vote_type_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('forum_votes');
  }
};