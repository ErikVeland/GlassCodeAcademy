const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      resource_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resource_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
  },
};
