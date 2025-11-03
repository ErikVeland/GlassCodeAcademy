'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('validation_results', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of content validated'
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of validated content'
      },
      rule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'validation_rules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('passed', 'failed', 'warning'),
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Detailed validation results and messages'
      },
      auto_fixed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether issue was automatically fixed'
      },
      validated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('validation_results', ['content_type', 'content_id'], {
      name: 'validation_results_content_idx'
    });

    await queryInterface.addIndex('validation_results', ['rule_id'], {
      name: 'validation_results_rule_id_idx'
    });

    await queryInterface.addIndex('validation_results', ['status'], {
      name: 'validation_results_status_idx'
    });

    await queryInterface.addIndex('validation_results', ['validated_at'], {
      name: 'validation_results_validated_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('validation_results');
  }
};
