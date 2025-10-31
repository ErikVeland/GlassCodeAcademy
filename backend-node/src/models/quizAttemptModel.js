const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Lesson = require('./lessonModel');
const LessonQuiz = require('./quizModel');

const QuizAttempt = sequelize.define(
  'QuizAttempt',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lesson_id',
    },
    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'quiz_id',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_questions',
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'correct_answers',
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
    },
    timeSpentSeconds: {
      type: DataTypes.INTEGER,
      field: 'time_spent_seconds',
    },
    ipAddress: {
      type: DataTypes.STRING,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent',
    },
    deviceType: {
      type: DataTypes.STRING,
      field: 'device_type',
    },
    hintsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'hints_used',
    },
    timedOut: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'timed_out',
    },
  },
  {
    tableName: 'quiz_attempts',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
QuizAttempt.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'attemptUser',
});

QuizAttempt.belongsTo(Lesson, {
  foreignKey: 'lesson_id',
  as: 'attemptLesson',
});

QuizAttempt.belongsTo(LessonQuiz, {
  foreignKey: 'quiz_id',
  as: 'attemptQuiz',
});

module.exports = QuizAttempt;
