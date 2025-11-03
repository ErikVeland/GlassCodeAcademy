const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentPackage = sequelize.define(
  'ContentPackage',
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
    packageName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'package_name',
    },
    packageType: {
      type: DataTypes.ENUM('full', 'partial', 'template'),
      allowNull: false,
      field: 'package_type',
      comment: 'Type of export package',
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0.0',
      comment: 'Package version',
    },
    manifest: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Package metadata and manifest',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_path',
      comment: 'Storage location of package file',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size',
      comment: 'Size in bytes',
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'SHA-256 checksum',
    },
    status: {
      type: DataTypes.ENUM('building', 'ready', 'expired'),
      defaultValue: 'building',
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
      comment: 'Package expiration date',
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'download_count',
    },
  },
  {
    tableName: 'content_packages',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
ContentPackage.associate = (models) => {
  ContentPackage.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  ContentPackage.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
  });

  ContentPackage.hasMany(models.ContentImport, {
    foreignKey: 'package_id',
    as: 'imports',
  });
};

module.exports = ContentPackage;
