const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./userModel');
const Course = require('./courseModel');

const Certificate = sequelize.define(
  'Certificate',
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
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'course_id',
    },
    certificateId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'certificate_id',
      comment: 'Unique identifier for the certificate',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Title of the certificate',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the certificate',
    },
    issuedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'issued_at',
      comment: 'Date when the certificate was issued',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
      comment: 'Date when the certificate expires (if applicable)',
    },
    verificationUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'verification_url',
      comment: 'URL for certificate verification',
    },
    template: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Template used for the certificate',
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Grade achieved (e.g., A+, B, etc.)',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Numerical score achieved',
    },
    hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of hours spent on the course',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata about the certificate',
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_revoked',
      comment: 'Whether the certificate has been revoked',
    },
  },
  {
    tableName: 'certificates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['certificate_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['course_id'],
      },
      {
        fields: ['issued_at'],
      },
    ],
  }
);

// Define associations
Certificate.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Certificate.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
});

module.exports = Certificate;