const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentWorkflow = sequelize.define(
  'ContentWorkflow',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'academy_id',
      references: {
        model: 'academies',
        key: 'id',
      },
    },
    contentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'content_type',
      comment: 'Content type this workflow applies to',
    },
    workflowName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'workflow_name',
    },
    workflowDefinition: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'workflow_definition',
      comment: 'State machine configuration and rules',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
  },
  {
    tableName: 'content_workflows',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
ContentWorkflow.associate = (models) => {
  ContentWorkflow.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });
};

module.exports = ContentWorkflow;
