'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add academy_id column to modules table
    await queryInterface.addColumn('modules', 'academy_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Temporarily nullable for migration
      references: {
        model: 'academies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add department_id column
    await queryInterface.addColumn('modules', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add workflow_state column
    await queryInterface.addColumn('modules', 'workflow_state', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'draft'
    });

    // Add current_version_id column
    await queryInterface.addColumn('modules', 'current_version_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'content_versions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add quality_score column
    await queryInterface.addColumn('modules', 'quality_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Quality score 0-100'
    });

    // Add last_validated_at column
    await queryInterface.addColumn('modules', 'last_validated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('modules', ['academy_id'], {
      name: 'modules_academy_id_idx'
    });

    await queryInterface.addIndex('modules', ['department_id'], {
      name: 'modules_department_id_idx'
    });

    await queryInterface.addIndex('modules', ['workflow_state'], {
      name: 'modules_workflow_state_idx'
    });

    await queryInterface.addIndex('modules', ['quality_score'], {
      name: 'modules_quality_score_idx'
    });

    // Set academy_id from parent course
    await queryInterface.sequelize.query(`
      UPDATE modules m
      SET academy_id = c.academy_id
      FROM courses c
      WHERE m.course_id = c.id AND m.academy_id IS NULL;
    `);

    // Now make academy_id NOT NULL
    await queryInterface.changeColumn('modules', 'academy_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'academies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('modules', 'modules_academy_id_idx');
    await queryInterface.removeIndex('modules', 'modules_department_id_idx');
    await queryInterface.removeIndex('modules', 'modules_workflow_state_idx');
    await queryInterface.removeIndex('modules', 'modules_quality_score_idx');

    // Remove columns
    await queryInterface.removeColumn('modules', 'last_validated_at');
    await queryInterface.removeColumn('modules', 'quality_score');
    await queryInterface.removeColumn('modules', 'current_version_id');
    await queryInterface.removeColumn('modules', 'workflow_state');
    await queryInterface.removeColumn('modules', 'department_id');
    await queryInterface.removeColumn('modules', 'academy_id');
  }
};
