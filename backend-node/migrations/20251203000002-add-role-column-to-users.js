'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    // Check if the role column already exists
    const tableInfo = await queryInterface.describeTable('users');
    if (!tableInfo.role) {
      // Add role column to users table
      await queryInterface.addColumn('users', 'role', {
        type: Sequelize.STRING(20),
        defaultValue: 'student',
        allowNull: true,
        validate: {
          isIn: [['admin', 'instructor', 'student', 'guest']],
        },
      });
      
      console.log('Added role column to users table');
    } else {
      console.log('Role column already exists in users table');
    }
    
    // Update existing admin user to have admin role
    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'"
    );
    
    console.log("Updated admin user's role to 'admin'");
  },

  async down({ queryInterface, Sequelize }) {
    // Remove role column from users table
    await queryInterface.removeColumn('users', 'role');
  }
};