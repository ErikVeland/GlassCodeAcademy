'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_type: {
        type: Sequelize.ENUM('thread', 'post', 'user', 'comment'),
        allowNull: false
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reason: {
        type: Sequelize.ENUM(
          'spam',
          'harassment',
          'inappropriate_content',
          'plagiarism',
          'offensive_language',
          'other'
        ),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        defaultValue: 'pending'
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolution_notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('reports', ['reporter_id'], {
      name: 'reports_reporter_id_idx'
    });

    await queryInterface.addIndex('reports', ['target_type', 'target_id'], {
      name: 'reports_target_idx'
    });

    await queryInterface.addIndex('reports', ['reason'], {
      name: 'reports_reason_idx'
    });

    await queryInterface.addIndex('reports', ['status'], {
      name: 'reports_status_idx'
    });

    await queryInterface.addIndex('reports', ['created_at'], {
      name: 'reports_created_at_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');
  }
};