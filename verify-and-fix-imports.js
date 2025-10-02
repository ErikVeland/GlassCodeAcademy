const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Function to fix import paths in a file
function fixImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Get the relative path from the file to the components directory
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'dot-net-quiz', 'frontend', 'src', 'components'));
  
  // Check if this is a module file (inside a module directory)
  const isModuleFile = filePath.includes('/app/') && 
    (filePath.includes('/dotnet/') || filePath.includes('/laravel/') || 
     filePath.includes('/nextjs/') || filePath.includes('/node/') || 
     filePath.includes('/react/') || filePath.includes('/sass/') || 
     filePath.includes('/tailwind/')) &&
    (filePath.includes('/interview/') || filePath.includes('/lessons/'));
  
  // Check if this is an error file (in app directory but not in a module)
  const isErrorFile = filePath.includes('/app/') && 
    !filePath.includes('/dotnet/') && !filePath.includes('/laravel/') && 
    !filePath.includes('/nextjs/') && !filePath.includes('/node/') && 
    !filePath.includes('/react/') && !filePath.includes('/sass/') && 
    !filePath.includes('/tailwind/') &&
    (filePath.endsWith('error.tsx') || filePath.endsWith('global-error.tsx') || filePath.endsWith('502.tsx'));
  
  // Check if this is the main interview page
  const isMainInterviewPage = filePath.includes('/app/interview/page.tsx');
  
  if (isModuleFile) {
    // Module files need ../../../components/EnhancedLoadingComponent
    const oldImport1 = "import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';";
    const oldImport2 = "import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';";
    const newImport = "import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';";
    
    if (content.includes(oldImport1) || content.includes(oldImport2)) {
      content = content.replace(oldImport1, newImport);
      content = content.replace(oldImport2, newImport);
      modified = true;
      console.log(`Fixed module file: ${filePath}`);
    }
  } else if (isErrorFile) {
    // Error files need ../components/EnhancedLoadingComponent
    const oldImport1 = "import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';";
    const oldImport2 = "import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';";
    const newImport = "import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';";
    
    if (content.includes(oldImport1) || content.includes(oldImport2)) {
      content = content.replace(oldImport1, newImport);
      content = content.replace(oldImport2, newImport);
      modified = true;
      console.log(`Fixed error file: ${filePath}`);
    }
  } else if (isMainInterviewPage) {
    // Main interview page needs ../components/EnhancedLoadingComponent
    const oldImport1 = "import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';";
    const oldImport2 = "import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';";
    const newImport = "import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';";
    
    if (content.includes(oldImport1) || content.includes(oldImport2)) {
      content = content.replace(oldImport1, newImport);
      content = content.replace(oldImport2, newImport);
      modified = true;
      console.log(`Fixed main interview page: ${filePath}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'dot-net-quiz', 'frontend', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} .tsx files. Checking for incorrect import paths...\n`);

let fixedCount = 0;
tsFiles.forEach(filePath => {
  try {
    fixImportPaths(filePath);
    fixedCount++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nFinished checking ${fixedCount} files.`);