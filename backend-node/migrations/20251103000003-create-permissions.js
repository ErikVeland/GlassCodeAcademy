'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique permission identifier (e.g., content.create, user.manage)'
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Resource type this permission applies to'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Action type (create, read, update, delete, etc.)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description of permission'
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'System-level permission (cannot be deleted)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('permissions', ['name'], {
      name: 'permissions_name_idx',
      unique: true
    });

    await queryInterface.addIndex('permissions', ['resource_type'], {
      name: 'permissions_resource_type_idx'
    });

    await queryInterface.addIndex('permissions', ['action'], {
      name: 'permissions_action_idx'
    });

    await queryInterface.addIndex('permissions', ['is_system'], {
      name: 'permissions_is_system_idx'
    });
  },

  async down({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('permissions');
  }
};
