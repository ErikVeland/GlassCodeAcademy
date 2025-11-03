'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('content_packages', {
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
      package_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      package_type: {
        type: Sequelize.ENUM('full', 'partial', 'template'),
        allowNull: false,
        comment: 'Type of export package'
      },
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1.0.0',
        comment: 'Package version'
      },
      manifest: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Package metadata and manifest'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Storage location of package file'
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Size in bytes'
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'SHA-256 checksum'
      },
      status: {
        type: Sequelize.ENUM('building', 'ready', 'expired'),
        defaultValue: 'building',
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
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Package expiration date'
      },
      download_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('content_packages', ['academy_id'], {
      name: 'content_packages_academy_id_idx'
    });

    await queryInterface.addIndex('content_packages', ['package_type'], {
      name: 'content_packages_type_idx'
    });

    await queryInterface.addIndex('content_packages', ['status'], {
      name: 'content_packages_status_idx'
    });

    await queryInterface.addIndex('content_packages', ['created_by'], {
      name: 'content_packages_created_by_idx'
    });

    await queryInterface.addIndex('content_packages', ['created_at'], {
      name: 'content_packages_created_at_idx'
    });

    await queryInterface.addIndex('content_packages', ['expires_at'], {
      name: 'content_packages_expires_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('content_packages');
  }
};
