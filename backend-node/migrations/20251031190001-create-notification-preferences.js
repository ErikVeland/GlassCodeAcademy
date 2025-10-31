'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notification_preferences', {
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
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      in_app_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      push_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sms_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      digest_frequency: {
        type: Sequelize.ENUM('immediately', 'hourly', 'daily', 'weekly', 'never'),
        defaultValue: 'immediately'
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

    // Add unique constraint for user_id and category combination
    await queryInterface.addConstraint('notification_preferences', {
      fields: ['user_id', 'category'],
      type: 'unique',
      name: 'user_category_unique'
    });

    // Add indexes
    await queryInterface.addIndex('notification_preferences', ['user_id'], {
      name: 'notification_preferences_user_id_idx'
    });

    await queryInterface.addIndex('notification_preferences', ['category'], {
      name: 'notification_preferences_category_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_preferences');
  }
};