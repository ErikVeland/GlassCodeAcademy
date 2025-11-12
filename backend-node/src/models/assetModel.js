const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const {
  getJSONType,
  getArrayType,
  getArrayDefault,
  arrayGetterSetter,
} = require('../utils/databaseTypes');

const Asset = sequelize.define(
  'Asset',
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
    assetType: {
      type: DataTypes.ENUM('image', 'video', 'document', 'audio', 'archive'),
      allowNull: false,
      field: 'asset_type',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
      comment: 'Original filename',
    },
    storagePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'storage_path',
      comment: 'Path to file in storage',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size',
      comment: 'Size in bytes',
    },
    dimensions: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Width x Height for images/videos',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds for video/audio',
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'usage_count',
      comment: 'Number of times this asset is referenced',
    },
    tags: {
      type: getArrayType(DataTypes.TEXT),
      allowNull: true,
      defaultValue: getArrayDefault(),
      comment: 'Search tags',
      get: arrayGetterSetter.get,
      set: arrayGetterSetter.set,
    },
    metadata: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      comment: 'EXIF data and custom metadata',
    },
    variants: {
      type: getJSONType(),
      allowNull: true,
      defaultValue: null,
      comment: 'Processed variants (thumbnails, different sizes, etc.)',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_public',
      comment: 'Whether asset is publicly accessible',
    },
  },
  {
    tableName: 'assets',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
Asset.associate = (models) => {
  Asset.belongsTo(models.Academy, {
    foreignKey: 'academy_id',
    as: 'academy',
  });

  Asset.belongsTo(models.User, {
    foreignKey: 'uploaded_by',
    as: 'uploader',
  });

  Asset.hasMany(models.AssetUsage, {
    foreignKey: 'asset_id',
    as: 'usages',
  });
};

module.exports = Asset;
