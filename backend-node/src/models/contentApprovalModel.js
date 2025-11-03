const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentApproval = sequelize.define(
  'ContentApproval',
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
      comment: 'Type of content requiring approval',
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'content_id',
      comment: 'ID of the content entity',
    },
    versionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'version_id',
      references: {
        model: 'content_versions',
        key: 'id',
      },
    },
    workflowState: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'workflow_state',
      comment: 'Current state in workflow',
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requested_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'User assigned to review/approve',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reviewer comments or feedback',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
  },
  {
    tableName: 'content_approvals',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
ContentApproval.associate = (models) => {
  ContentApproval.belongsTo(models.ContentVersion, {
    foreignKey: 'version_id',
    as: 'version',
  });

  ContentApproval.belongsTo(models.User, {
    foreignKey: 'requested_by',
    as: 'requester',
  });

  ContentApproval.belongsTo(models.User, {
    foreignKey: 'assigned_to',
    as: 'reviewer',
  });
};

module.exports = ContentApproval;
