'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    // Add profile_data column
    await queryInterface.addColumn('users', 'profile_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Extended profile information'
    });

    // Add preferences column
    await queryInterface.addColumn('users', 'preferences', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Per-academy user preferences'
    });

    // Add status column
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'pending', 'suspended', 'archived', 'deleted'),
      defaultValue: 'active',
      allowNull: false
    });

    // Add last_activity_at column
    await queryInterface.addColumn('users', 'last_activity_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last user activity'
    });

    // Add metadata column
    await queryInterface.addColumn('users', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Extensible custom fields'
    });

    // Add indexes
    await queryInterface.addIndex('users', ['status'], {
      name: 'users_status_idx'
    });

    await queryInterface.addIndex('users', ['last_activity_at'], {
      name: 'users_last_activity_at_idx'
    });
  },

  async down({ queryInterface, Sequelize }) {
    // Remove indexes
    await queryInterface.removeIndex('users', 'users_status_idx');
    await queryInterface.removeIndex('users', 'users_last_activity_at_idx');

    // Remove columns
    await queryInterface.removeColumn('users', 'metadata');
    await queryInterface.removeColumn('users', 'last_activity_at');
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'preferences');
    await queryInterface.removeColumn('users', 'profile_data');
  }
};
