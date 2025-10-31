'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add moderation columns to forum_threads
    await queryInterface.addColumn('forum_threads', 'is_approved', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    await queryInterface.addColumn('forum_threads', 'approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('forum_threads', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('forum_threads', 'report_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add indexes
    await queryInterface.addIndex('forum_threads', ['is_approved'], {
      name: 'forum_threads_is_approved_idx'
    });

    await queryInterface.addIndex('forum_threads', ['report_count'], {
      name: 'forum_threads_report_count_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('forum_threads', 'forum_threads_is_approved_idx');
    await queryInterface.removeIndex('forum_threads', 'forum_threads_report_count_idx');

    // Remove columns
    await queryInterface.removeColumn('forum_threads', 'report_count');
    await queryInterface.removeColumn('forum_threads', 'approved_at');
    await queryInterface.removeColumn('forum_threads', 'approved_by');
    await queryInterface.removeColumn('forum_threads', 'is_approved');
  }
};