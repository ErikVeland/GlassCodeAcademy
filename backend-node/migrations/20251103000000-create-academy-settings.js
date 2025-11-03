'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('academy_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      academy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'academies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenant_mode: {
        type: Sequelize.ENUM('shared', 'schema', 'database'),
        defaultValue: 'shared',
        allowNull: false
      },
      max_users: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of users allowed, null for unlimited'
      },
      max_storage_gb: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum storage in GB, null for unlimited'
      },
      features_enabled: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Feature flags and enabled features'
      },
      branding: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Custom branding configuration (logo, colors, etc.)'
      },
      integrations: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'External service integration configs'
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
    await queryInterface.addIndex('academy_settings', ['academy_id'], {
      name: 'academy_settings_academy_id_idx',
      unique: true
    });

    await queryInterface.addIndex('academy_settings', ['tenant_mode'], {
      name: 'academy_settings_tenant_mode_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('academy_settings');
  }
};
