const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Lesson = require('./lessonModel');

const LessonQuiz = sequelize.define('LessonQuiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  question: {
    type: DataTypes.STRING(2000),
    allowNull: false
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'Beginner'
  },
  choices: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  fixedChoiceOrder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'fixed_choice_order'
  },
  choiceLabels: {
    type: DataTypes.JSONB,
    field: 'choice_labels'
  },
  acceptedAnswers: {
    type: DataTypes.JSONB,
    field: 'accepted_answers'
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  industryContext: {
    type: DataTypes.TEXT,
    field: 'industry_context'
  },
  tags: {
    type: DataTypes.JSONB
  },
  questionType: {
    type: DataTypes.STRING,
    defaultValue: 'multiple-choice',
    field: 'question_type'
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    field: 'estimated_time'
  },
  correctAnswer: {
    type: DataTypes.INTEGER,
    field: 'correct_answer'
  },
  quizType: {
    type: DataTypes.STRING,
    defaultValue: 'multiple-choice',
    field: 'quiz_type'
  },
  sources: {
    type: DataTypes.JSONB
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    field: 'sort_order'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published'
  }
}, {
  tableName: 'lesson_quizzes',
  timestamps: true,
  underscored: true
});

// Define associations
LessonQuiz.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'lesson'
});

module.exports = LessonQuiz;