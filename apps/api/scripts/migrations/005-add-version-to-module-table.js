const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists before trying to add it
    try {
      const tableInfo = await queryInterface.describeTable('modules');
      if (!tableInfo.version) {
        await queryInterface.addColumn('modules', 'version', {
          type: DataTypes.STRING(20),
          defaultValue: '1.0.0'
        });
      } else {
        console.log('Column "version" already exists in "modules" table, skipping migration');
      }
    } catch (error) {
      // If we can't describe the table, try to add the column and let the database throw the error
      await queryInterface.addColumn('modules', 'version', {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0'
      });
    }
  },

  down: async (queryInterface) => {
    // Check if the column exists before trying to remove it
    try {
      const tableInfo = await queryInterface.describeTable('modules');
      if (tableInfo.version) {
        await queryInterface.removeColumn('modules', 'version');
      } else {
        console.log('Column "version" does not exist in "modules" table, skipping rollback');
      }
    } catch (error) {
      // If we can't describe the table, try to remove the column and let the database throw the error
      await queryInterface.removeColumn('modules', 'version');
    }
  }
};