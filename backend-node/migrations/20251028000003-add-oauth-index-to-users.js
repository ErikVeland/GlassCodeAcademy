/* eslint-env node */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface }) {
    // Add composite unique index for OAuth provider and ID, skip if exists
    try {
      await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
        name: 'users_oauth_provider_oauth_id_idx',
        unique: true,
      });
    } catch (error) {
      const code = error.parent && error.parent.code;
      if (code === '42P07' || code === '42710' || code === '23505') {
        // index/object already exists – safe to ignore
      } else {
        throw error;
      }
    }
  },

  async down({ queryInterface }) {
    // Remove the composite index defensively
    try {
      await queryInterface.removeIndex('users', 'users_oauth_provider_oauth_id_idx');
    } catch (error) {
      const code = error.parent && error.parent.code;
      if (code === '42704' || code === '42P01') {
        // missing object/table – safe to ignore
      } else {
        throw error;
      }
    }
  },
};