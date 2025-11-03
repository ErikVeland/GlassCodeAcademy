const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ValidationResult = sequelize.define(
  'ValidationResult',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'content_type',
      comment: 'Type of content validated',
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'content_id',
      comment: 'ID of validated content',
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rule_id',
      references: {
        model: 'validation_rules',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('passed', 'failed', 'warning'),
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Detailed validation results and messages',
    },
    autoFixed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'auto_fixed',
      comment: 'Whether issue was automatically fixed',
    },
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'validated_at',
    },
  },
  {
    tableName: 'validation_results',
    timestamps: false,
  }
);

// Define associations
ValidationResult.associate = (models) => {
  ValidationResult.belongsTo(models.ValidationRule, {
    foreignKey: 'rule_id',
    as: 'rule',
  });
};

module.exports = ValidationResult;
