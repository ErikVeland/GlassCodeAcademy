'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    await queryInterface.createTable('validation_rules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      academy_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'academies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Academy scope, null for global rules'
      },
      rule_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Content type this rule applies to'
      },
      rule_definition: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Rule specification and conditions'
      },
      severity: {
        type: Sequelize.ENUM('error', 'warning', 'info'),
        defaultValue: 'warning',
        allowNull: false
      },
      auto_fix_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether rule has auto-fix capability'
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
    await queryInterface.addIndex('validation_rules', ['academy_id'], {
      name: 'validation_rules_academy_id_idx'
    });

    await queryInterface.addIndex('validation_rules', ['content_type'], {
      name: 'validation_rules_content_type_idx'
    });

    await queryInterface.addIndex('validation_rules', ['severity'], {
      name: 'validation_rules_severity_idx'
    });

    await queryInterface.addIndex('validation_rules', ['is_active'], {
      name: 'validation_rules_is_active_idx'
    });

    // Unique constraint: rule name must be unique per academy (or globally)
    await queryInterface.addIndex('validation_rules', ['academy_id', 'rule_name'], {
      name: 'validation_rules_academy_name_unique',
      unique: true
    });
  },

  async down({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('validation_rules');
  }
};
