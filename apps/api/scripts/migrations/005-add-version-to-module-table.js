const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('modules', 'version', {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('modules', 'version');
  }
};