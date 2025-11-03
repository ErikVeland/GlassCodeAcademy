'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add academy_id column to lessons table
    await queryInterface.addColumn('lessons', 'academy_id', {
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
    await queryInterface.addColumn('lessons', 'department_id', {
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
    await queryInterface.addColumn('lessons', 'workflow_state', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'draft'
    });

    // Add current_version_id column
    await queryInterface.addColumn('lessons', 'current_version_id', {
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
    await queryInterface.addColumn('lessons', 'quality_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Quality score 0-100'
    });

    // Add last_validated_at column
    await queryInterface.addColumn('lessons', 'last_validated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('lessons', ['academy_id'], {
      name: 'lessons_academy_id_idx'
    });

    await queryInterface.addIndex('lessons', ['department_id'], {
      name: 'lessons_department_id_idx'
    });

    await queryInterface.addIndex('lessons', ['workflow_state'], {
      name: 'lessons_workflow_state_idx'
    });

    await queryInterface.addIndex('lessons', ['quality_score'], {
      name: 'lessons_quality_score_idx'
    });

    // Set academy_id from parent module
    await queryInterface.sequelize.query(`
      UPDATE lessons l
      SET academy_id = m.academy_id
      FROM modules m
      WHERE l.module_id = m.id AND l.academy_id IS NULL;
    `);

    // Now make academy_id NOT NULL
    await queryInterface.changeColumn('lessons', 'academy_id', {
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
    await queryInterface.removeIndex('lessons', 'lessons_academy_id_idx');
    await queryInterface.removeIndex('lessons', 'lessons_department_id_idx');
    await queryInterface.removeIndex('lessons', 'lessons_workflow_state_idx');
    await queryInterface.removeIndex('lessons', 'lessons_quality_score_idx');

    // Remove columns
    await queryInterface.removeColumn('lessons', 'last_validated_at');
    await queryInterface.removeColumn('lessons', 'quality_score');
    await queryInterface.removeColumn('lessons', 'current_version_id');
    await queryInterface.removeColumn('lessons', 'workflow_state');
    await queryInterface.removeColumn('lessons', 'department_id');
    await queryInterface.removeColumn('lessons', 'academy_id');
  }
};
