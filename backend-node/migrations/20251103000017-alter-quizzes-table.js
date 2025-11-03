'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: Assuming quizzes table name is 'quizzes' or 'lesson_quizzes'
    // Adjust table name if different
    const tableName = 'quizzes';

    // Add academy_id column to quizzes table
    await queryInterface.addColumn(tableName, 'academy_id', {
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
    await queryInterface.addColumn(tableName, 'department_id', {
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
    await queryInterface.addColumn(tableName, 'workflow_state', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'draft'
    });

    // Add current_version_id column
    await queryInterface.addColumn(tableName, 'current_version_id', {
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
    await queryInterface.addColumn(tableName, 'quality_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Quality score 0-100'
    });

    // Add last_validated_at column
    await queryInterface.addColumn(tableName, 'last_validated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex(tableName, ['academy_id'], {
      name: 'quizzes_academy_id_idx'
    });

    await queryInterface.addIndex(tableName, ['department_id'], {
      name: 'quizzes_department_id_idx'
    });

    await queryInterface.addIndex(tableName, ['workflow_state'], {
      name: 'quizzes_workflow_state_idx'
    });

    await queryInterface.addIndex(tableName, ['quality_score'], {
      name: 'quizzes_quality_score_idx'
    });

    // Set academy_id from parent lesson
    await queryInterface.sequelize.query(`
      UPDATE ${tableName} q
      SET academy_id = l.academy_id
      FROM lessons l
      WHERE q.lesson_id = l.id AND q.academy_id IS NULL;
    `);

    // Now make academy_id NOT NULL
    await queryInterface.changeColumn(tableName, 'academy_id', {
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
    const tableName = 'quizzes';

    // Remove indexes
    await queryInterface.removeIndex(tableName, 'quizzes_academy_id_idx');
    await queryInterface.removeIndex(tableName, 'quizzes_department_id_idx');
    await queryInterface.removeIndex(tableName, 'quizzes_workflow_state_idx');
    await queryInterface.removeIndex(tableName, 'quizzes_quality_score_idx');

    // Remove columns
    await queryInterface.removeColumn(tableName, 'last_validated_at');
    await queryInterface.removeColumn(tableName, 'quality_score');
    await queryInterface.removeColumn(tableName, 'current_version_id');
    await queryInterface.removeColumn(tableName, 'workflow_state');
    await queryInterface.removeColumn(tableName, 'department_id');
    await queryInterface.removeColumn(tableName, 'academy_id');
  }
};
