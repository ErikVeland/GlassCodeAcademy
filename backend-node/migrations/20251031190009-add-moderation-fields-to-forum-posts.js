'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add moderation columns to forum_posts
    await queryInterface.addColumn('forum_posts', 'is_approved', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    await queryInterface.addColumn('forum_posts', 'approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('forum_posts', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('forum_posts', 'report_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add indexes
    await queryInterface.addIndex('forum_posts', ['is_approved'], {
      name: 'forum_posts_is_approved_idx'
    });

    await queryInterface.addIndex('forum_posts', ['report_count'], {
      name: 'forum_posts_report_count_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('forum_posts', 'forum_posts_is_approved_idx');
    await queryInterface.removeIndex('forum_posts', 'forum_posts_report_count_idx');

    // Remove columns
    await queryInterface.removeColumn('forum_posts', 'report_count');
    await queryInterface.removeColumn('forum_posts', 'approved_at');
    await queryInterface.removeColumn('forum_posts', 'approved_by');
    await queryInterface.removeColumn('forum_posts', 'is_approved');
  }
};