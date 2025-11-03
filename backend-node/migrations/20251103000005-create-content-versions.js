'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('content_versions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of content: course, module, lesson, quiz'
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the content entity'
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
      version_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Semantic version number (e.g., 1.0.0, 1.1.0)'
      },
      content_snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Complete content state at this version'
      },
      delta: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Changes from previous version'
      },
      status: {
        type: Sequelize.ENUM('draft', 'review', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull: false
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      change_summary: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of changes in this version'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional version metadata'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('content_versions', ['content_type', 'content_id'], {
      name: 'content_versions_content_idx'
    });

    await queryInterface.addIndex('content_versions', ['academy_id'], {
      name: 'content_versions_academy_id_idx'
    });

    await queryInterface.addIndex('content_versions', ['status'], {
      name: 'content_versions_status_idx'
    });

    await queryInterface.addIndex('content_versions', ['created_by'], {
      name: 'content_versions_created_by_idx'
    });

    await queryInterface.addIndex('content_versions', ['created_at'], {
      name: 'content_versions_created_at_idx'
    });

    // Unique constraint: version number must be unique per content
    await queryInterface.addIndex('content_versions', ['content_type', 'content_id', 'version_number'], {
      name: 'content_versions_unique_version',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('content_versions');
  }
};
