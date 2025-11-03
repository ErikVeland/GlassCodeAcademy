const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { getJSONType } = require('../utils/databaseTypes');

const ContentImport = sequelize.define(
  'ContentImport',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
    packageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'package_id',
      references: {
        model: 'content_packages',
        key: 'id',
      },
    },
    importType: {
      type: DataTypes.ENUM('full', 'partial', 'merge'),
      allowNull: false,
      field: 'import_type',
    },
    conflictStrategy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'skip',
      field: 'conflict_strategy',
      comment: 'How to handle conflicts: skip, overwrite, merge, create_new',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'preview',
        'executing',
        'completed',
        'failed',
        'rolled_back'
      ),
      defaultValue: 'pending',
      allowNull: false,
    },
    itemsTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'items_total',
    },
    itemsProcessed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'items_processed',
    },
    itemsFailed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'items_failed',
    },
    changeSummary: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: {},
      field: 'change_summary',
      comment: 'Summary of changes made',
    },
    errorLog: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: [],
      field: 'error_log',
      comment: 'Detailed error log',
    },
    importedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'imported_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    tableName: 'content_imports',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
ContentImport.associate = (models) => {
  ContentImport.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  ContentImport.belongsTo(models.ContentPackage, {
    foreignKey: 'package_id',
    as: 'package',
  });

  ContentImport.belongsTo(models.User, {
    foreignKey: 'imported_by',
    as: 'importer',
  });
};

module.exports = ContentImport;
