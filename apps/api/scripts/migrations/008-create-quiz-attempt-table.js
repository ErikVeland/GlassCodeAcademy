const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('quiz_attempts', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      total_questions: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      correct_answers: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      answers: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      time_spent_seconds: {
        type: DataTypes.INTEGER,
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
    
    // Add indexes for better query performance
    await queryInterface.addIndex('quiz_attempts', ['user_id']);
    await queryInterface.addIndex('quiz_attempts', ['lesson_id']);
    await queryInterface.addIndex('quiz_attempts', ['quiz_id']);
    await queryInterface.addIndex('quiz_attempts', ['completed_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('quiz_attempts');
  }
};