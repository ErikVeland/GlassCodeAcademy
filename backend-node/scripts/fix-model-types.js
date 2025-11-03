#!/usr/bin/env node

/**
 * Script to fix PostgreSQL-specific data types in Sequelize models
 * Converts JSONB to getJSONType() and ARRAY to getArrayType()
 * for SQLite compatibility in tests
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'src', 'models');

const modelsToFix = [
  'academyMembershipModel.js',
  'academyModel.js',
  'academySettingsModel.js',
  'auditLogModel.js',
  'badgeModel.js',
  'certificateModel.js',
  'contentImportModel.js',
  'contentPackageModel.js',
  'contentVersionModel.js',
  'contentWorkflowModel.js',
  'departmentModel.js',
  'lessonModel.js',
  'notificationModel.js',
  'quizAttemptModel.js',
  'quizModel.js',
  'rolePermissionModel.js',
  'tierModel.js',
  'validationResultModel.js',
  'validationRuleModel.js',
];

function fixModel(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if already imports the helper
  const hasHelper = content.includes('require(\'../utils/databaseTypes\')');
  
  // Add import if not present
  if (!hasHelper && (content.includes('DataTypes.JSONB') || content.includes('DataTypes.ARRAY'))) {
    const requireLine = 'const { DataTypes } = require(\'sequelize\');\nconst sequelize = require(\'../config/database\');';
    const newRequireLine = 'const { DataTypes } = require(\'sequelize\');\nconst sequelize = require(\'../config/database\');\nconst { getJSONType, getArrayType, arrayGetterSetter } = require(\'../utils/databaseTypes\');';
    
    if (content.includes(requireLine)) {
      content = content.replace(requireLine, newRequireLine);
      modified = true;
      console.log('  ✓ Added database types helper import');
    }
  }
  
  // Replace JSONB with getJSONType()
  const jsonbMatches = content.match(/type:\s*DataTypes\.JSONB/g);
  if (jsonbMatches) {
    content = content.replace(/type:\s*DataTypes\.JSONB/g, 'type: getJSONType()');
    console.log(`  ✓ Replaced ${jsonbMatches.length} DataTypes.JSONB with getJSONType()`);
    modified = true;
  }
  
  // Replace ARRAY with getArrayType()
  // This regex captures: DataTypes.ARRAY(DataTypes.XXX)
  const arrayPattern = /type:\s*DataTypes\.ARRAY\(DataTypes\.(\w+)\)/g;
  const arrayMatches = [...content.matchAll(arrayPattern)];
  
  if (arrayMatches.length > 0) {
    content = content.replace(arrayPattern, 'type: getArrayType(DataTypes.$1)');
    console.log(`  ✓ Replaced ${arrayMatches.length} DataTypes.ARRAY with getArrayType()`);
    
    // For arrays, we need to add getter/setter
    // Find the field definition and add get/set
    arrayMatches.forEach((match) => {
      // Find the field by looking backwards for the field name
      const matchIndex = content.indexOf(match[0]);
      const beforeMatch = content.substring(0, matchIndex);
      const fieldNameMatch = beforeMatch.match(/(\w+):\s*\{[^}]*$/);
      
      if (fieldNameMatch) {
        const fieldName = fieldNameMatch[1];
        
        // Check if get/set already exist
        const fieldStart = content.lastIndexOf(fieldName + ':', matchIndex);
        const fieldEnd = content.indexOf('},', matchIndex);
        const fieldDef = content.substring(fieldStart, fieldEnd + 2);
        
        if (!fieldDef.includes('get:') && !fieldDef.includes('set:')) {
          // Add getter/setter before closing brace
          const closingBraceIndex = content.indexOf('},', matchIndex);
          const beforeClosing = content.substring(0, closingBraceIndex);
          const lastCommaIndex = beforeClosing.lastIndexOf(',');
          
          // Remove trailing comma if exists
          if (content[closingBraceIndex - 1] === ',') {
            content = content.substring(0, closingBraceIndex - 1) + 
                     ',\n      get: arrayGetterSetter.get,\n      set: arrayGetterSetter.set,' +
                     content.substring(closingBraceIndex);
          } else {
            content = content.substring(0, closingBraceIndex) + 
                     ',\n      get: arrayGetterSetter.get,\n      set: arrayGetterSetter.set' +
                     content.substring(closingBraceIndex);
          }
          console.log(`  ✓ Added getter/setter for array field: ${fieldName}`);
        }
      }
    });
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Saved changes to ${path.basename(filePath)}`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
  
  return modified;
}

// Main execution
console.log('='.repeat(60));
console.log('Fixing PostgreSQL-specific types in Sequelize models');
console.log('='.repeat(60));

let totalFixed = 0;

modelsToFix.forEach((modelFile) => {
  const filePath = path.join(modelsDir, modelFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  File not found: ${modelFile}`);
    return;
  }
  
  const wasModified = fixModel(filePath);
  if (wasModified) {
    totalFixed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed ${totalFixed} out of ${modelsToFix.length} model files`);
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('1. Run tests: npm test');
console.log('2. Verify all tests pass');
console.log('3. Commit changes');
