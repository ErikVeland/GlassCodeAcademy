const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define(
  'Quiz',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lesson_id',
      references: {
        model: 'lessons',
        key: 'id',
      },
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
    fixedChoiceOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'fixed_choice_order',
    },
    choiceLabels: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'choice_labels',
    },
    acceptedAnswers: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'accepted_answers',
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industryContext: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'industry_context',
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    questionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'question_type',
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_time',
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'correct_answer',
    },
    quizType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'quiz_type',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'quizzes',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Quiz;
