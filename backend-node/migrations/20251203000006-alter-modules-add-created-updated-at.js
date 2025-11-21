'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up({ queryInterface, Sequelize }) {
  let columns = {};
  try {
    columns = await queryInterface.describeTable('modules');
  } catch (err) {
    const code = (err.parent && err.parent.code) || err.code;
    if (code === '42P01') throw err;
  }

  if (!columns.created_at) {
    await queryInterface.addColumn('modules', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('NOW'),
    });
    if (columns.createdAt) {
      await queryInterface.sequelize.query(
        'UPDATE modules SET created_at = "createdAt" WHERE created_at IS NULL;'
      );
    }
    await queryInterface.changeColumn('modules', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  }

  if (!columns.updated_at) {
    await queryInterface.addColumn('modules', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('NOW'),
    });
    if (columns.updatedAt) {
      await queryInterface.sequelize.query(
        'UPDATE modules SET updated_at = "updatedAt" WHERE updated_at IS NULL;'
      );
    }
    await queryInterface.changeColumn('modules', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  }
}

export async function down({ queryInterface, Sequelize: _Sequelize }) {
  let columns = {};
  try {
    columns = await queryInterface.describeTable('modules');
  } catch (err) {
    // Ignore errors when describing table
  }
  if (columns.created_at) {
    await queryInterface.removeColumn('modules', 'created_at');
  }
  if (columns.updated_at) {
    await queryInterface.removeColumn('modules', 'updated_at');
  }
}
