const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('academies', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0'
      },
      theme: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('academies');
  }
};