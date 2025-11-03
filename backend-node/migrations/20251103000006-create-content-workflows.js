'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('content_workflows', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      academy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'academies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Content type this workflow applies to'
      },
      workflow_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      workflow_definition: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'State machine configuration and rules'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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
    await queryInterface.addIndex('content_workflows', ['academy_id'], {
      name: 'content_workflows_academy_id_idx'
    });

    await queryInterface.addIndex('content_workflows', ['content_type'], {
      name: 'content_workflows_content_type_idx'
    });

    await queryInterface.addIndex('content_workflows', ['is_active'], {
      name: 'content_workflows_is_active_idx'
    });

    // Unique constraint: one active workflow per content type per academy
    await queryInterface.addIndex('content_workflows', ['academy_id', 'content_type', 'is_active'], {
      name: 'content_workflows_academy_type_active_unique',
      unique: true,
      where: {
        is_active: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('content_workflows');
  }
};
