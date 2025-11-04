'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    await queryInterface.createTable('content_imports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
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
      package_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'content_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      import_type: {
        type: Sequelize.ENUM('full', 'partial', 'merge'),
        allowNull: false
      },
      conflict_strategy: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'skip',
        comment: 'How to handle conflicts: skip, overwrite, merge, create_new'
      },
      status: {
        type: Sequelize.ENUM('pending', 'preview', 'executing', 'completed', 'failed', 'rolled_back'),
        defaultValue: 'pending',
        allowNull: false
      },
      items_total: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      items_processed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      items_failed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      change_summary: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Summary of changes made'
      },
      error_log: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Detailed error log'
      },
      imported_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('content_imports', ['academy_id'], {
      name: 'content_imports_academy_id_idx'
    });

    await queryInterface.addIndex('content_imports', ['package_id'], {
      name: 'content_imports_package_id_idx'
    });

    await queryInterface.addIndex('content_imports', ['status'], {
      name: 'content_imports_status_idx'
    });

    await queryInterface.addIndex('content_imports', ['imported_by'], {
      name: 'content_imports_imported_by_idx'
    });

    await queryInterface.addIndex('content_imports', ['created_at'], {
      name: 'content_imports_created_at_idx'
    });
  },

  async down({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('content_imports');
  }
};
