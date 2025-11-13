'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('academies');
    } catch (err) {
      const code = (err.parent && err.parent.code) || err.code;
      if (code === '42P01') throw err; // table missing
    }

    if (!columns.theme) {
      await queryInterface.addColumn('academies', 'theme', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    if (!columns.metadata) {
      await queryInterface.addColumn('academies', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }
  },

  async down({ queryInterface, Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('academies');
    } catch (err) {
      // Ignore errors when describing table
    }

    if (columns.theme) {
      await queryInterface.removeColumn('academies', 'theme');
    }
    if (columns.metadata) {
      await queryInterface.removeColumn('academies', 'metadata');
    }
  },
};