'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    // Check if the oauth_provider column already exists
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.oauth_provider) {
      // Add oauth_provider column to users table
      await queryInterface.addColumn('users', 'oauth_provider', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
      
      console.log('Added oauth_provider column to users table');
    } else {
      console.log('oauth_provider column already exists in users table');
    }
    
    if (!tableInfo.oauth_id) {
      // Add oauth_id column to users table
      await queryInterface.addColumn('users', 'oauth_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      
      console.log('Added oauth_id column to users table');
    } else {
      console.log('oauth_id column already exists in users table');
    }
    
    // Add unique index for oauth_provider and oauth_id combination if it doesn't exist
    try {
      await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
        name: 'users_oauth_provider_oauth_id_idx',
        unique: true,
      });
      console.log('Added unique index for oauth_provider and oauth_id');
    } catch (err) {
      console.log('Unique index for oauth_provider and oauth_id already exists');
    }
  },

  async down({ queryInterface, Sequelize }) {
    // Remove unique index
    try {
      await queryInterface.removeIndex('users', 'users_oauth_provider_oauth_id_idx');
      console.log('Removed unique index for oauth_provider and oauth_id');
    } catch (err) {
      console.log('Unique index for oauth_provider and oauth_id does not exist');
    }
    
    // Remove oauth_id column from users table
    await queryInterface.removeColumn('users', 'oauth_id');
    
    // Remove oauth_provider column from users table
    await queryInterface.removeColumn('users', 'oauth_provider');
  }
};