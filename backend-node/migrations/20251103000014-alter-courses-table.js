'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add academy_id column to courses table
    await queryInterface.addColumn('courses', 'academy_id', {
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
    await queryInterface.addColumn('courses', 'department_id', {
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
    await queryInterface.addColumn('courses', 'workflow_state', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'draft'
    });

    // Add current_version_id column
    await queryInterface.addColumn('courses', 'current_version_id', {
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
    await queryInterface.addColumn('courses', 'quality_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Quality score 0-100'
    });

    // Add last_validated_at column
    await queryInterface.addColumn('courses', 'last_validated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('courses', ['academy_id'], {
      name: 'courses_academy_id_idx'
    });

    await queryInterface.addIndex('courses', ['department_id'], {
      name: 'courses_department_id_idx'
    });

    await queryInterface.addIndex('courses', ['workflow_state'], {
      name: 'courses_workflow_state_idx'
    });

    await queryInterface.addIndex('courses', ['quality_score'], {
      name: 'courses_quality_score_idx'
    });

    // Set default academy_id for existing courses (assuming academy with id=1 exists)
    // In production, this would need to be customized based on actual data
    await queryInterface.sequelize.query(
      'UPDATE courses SET academy_id = 1 WHERE academy_id IS NULL;'
    );

    // Now make academy_id NOT NULL
    await queryInterface.changeColumn('courses', 'academy_id', {
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
    await queryInterface.removeIndex('courses', 'courses_academy_id_idx');
    await queryInterface.removeIndex('courses', 'courses_department_id_idx');
    await queryInterface.removeIndex('courses', 'courses_workflow_state_idx');
    await queryInterface.removeIndex('courses', 'courses_quality_score_idx');

    // Remove columns
    await queryInterface.removeColumn('courses', 'last_validated_at');
    await queryInterface.removeColumn('courses', 'quality_score');
    await queryInterface.removeColumn('courses', 'current_version_id');
    await queryInterface.removeColumn('courses', 'workflow_state');
    await queryInterface.removeColumn('courses', 'department_id');
    await queryInterface.removeColumn('courses', 'academy_id');
  }
};
