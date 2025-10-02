const fs = require('fs');

// List of files that need to be fixed (module interview and lessons pages)
const filesToFix = [
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/tailwind/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/tailwind/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/dotnet/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/graphql/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/graphql/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/nextjs/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/nextjs/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/node/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/node/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/sass/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/sass/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/react/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/react/lessons/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/laravel/interview/page.tsx',
  '/Users/veland/dotNetQuiz/dot-net-quiz/frontend/src/app/laravel/lessons/page.tsx'
];

// Fix each file
filesToFix.forEach(filePath => {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace incorrect import paths with the correct one
    const oldImport1 = "import EnhancedLoadingComponent from '../../components/EnhancedLoadingComponent';";
    const oldImport2 = "import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';";
    const newImport = "import EnhancedLoadingComponent from '../../../components/EnhancedLoadingComponent';";
    
    let changed = false;
    if (content.includes(oldImport1)) {
      content = content.replace(oldImport1, newImport);
      changed = true;
    }
    if (content.includes(oldImport2)) {
      content = content.replace(oldImport2, newImport);
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed import path in ${filePath}`);
    } else {
      console.log(`- No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n🎉 All module import paths have been updated!');