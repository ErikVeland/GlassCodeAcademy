'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('modules');
    } catch (err) {
      const code = (err.parent && err.parent.code) || err.code;
      if (code === '42P01') throw err;
    }

    // Add snake_case column and backfill from legacy camelCase
    if (!columns.is_published) {
      await queryInterface.addColumn('modules', 'is_published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });

      // If legacy camelCase exists, copy values
      if (columns.isPublished) {
        await queryInterface.sequelize.query(
          'UPDATE modules SET is_published = "isPublished" WHERE is_published IS FALSE;',
          { transaction: undefined }
        );
      }
    }

    // Optional index for published filter
    try {
      await queryInterface.addIndex('modules', ['is_published'], {
        name: 'modules_is_published_idx',
      });
    } catch (err) {
      // Ignore errors when adding index
    }
  },

  async down({ queryInterface, Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('modules');
    } catch (err) {
      // Ignore errors when describing table
    }
    if (columns.is_published) {
      await queryInterface.removeIndex('modules', 'modules_is_published_idx').catch(() => {});
      await queryInterface.removeColumn('modules', 'is_published');
    }
  },
};