const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');
const Lesson = require('./lessonModel');

const LessonQuiz = sequelize.define(
  'LessonQuiz',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      validate: {
        isInt: true,
        min: 1,
      },
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
      references: {
        model: 'academies',
        key: 'id',
      },
    },
    question: {
      type: DataTypes.STRING(2000),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: 'Beginner',
    },
    choices: {
      type: getJSONType(),
      allowNull: true,
    },
    fixedChoiceOrder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'fixed_choice_order',
    },
    choiceLabels: {
      type: getJSONType(),
      field: 'choice_labels',
    },
    acceptedAnswers: {
      type: getJSONType(),
      field: 'accepted_answers',
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industryContext: {
      type: DataTypes.TEXT,
      field: 'industry_context',
    },
    tags: {
      type: getJSONType(),
    },
    questionType: {
      type: DataTypes.STRING,
      defaultValue: 'multiple-choice',
      field: 'question_type',
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      field: 'estimated_time',
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      field: 'correct_answer',
    },
    quizType: {
      type: DataTypes.STRING,
      defaultValue: 'multiple-choice',
      field: 'quiz_type',
    },
    sources: {
      type: getJSONType(),
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      field: 'sort_order',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
  },
  {
    tableName: 'lesson_quizzes',
    timestamps: true,
    underscored: true,
    // Add hooks to validate data before saving
    hooks: {
      beforeCreate: (quiz) => {
        // Ensure ID is positive if manually set
        if (quiz.id && quiz.id <= 0) {
          throw new Error('Quiz ID must be a positive integer');
        }
      },
      beforeUpdate: (quiz) => {
        // Ensure ID is positive if manually set
        if (quiz.id && quiz.id <= 0) {
          throw new Error('Quiz ID must be a positive integer');
        }
      },
    },
  }
);

// Define associations
LessonQuiz.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson',
});

module.exports = LessonQuiz;
