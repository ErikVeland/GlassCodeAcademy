const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetUsage = sequelize.define(
  'AssetUsage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'asset_id',
      references: {
        model: 'assets',
        key: 'id',
      },
    },
    contentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'content_type',
      comment: 'Type of content using this asset',
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'content_id',
      comment: 'ID of content entity using this asset',
    },
  },
  {
    tableName: 'asset_usage',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
AssetUsage.associate = (models) => {
  AssetUsage.belongsTo(models.Asset, {
    foreignKey: 'asset_id',
    as: 'asset',
  });
};

module.exports = AssetUsage;
