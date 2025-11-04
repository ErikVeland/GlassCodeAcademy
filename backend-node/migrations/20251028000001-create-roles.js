'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index
    await queryInterface.addIndex('roles', ['name'], {
      unique: true,
      name: 'roles_name_unique',
    });

    // Insert default roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'Administrator with full access',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'instructor',
        description: 'Instructor with course management access',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'student',
        description: 'Student user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'guest',
        description: 'Guest user with limited access',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  },
};