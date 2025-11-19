'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('courses');
    } catch (err) {
      const code = (err.parent && err.parent.code) || err.code;
      if (code === '42P01') throw err;
    }

    if (!columns.estimated_hours) {
      await queryInterface.addColumn('courses', 'estimated_hours', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      if (columns.estimatedHours) {
        await queryInterface.sequelize.query(
          'UPDATE courses SET estimated_hours = "estimatedHours" WHERE estimated_hours IS NULL;'
        );
      }
      await queryInterface.changeColumn('courses', 'estimated_hours', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!columns.created_at) {
      await queryInterface.addColumn('courses', 'created_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
      });
      if (columns.createdAt) {
        await queryInterface.sequelize.query(
          'UPDATE courses SET created_at = "createdAt" WHERE created_at IS NULL;'
        );
      }
      await queryInterface.changeColumn('courses', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
      });
    }

    if (!columns.updated_at) {
      await queryInterface.addColumn('courses', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
      });
      if (columns.updatedAt) {
        await queryInterface.sequelize.query(
          'UPDATE courses SET updated_at = "updatedAt" WHERE updated_at IS NULL;'
        );
      }
      await queryInterface.changeColumn('courses', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
      });
    }
  },

  async down({ queryInterface, Sequelize: _Sequelize }) {
    let columns = {};
    try {
      columns = await queryInterface.describeTable('courses');
    } catch (err) {
      // Ignore errors when describing table
    }
    if (columns.estimated_hours) {
      await queryInterface.removeColumn('courses', 'estimated_hours');
    }
    if (columns.created_at) {
      await queryInterface.removeColumn('courses', 'created_at');
    }
    if (columns.updated_at) {
      await queryInterface.removeColumn('courses', 'updated_at');
    }
  },
};
