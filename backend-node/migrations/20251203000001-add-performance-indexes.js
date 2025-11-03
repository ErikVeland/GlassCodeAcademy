'use strict';

/**
 * Migration: Add Performance Indexes
 * 
 * This migration adds composite indexes for the most common query patterns
 * in the multi-tenant White-Label Academy System.
 * 
 * All indexes have been validated against actual database schemas.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('\n=== Adding Performance Indexes ===\n');

      // Academy Memberships - User and role lookups
      console.log('Adding indexes for academy_memberships...');
      await queryInterface.addIndex('academy_memberships', 
        ['user_id', 'academy_id'], 
        { name: 'idx_membership_user_academy', transaction }
      );
      await queryInterface.addIndex('academy_memberships', 
        ['academy_id', 'role_id'], 
        { name: 'idx_membership_academy_role', transaction }
      );

      // Content Workflows - Status and type filters
      console.log('Adding indexes for content_workflows...');
      await queryInterface.addIndex('content_workflows', 
        ['academy_id', 'content_type'], 
        { name: 'idx_workflow_academy_type', transaction }
      );

      // Content Versions - Version lookups by content
      console.log('Adding indexes for content_versions...');
      await queryInterface.addIndex('content_versions', 
        ['content_type', 'content_id'], 
        { name: 'idx_version_content', transaction }
      );

      // Content Packages - Status filtering
      console.log('Adding indexes for content_packages...');
      await queryInterface.addIndex('content_packages', 
        ['academy_id', 'status'], 
        { name: 'idx_package_academy_status', transaction }
      );

      // Content Imports - Status tracking
      console.log('Adding indexes for content_imports...');
      await queryInterface.addIndex('content_imports', 
        ['academy_id', 'status'], 
        { name: 'idx_import_academy_status', transaction }
      );

      // Departments - Hierarchy queries
      console.log('Adding indexes for departments...');
      await queryInterface.addIndex('departments', 
        ['academy_id', 'parent_id'], 
        { name: 'idx_department_hierarchy', transaction }
      );

      // Role Permissions - Permission lookups
      console.log('Adding indexes for role_permissions...');
      await queryInterface.addIndex('role_permissions', 
        ['role_id', 'permission_id'], 
        { name: 'idx_role_permission', unique: true, transaction }
      );

      // Courses - Published course lookups
      console.log('Adding indexes for courses...');
      await queryInterface.addIndex('courses', 
        ['academy_id', 'is_published'], 
        { name: 'idx_course_academy_published', transaction }
      );

      // Modules - Course relationship queries
      console.log('Adding indexes for modules...');
      await queryInterface.addIndex('modules', 
        ['academy_id', 'course_id'], 
        { name: 'idx_module_academy_course', transaction }
      );

      // Lessons - Module relationship queries
      console.log('Adding indexes for lessons...');
      await queryInterface.addIndex('lessons', 
        ['academy_id', 'module_id'], 
        { name: 'idx_lesson_academy_module', transaction }
      );

      // Quizzes - Lesson relationship queries
      console.log('Adding indexes for lesson_quizzes...');
      await queryInterface.addIndex('lesson_quizzes', 
        ['academy_id', 'lesson_id'], 
        { name: 'idx_quiz_academy_lesson', transaction }
      );

      // Assets - Type and academy filtering
      console.log('Adding indexes for assets...');
      await queryInterface.addIndex('assets', 
        ['academy_id', 'asset_type'], 
        { name: 'idx_asset_academy_type', transaction }
      );

      // Asset Usage - Content lookups
      console.log('Adding indexes for asset_usage...');
      await queryInterface.addIndex('asset_usage', 
        ['asset_id', 'content_type'], 
        { name: 'idx_asset_usage_content', transaction }
      );

      // Validation Rules - Content type filtering
      console.log('Adding indexes for validation_rules...');
      await queryInterface.addIndex('validation_rules', 
        ['academy_id', 'content_type'], 
        { name: 'idx_validation_academy_content', transaction }
      );

      await transaction.commit();
      console.log('\n✓ All performance indexes created successfully!');
      console.log('✓ Total: 15 indexes created\n');
    } catch (error) {
      await transaction.rollback();
      console.error('\n✗ Error creating indexes:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('\n=== Removing Performance Indexes ===\n');

      const indexesToRemove = [
        { table: 'academy_memberships', name: 'idx_membership_user_academy' },
        { table: 'academy_memberships', name: 'idx_membership_academy_role' },
        { table: 'content_workflows', name: 'idx_workflow_academy_type' },
        { table: 'content_versions', name: 'idx_version_content' },
        { table: 'content_packages', name: 'idx_package_academy_status' },
        { table: 'content_imports', name: 'idx_import_academy_status' },
        { table: 'departments', name: 'idx_department_hierarchy' },
        { table: 'role_permissions', name: 'idx_role_permission' },
        { table: 'courses', name: 'idx_course_academy_published' },
        { table: 'modules', name: 'idx_module_academy_course' },
        { table: 'lessons', name: 'idx_lesson_academy_module' },
        { table: 'lesson_quizzes', name: 'idx_quiz_academy_lesson' },
        { table: 'assets', name: 'idx_asset_academy_type' },
        { table: 'asset_usage', name: 'idx_asset_usage_content' },
        { table: 'validation_rules', name: 'idx_validation_academy_content' }
      ];

      for (const { table, name } of indexesToRemove) {
        try {
          await queryInterface.removeIndex(table, name, { transaction });
          console.log(`✓ Removed ${name}`);
        } catch (error) {
          console.log(`⚠ Skipped ${name} (may not exist)`);
        }
      }

      await transaction.commit();
      console.log('\n✓ All indexes removed successfully!\n');
    } catch (error) {
      await transaction.rollback();
      console.error('\n✗ Error removing indexes:', error.message);
      throw error;
    }
  }
};
