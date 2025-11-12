const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

function getDialect() {
  try {
    return sequelize.getDialect();
  } catch {
    return 'sqlite';
  }
}

/**
 * Returns a JSON-capable column type compatible with the current dialect.
 * - For SQLite, use TEXT to avoid unsupported JSON type errors.
 * - For PostgreSQL/MySQL, use native JSON.
 */
function getJSONType() {
  const dialect = getDialect();
  return dialect === 'sqlite' ? DataTypes.TEXT : DataTypes.JSON;
}

/**
 * Returns an ARRAY type for dialects that support it; for SQLite, fallback to TEXT.
 */
function getArrayType(baseType = DataTypes.TEXT) {
  const dialect = getDialect();
  return dialect === 'sqlite' ? DataTypes.TEXT : DataTypes.ARRAY(baseType);
}

/** Default value for array-like columns across dialects */
function getArrayDefault() {
  const dialect = getDialect();
  return dialect === 'sqlite' ? '[]' : [];
}

/**
 * Getter/setter helpers for the `tags` attribute in models using array columns.
 * This utility specifically supports the `Asset.tags` field.
 */
const arrayGetterSetter = {
  get() {
    const dialect = getDialect();
    const raw = this.getDataValue('tags');
    if (raw == null) return [];
    if (dialect === 'sqlite') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [raw];
  },
  set(value) {
    const dialect = getDialect();
    const arr = Array.isArray(value) ? value : value == null ? [] : [value];
    if (dialect === 'sqlite') {
      this.setDataValue('tags', JSON.stringify(arr));
    } else {
      this.setDataValue('tags', arr);
    }
  },
};

module.exports = { getDialect, getJSONType, getArrayType, getArrayDefault, arrayGetterSetter };