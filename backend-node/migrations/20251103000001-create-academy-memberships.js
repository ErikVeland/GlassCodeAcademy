'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('academy_memberships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'suspended', 'archived'),
        defaultValue: 'active',
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      custom_permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'User-specific permission overrides'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional membership data'
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
    await queryInterface.addIndex('academy_memberships', ['academy_id'], {
      name: 'academy_memberships_academy_id_idx'
    });

    await queryInterface.addIndex('academy_memberships', ['user_id'], {
      name: 'academy_memberships_user_id_idx'
    });

    await queryInterface.addIndex('academy_memberships', ['role_id'], {
      name: 'academy_memberships_role_id_idx'
    });

    await queryInterface.addIndex('academy_memberships', ['department_id'], {
      name: 'academy_memberships_department_id_idx'
    });

    await queryInterface.addIndex('academy_memberships', ['status'], {
      name: 'academy_memberships_status_idx'
    });

    // Unique constraint: one user can only have one membership per academy
    await queryInterface.addIndex('academy_memberships', ['academy_id', 'user_id'], {
      name: 'academy_memberships_academy_user_unique',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('academy_memberships');
  }
};
