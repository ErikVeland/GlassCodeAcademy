const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('quizzes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'lessons',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      topic: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: true,
      },
      choices: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      fixed_choice_order: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      choice_labels: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      accepted_answers: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      industry_context: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      question_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      estimated_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      correct_answer: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quiz_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('quizzes', ['lesson_id']);
    await queryInterface.addIndex('quizzes', ['question_type']);
    await queryInterface.addIndex('quizzes', ['quiz_type']);
    await queryInterface.addIndex('quizzes', ['is_published']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('quizzes');
  },
};
