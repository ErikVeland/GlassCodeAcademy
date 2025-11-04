'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up ({ queryInterface, Sequelize }) {
    await queryInterface.createTable('api_keys', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      hashed_key: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('api_keys', ['user_id'], {
      name: 'api_keys_user_id_idx'
    });

    await queryInterface.addIndex('api_keys', ['hashed_key'], {
      name: 'api_keys_hashed_key_idx'
    });
  },

  async down ({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('api_keys');
  }
};