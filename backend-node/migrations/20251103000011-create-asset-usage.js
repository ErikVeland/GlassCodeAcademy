'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asset_usage', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of content using this asset'
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of content entity using this asset'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('asset_usage', ['asset_id'], {
      name: 'asset_usage_asset_id_idx'
    });

    await queryInterface.addIndex('asset_usage', ['content_type', 'content_id'], {
      name: 'asset_usage_content_idx'
    });

    // Unique constraint: asset can only be linked once per content item
    await queryInterface.addIndex('asset_usage', ['asset_id', 'content_type', 'content_id'], {
      name: 'asset_usage_unique',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('asset_usage');
  }
};
