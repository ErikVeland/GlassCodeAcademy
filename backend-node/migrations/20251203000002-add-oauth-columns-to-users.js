/* eslint-env node */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(ctxOrQI, maybeSequelize) {
    const queryInterface = ctxOrQI && ctxOrQI.queryInterface ? ctxOrQI.queryInterface : ctxOrQI;
    const Sequelize = ctxOrQI && ctxOrQI.Sequelize ? ctxOrQI.Sequelize : (maybeSequelize || require('sequelize'));

    const tableInfo = await queryInterface.describeTable('users');

    // Add OAuth provider column if missing
    if (!tableInfo.oauth_provider) {
      await queryInterface.addColumn('users', 'oauth_provider', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'OAuth provider key (e.g., google, github, apple)',
      });
    }

    // Add OAuth ID column if missing
    if (!tableInfo.oauth_id) {
      await queryInterface.addColumn('users', 'oauth_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Provider-specific user identifier',
      });
    }

    // Index creation is handled by dedicated migrations; no index here
  },

  async down(ctxOrQI) {
    const queryInterface = ctxOrQI && ctxOrQI.queryInterface ? ctxOrQI.queryInterface : ctxOrQI;

    // Try removing composite indexes if present (support both names)
    for (const indexName of ['users_oauth_provider_oauth_id_unique', 'users_oauth_provider_oauth_id_idx']) {
      try {
        await queryInterface.removeIndex('users', indexName);
      } catch (error) {
        const code = error.parent && error.parent.code;
        if (code === '42704' || code === '42P01') {
          // missing object/table – safe to ignore
        } else {
          throw error;
        }
      }
    }

    // Remove columns defensively
    for (const col of ['oauth_id', 'oauth_provider']) {
      try {
        await queryInterface.removeColumn('users', col);
      } catch (error) {
        const code = error.parent && error.parent.code;
        if (code === '42703' || code === '42P01') {
          // missing column/table – safe to ignore
        } else {
          throw error;
        }
      }
    }
  },
};
/* eslint-env node */