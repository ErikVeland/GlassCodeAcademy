const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Database type helper that returns appropriate types based on dialect
 * Ensures compatibility between PostgreSQL (production) and SQLite (tests)
 */

/**
 * Returns JSONB for PostgreSQL, JSON for SQLite
 * @returns {DataTypes}
 */
function getJSONType() {
  const dialect = sequelize.getDialect();
  return dialect === 'postgres' ? DataTypes.JSONB : DataTypes.JSON;
}

/**
 * Returns ARRAY type for PostgreSQL, TEXT for SQLite (stores JSON stringified array)
 * @param {DataTypes} type - The array element type
 * @returns {DataTypes}
 */
function getArrayType(type) {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return DataTypes.ARRAY(type);
  }
  // For SQLite, store as JSON text
  return DataTypes.TEXT;
}

/**
 * Returns appropriate default value for array fields
 * PostgreSQL uses [] directly, SQLite needs JSON string
 * @returns {string|array}
 */
function getArrayDefault() {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return [];
  }
  // For SQLite, return JSON string of empty array
  return '[]';
}

/**
 * Getter/Setter for array fields in SQLite
 * In PostgreSQL, arrays are native, but in SQLite we need to serialize/deserialize
 */
const arrayGetterSetter = {
  get() {
    const dialect = sequelize.getDialect();
    const rawValue = this.getDataValue(arguments[0]);

    if (dialect === 'sqlite') {
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    }
    return rawValue || [];
  },
  set(value) {
    const dialect = sequelize.getDialect();
    if (dialect === 'sqlite') {
      this.setDataValue(arguments[0], JSON.stringify(value || []));
    } else {
      this.setDataValue(arguments[0], value);
    }
  },
};

module.exports = {
  getJSONType,
  getArrayType,
  getArrayDefault,
  arrayGetterSetter,
};
