const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
});

async function validateTableSchema(tableName) {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);
    
    return results;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return null;
  }
}

async function checkIndexExists(indexName) {
  try {
    const [results] = await sequelize.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = '${indexName}';
    `);
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('\n=== Database Schema Validation ===\n');
  
  const tablesToCheck = [
    'academy_memberships',
    'academy_settings',
    'content_workflows',
    'content_approvals',
    'content_versions',
    'content_packages',
    'content_imports',
    'departments',
    'role_permissions',
    'courses',
    'modules',
    'lessons',
    'lesson_quizzes',
    'user_progress',
    'user_enrollments',
    'assets',
    'asset_usage',
    'validation_rules',
    'validation_results'
  ];

  const schemaMap = {};
  
  for (const table of tablesToCheck) {
    const columns = await validateTableSchema(table);
    if (columns) {
      schemaMap[table] = columns.map(col => col.column_name);
      console.log(`\n✓ ${table}:`);
      console.log(`  Columns: ${columns.map(col => col.column_name).join(', ')}`);
    } else {
      console.log(`\n✗ ${table}: TABLE NOT FOUND`);
    }
  }

  console.log('\n\n=== Index Validation for Performance Migration ===\n');
  
  const indexesToCreate = [
    { table: 'academy_memberships', columns: ['user_id', 'academy_id'], name: 'idx_membership_user_academy' },
    { table: 'academy_memberships', columns: ['academy_id', 'role_id'], name: 'idx_membership_academy_role' },
    { table: 'academy_settings', columns: ['academy_id', 'category'], name: 'idx_settings_academy_category' },
    { table: 'content_workflows', columns: ['academy_id', 'content_type'], name: 'idx_workflow_academy_status' },
    { table: 'content_approvals', columns: ['academy_id', 'status'], name: 'idx_approval_academy_status' },
    { table: 'content_versions', columns: ['content_type', 'content_id'], name: 'idx_version_content' },
    { table: 'content_packages', columns: ['academy_id', 'status'], name: 'idx_package_academy_status' },
    { table: 'content_imports', columns: ['academy_id', 'status'], name: 'idx_import_academy_status' },
    { table: 'departments', columns: ['academy_id', 'parent_id'], name: 'idx_department_hierarchy' },
    { table: 'role_permissions', columns: ['role_id', 'permission_id'], name: 'idx_role_permission' },
    { table: 'courses', columns: ['academy_id', 'is_published'], name: 'idx_course_academy_published' },
    { table: 'modules', columns: ['academy_id', 'course_id'], name: 'idx_module_academy_course' },
    { table: 'lessons', columns: ['academy_id', 'module_id'], name: 'idx_lesson_academy_module' },
    { table: 'lesson_quizzes', columns: ['academy_id', 'lesson_id'], name: 'idx_quiz_academy_lesson' },
    { table: 'user_progress', columns: ['user_id', 'lesson_id'], name: 'idx_progress_user_lesson' },
    { table: 'user_enrollments', columns: ['user_id', 'course_id'], name: 'idx_enrollment_user_course' },
    { table: 'assets', columns: ['academy_id', 'asset_type'], name: 'idx_asset_academy_type' },
    { table: 'asset_usage', columns: ['asset_id', 'content_type'], name: 'idx_asset_usage_content' },
    { table: 'validation_rules', columns: ['academy_id', 'content_type'], name: 'idx_validation_academy_content' },
    { table: 'validation_results', columns: ['validation_rule_id', 'status'], name: 'idx_validation_result_status' }
  ];

  const validIndexes = [];
  const invalidIndexes = [];

  for (const index of indexesToCreate) {
    const tableColumns = schemaMap[index.table];
    
    if (!tableColumns) {
      invalidIndexes.push({ ...index, reason: 'Table does not exist' });
      continue;
    }

    const missingColumns = index.columns.filter(col => !tableColumns.includes(col));
    
    if (missingColumns.length > 0) {
      invalidIndexes.push({ 
        ...index, 
        reason: `Missing columns: ${missingColumns.join(', ')}`,
        availableColumns: tableColumns.join(', ')
      });
    } else {
      const exists = await checkIndexExists(index.name);
      validIndexes.push({ ...index, exists });
    }
  }

  console.log('\n✓ Valid Indexes to Create:');
  validIndexes.forEach(idx => {
    const status = idx.exists ? '[EXISTS]' : '[NEW]';
    console.log(`  ${status} ${idx.name} on ${idx.table}(${idx.columns.join(', ')})`);
  });

  if (invalidIndexes.length > 0) {
    console.log('\n✗ Invalid Indexes (will be skipped):');
    invalidIndexes.forEach(idx => {
      console.log(`  ${idx.name} on ${idx.table}(${idx.columns.join(', ')})`);
      console.log(`    Reason: ${idx.reason}`);
      if (idx.availableColumns) {
        console.log(`    Available: ${idx.availableColumns}`);
      }
    });
  }

  console.log(`\n\nSummary: ${validIndexes.length} valid, ${invalidIndexes.length} invalid\n`);

  await sequelize.close();
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
