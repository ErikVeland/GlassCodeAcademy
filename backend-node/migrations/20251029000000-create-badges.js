'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    await queryInterface.createTable('badges', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      criteria: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'JSON object defining the criteria for earning this badge'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Category of the badge (e.g., completion, excellence, participation)'
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Points awarded for earning this badge'
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
    await queryInterface.addIndex('badges', ['name'], {
      name: 'badges_name_idx'
    });

    await queryInterface.addIndex('badges', ['category'], {
      name: 'badges_category_idx'
    });

    await queryInterface.addIndex('badges', ['is_active'], {
      name: 'badges_is_active_idx'
    });
  },

  async down({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('badges');
  }
};