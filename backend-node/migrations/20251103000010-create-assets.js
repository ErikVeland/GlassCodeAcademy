'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assets', {
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
      asset_type: {
        type: Sequelize.ENUM('image', 'video', 'document', 'audio', 'archive'),
        allowNull: false
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original filename'
      },
      storage_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Path to file in storage'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Size in bytes'
      },
      dimensions: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Width x Height for images/videos'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in seconds for video/audio'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of times this asset is referenced'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
        comment: 'Search tags'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'EXIF data and custom metadata'
      },
      variants: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Processed variants (thumbnails, different sizes, etc.)'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether asset is publicly accessible'
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
    await queryInterface.addIndex('assets', ['academy_id'], {
      name: 'assets_academy_id_idx'
    });

    await queryInterface.addIndex('assets', ['asset_type'], {
      name: 'assets_asset_type_idx'
    });

    await queryInterface.addIndex('assets', ['uploaded_by'], {
      name: 'assets_uploaded_by_idx'
    });

    await queryInterface.addIndex('assets', ['is_public'], {
      name: 'assets_is_public_idx'
    });

    await queryInterface.addIndex('assets', ['created_at'], {
      name: 'assets_created_at_idx'
    });

    // GIN index for tags array for efficient searching
    await queryInterface.sequelize.query(
      'CREATE INDEX assets_tags_gin_idx ON assets USING GIN (tags);'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assets');
  }
};
