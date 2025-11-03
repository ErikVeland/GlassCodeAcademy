'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('content_approvals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of content requiring approval'
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the content entity'
      },
      version_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_versions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workflow_state: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Current state in workflow'
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User assigned to review/approve'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reviewer comments or feedback'
      },
      approved_at: {
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
    await queryInterface.addIndex('content_approvals', ['content_type', 'content_id'], {
      name: 'content_approvals_content_idx'
    });

    await queryInterface.addIndex('content_approvals', ['version_id'], {
      name: 'content_approvals_version_id_idx'
    });

    await queryInterface.addIndex('content_approvals', ['requested_by'], {
      name: 'content_approvals_requested_by_idx'
    });

    await queryInterface.addIndex('content_approvals', ['assigned_to'], {
      name: 'content_approvals_assigned_to_idx'
    });

    await queryInterface.addIndex('content_approvals', ['status'], {
      name: 'content_approvals_status_idx'
    });

    await queryInterface.addIndex('content_approvals', ['workflow_state'], {
      name: 'content_approvals_workflow_state_idx'
    });

    await queryInterface.addIndex('content_approvals', ['created_at'], {
      name: 'content_approvals_created_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('content_approvals');
  }
};
