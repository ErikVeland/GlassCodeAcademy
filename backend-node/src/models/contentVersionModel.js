const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const ContentVersion = sequelize.define(
  'ContentVersion',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    contentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'content_type',
      comment: 'Type of content: course, module, lesson, quiz',
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'content_id',
      comment: 'ID of the content entity',
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
    versionNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'version_number',
      comment: 'Semantic version number (e.g., 1.0.0, 1.1.0)',
    },
    contentSnapshot: {
      type: getJSONType(),
      allowNull: false,
      field: 'content_snapshot',
      comment: 'Complete content state at this version',
    },
    delta: {
      type: getJSONType(),
      allowNull: true,
      comment: 'Changes from previous version',
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    changeSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'change_summary',
      comment: 'Description of changes in this version',
    },
    metadata: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: {},
      comment: 'Additional version metadata',
    },
  },
  {
    tableName: 'content_versions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
ContentVersion.associate = (models) => {
  ContentVersion.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  ContentVersion.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'author',
  });

  ContentVersion.hasMany(models.ContentApproval, {
    foreignKey: 'version_id',
    as: 'approvals',
  });
};

module.exports = ContentVersion;
