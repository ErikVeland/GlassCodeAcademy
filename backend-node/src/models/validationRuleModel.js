const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ValidationRule = sequelize.define(
  'ValidationRule',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academy_id',
      references: {
        model: 'academies',
        key: 'id',
      },
      comment: 'Academy scope, null for global rules',
    },
    ruleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'rule_name',
    },
    contentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'content_type',
      comment: 'Content type this rule applies to',
    },
    ruleDefinition: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'rule_definition',
      comment: 'Rule specification and conditions',
    },
    severity: {
      type: DataTypes.ENUM('error', 'warning', 'info'),
      defaultValue: 'warning',
      allowNull: false,
    },
    autoFixAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'auto_fix_available',
      comment: 'Whether rule has auto-fix capability',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
  },
  {
    tableName: 'validation_rules',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
ValidationRule.associate = (models) => {
  ValidationRule.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  ValidationRule.hasMany(models.ValidationResult, {
    foreignKey: 'rule_id',
    as: 'results',
  });
};

module.exports = ValidationRule;
