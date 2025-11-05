/* eslint-env node */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(ctxOrQI, maybeSequelize) {
    const queryInterface = ctxOrQI && ctxOrQI.queryInterface ? ctxOrQI.queryInterface : ctxOrQI;
    const Sequelize = ctxOrQI && ctxOrQI.Sequelize ? ctxOrQI.Sequelize : (maybeSequelize || require('sequelize'));
    // Add OAuth provider column
    await queryInterface.addColumn('users', 'oauth_provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'OAuth provider key (e.g., google, github, apple)',
    });

    // Add OAuth ID column
    await queryInterface.addColumn('users', 'oauth_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Provider-specific user identifier',
    });

    // Add composite unique index to prevent duplicate provider/id pairs
    await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
      name: 'users_oauth_provider_oauth_id_unique',
      unique: true,
    });
  },

  async down(ctxOrQI) {
    const queryInterface = ctxOrQI && ctxOrQI.queryInterface ? ctxOrQI.queryInterface : ctxOrQI;
    // Remove composite index
    await queryInterface.removeIndex(
      'users',
      'users_oauth_provider_oauth_id_unique'
    );

    // Remove columns
    await queryInterface.removeColumn('users', 'oauth_id');
    await queryInterface.removeColumn('users', 'oauth_provider');
  },
};
/* eslint-env node */