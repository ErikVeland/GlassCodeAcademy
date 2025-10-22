const fs = require('fs');
const path = require('path');

// Function to check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Function to validate directory structure
function validateStructure() {
  const requiredDirs = [
    'src/controllers',
    'src/models',
    'src/routes',
    'src/services',
    'src/middleware',
    'src/utils',
    'src/config',
    'tests'
  ];

  const missingDirs = [];
  
  for (const dir of requiredDirs) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fileExists(fullPath)) {
      missingDirs.push(dir);
    }
  }
  
  return missingDirs;
}

// Function to validate required files
function validateFiles() {
  const requiredFiles = [
    'server.js',
    'package.json',
    'src/config/database.js',
    'src/config/auth.js',
    'src/models/index.js',
    'src/routes/authRoutes.js',
    'src/routes/courseRoutes.js',
    'src/routes/moduleRoutes.js',
    'src/routes/lessonRoutes.js',
    'src/routes/progressRoutes.js',
    'src/controllers/authController.js',
    'src/controllers/courseController.js',
    'src/controllers/moduleController.js',
    'src/controllers/lessonController.js',
    'src/controllers/progressController.js',
    'src/services/authService.js',
    'src/services/contentService.js',
    'src/services/progressService.js',
    'src/middleware/authMiddleware.js',
    'src/middleware/errorMiddleware.js',
    'src/middleware/validationMiddleware.js',
    'src/middleware/rateLimitMiddleware.js',
    'src/utils/database.js',
    'src/utils/logger.js'
  ];

  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fileExists(fullPath)) {
      missingFiles.push(file);
    }
  }
  
  return missingFiles;
}

// Run validation
console.log('Validating Node.js backend structure...\n');

const missingDirs = validateStructure();
if (missingDirs.length > 0) {
  console.log('Missing directories:');
  missingDirs.forEach(dir => console.log(`  - ${dir}`));
} else {
  console.log('✓ All required directories present');
}

const missingFiles = validateFiles();
if (missingFiles.length > 0) {
  console.log('\nMissing files:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
} else {
  console.log('✓ All required files present');
}

if (missingDirs.length === 0 && missingFiles.length === 0) {
  console.log('\n🎉 Validation successful! Node.js backend structure is complete.');
  process.exit(0);
} else {
  console.log('\n❌ Validation failed! Please check the missing directories and files.');
  process.exit(1);
}