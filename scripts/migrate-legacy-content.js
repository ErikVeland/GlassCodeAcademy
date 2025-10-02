#!/usr/bin/env node

/**
 * Legacy Content Migration Script
 * Migrates existing backend data files to new content registry schema format
 */

const fs = require('fs');
const path = require('path');

class LegacyContentMigrator {
  constructor() {
    this.registry = null;
    this.legacyDataDir = path.join(process.cwd(), 'dot-net-quiz', 'backend', 'Data');
    this.contentDir = path.join(process.cwd(), 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
    
    // Legacy file mapping to new module slugs
    this.legacyMapping = {
      'react_lessons.json': 'react-fundamentals',
      'react_questions.json': 'react-fundamentals',
      'dotnet_lessons.json': 'dotnet-fundamentals',
      'dotnet_questions.json': 'dotnet-fundamentals',
      'database_lessons.json': 'database-systems',
      'database_questions.json': 'database-systems',
      'typescript_lessons.json': 'typescript-fundamentals',
      'typescript_questions.json': 'typescript-fundamentals',
      'node_lessons.json': 'node-fundamentals',
      'node_questions.json': 'node-fundamentals',
      'laravel_lessons.json': 'laravel-fundamentals',
      'laravel_questions.json': 'laravel-fundamentals',
      'graphql_lessons.json': 'graphql-advanced',
      'graphql_questions.json': 'graphql-advanced',
      'sass_lessons.json': 'sass-advanced',
      'sass_questions.json': 'sass-advanced',
      'tailwind_lessons.json': 'tailwind-advanced',
      'tailwind_questions.json': 'tailwind-advanced',
      'vue_lessons.json': 'vue-advanced',
      'vue_questions.json': 'vue-advanced',
      'testing_lessons.json': 'testing-fundamentals',
      'testing_questions.json': 'testing-fundamentals'
    };
  }

  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      console.error('❌ Content registry not found');
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      console.log(`✅ Loaded content registry with ${this.registry.modules.length} modules`);
      return true;
    } catch (error) {
      console.error('❌ Failed to parse content registry:', error.message);
      return false;
    }
  }

  ensureDirectories() {
    [this.lessonsDir, this.quizzesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  transformLegacyLesson(legacyLesson, moduleSlug, lessonIndex) {
    // Legacy lesson structure:
    // { id, topic, title, description, codeExample, output }
    
    return {
      id: `${moduleSlug}-lesson-${lessonIndex}`,
      moduleSlug: moduleSlug,
      title: legacyLesson.title || `Lesson ${lessonIndex}`,
      order: lessonIndex,
      objectives: this.generateObjectivesFromDescription(legacyLesson.description || ''),
      intro: this.expandDescription(legacyLesson.description || '', legacyLesson.topic || ''),
      code: {
        example: legacyLesson.codeExample || '',
        explanation: this.generateCodeExplanation(legacyLesson.output, legacyLesson.title),
        language: this.inferLanguageFromModule(moduleSlug)
      },
      pitfalls: this.generatePitfallsFromTopic(legacyLesson.topic || ''),
      exercises: [
        {
          title: `Practice: ${legacyLesson.title}`,
          description: `Apply the concepts from this lesson on ${legacyLesson.topic}`,
          checkpoints: [
            "Understand the core concept",
            "Implement the example code",
            "Experiment with variations"
          ]
        }
      ],
      next: [],
      estimatedMinutes: 25,
      difficulty: this.inferDifficultyFromContent(legacyLesson),
      tags: [legacyLesson.topic, moduleSlug.split('-')[0]].filter(Boolean),
      legacy: {
        originalId: legacyLesson.id,
        originalTopic: legacyLesson.topic,
        migrated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };
  }

  transformLegacyQuestion(legacyQuestion, moduleSlug, questionIndex) {
    // Legacy question structure can vary:
    // Type 1: { id, topic, type, question, choices, correctAnswer, explanation }
    // Type 2: { id, topic, question, choices, correctIndex, explanation }
    
    const correctIndex = legacyQuestion.correctAnswer !== undefined ? 
                        legacyQuestion.correctAnswer : 
                        legacyQuestion.correctIndex || 0;

    // Map question types
    const isOpenEnded = legacyQuestion.type === 'open-ended' || 
                       legacyQuestion.choices === null || 
                       !Array.isArray(legacyQuestion.choices);

    // Infer difficulty from question content
    const difficulty = this.inferQuestionDifficulty(legacyQuestion.question, legacyQuestion.topic);

    return {
      id: `${moduleSlug}-q${questionIndex}`,
      question: legacyQuestion.question || '',
      topic: legacyQuestion.topic || 'General',
      difficulty: difficulty,
      choices: isOpenEnded ? [
        "Open-ended question - no multiple choice",
        "This is a conceptual question",
        "Answer requires explanation",
        "Multiple approaches possible"
      ] : (legacyQuestion.choices || []),
      correctIndex: isOpenEnded ? 0 : correctIndex,
      explanation: legacyQuestion.explanation || 'No explanation provided.',
      industryContext: this.generateIndustryContext(legacyQuestion.topic, moduleSlug),
      tags: [legacyQuestion.topic, difficulty.toLowerCase(), moduleSlug.split('-')[0]].filter(Boolean),
      questionType: isOpenEnded ? 'open-ended' : 'multiple-choice',
      estimatedTime: isOpenEnded ? 180 : 90, // seconds
      legacy: {
        originalId: legacyQuestion.id,
        originalType: legacyQuestion.type,
        migrated: new Date().toISOString()
      }
    };
  }

  generateObjectivesFromDescription(description) {
    if (!description) return ['Understand key concepts', 'Apply practical knowledge', 'Build foundation skills'];
    
    // Extract key learning points from description
    const words = description.toLowerCase().split(' ');
    const actionWords = ['learn', 'understand', 'create', 'implement', 'manage', 'handle', 'use', 'build'];
    
    const objectives = [];
    
    // Try to extract main concepts
    if (words.includes('component') || words.includes('components')) {
      objectives.push('Master component creation and usage');
    }
    if (words.includes('state') || words.includes('lifecycle')) {
      objectives.push('Understand state management and lifecycle');
    }
    if (words.includes('hook') || words.includes('hooks')) {
      objectives.push('Apply hooks for state and effects');
    }
    if (words.some(word => actionWords.includes(word))) {
      objectives.push('Implement practical solutions');
    }
    
    // Ensure we have at least 2-3 objectives
    while (objectives.length < 2) {
      objectives.push('Build foundational understanding');
    }
    
    return objectives.slice(0, 3);
  }

  expandDescription(description, topic) {
    if (!description) {
      return `This lesson covers essential concepts and practical applications. You'll explore key techniques and best practices that form the foundation of modern development.`;
    }

    // Expand short descriptions into fuller introductions
    const expanded = `Welcome to this comprehensive lesson on ${topic}.

${description}

Throughout this lesson, you'll gain hands-on experience with practical implementations and real-world scenarios. We'll explore both the theoretical foundations and practical applications, ensuring you can immediately apply what you learn.

This lesson is designed to build upon previous concepts while introducing new techniques that will enhance your development skills. By the end, you'll have a solid understanding of the key principles and be ready to tackle more advanced topics.

The knowledge gained here will serve as a foundation for subsequent lessons and real-world projects.`;

    return expanded;
  }

  generateCodeExplanation(output, title) {
    if (!output) {
      return `This code example demonstrates the key concepts covered in "${title}". Study the implementation to understand the patterns and best practices being applied.`;
    }
    
    return `This example produces: ${output}

The code demonstrates practical implementation techniques and shows how the concepts work in real scenarios. Pay attention to the structure and patterns used, as these represent industry best practices.`;
  }

  inferLanguageFromModule(moduleSlug) {
    const languageMap = {
      'react-fundamentals': 'javascript',
      'typescript-fundamentals': 'typescript', 
      'dotnet-fundamentals': 'csharp',
      'node-fundamentals': 'javascript',
      'laravel-fundamentals': 'php',
      'database-systems': 'sql',
      'sass-advanced': 'scss',
      'tailwind-advanced': 'css',
      'vue-advanced': 'javascript',
      'graphql-advanced': 'graphql',
      'testing-fundamentals': 'javascript'
    };
    
    return languageMap[moduleSlug] || 'javascript';
  }

  inferDifficultyFromContent(lesson) {
    const title = (lesson.title || '').toLowerCase();
    const description = (lesson.description || '').toLowerCase();
    const content = `${title} ${description}`;
    
    const beginnerKeywords = ['basic', 'introduction', 'getting started', 'fundamentals', 'simple'];
    const advancedKeywords = ['advanced', 'complex', 'optimization', 'performance', 'custom', 'professional'];
    
    if (beginnerKeywords.some(keyword => content.includes(keyword))) {
      return 'Beginner';
    }
    if (advancedKeywords.some(keyword => content.includes(keyword))) {
      return 'Advanced';
    }
    
    return 'Intermediate';
  }

  inferQuestionDifficulty(question, topic) {
    const questionLower = (question || '').toLowerCase();
    const topicLower = (topic || '').toLowerCase();
    
    const beginnerIndicators = ['what is', 'how do you', 'basic', 'simple', 'introduction'];
    const advancedIndicators = ['optimize', 'performance', 'complex', 'best practice', 'architecture', 'scalable'];
    
    if (beginnerIndicators.some(indicator => questionLower.includes(indicator))) {
      return 'Beginner';
    }
    if (advancedIndicators.some(indicator => questionLower.includes(indicator))) {
      return 'Advanced';
    }
    
    return 'Intermediate';
  }

  generatePitfallsFromTopic(topic) {
    const topicPitfalls = {
      'Components': [
        { mistake: 'Not using keys in lists', solution: 'Always provide unique keys for list items', severity: 'high' },
        { mistake: 'Mutating props directly', solution: 'Props are read-only, create new objects for updates', severity: 'medium' }
      ],
      'Hooks': [
        { mistake: 'Calling hooks conditionally', solution: 'Always call hooks at the top level', severity: 'high' },
        { mistake: 'Missing dependencies in useEffect', solution: 'Include all used variables in dependency array', severity: 'medium' }
      ],
      'State': [
        { mistake: 'Mutating state directly', solution: 'Use setState or state updaters', severity: 'high' },
        { mistake: 'Asynchronous state updates', solution: 'Use functional updates for dependent state changes', severity: 'medium' }
      ]
    };
    
    return topicPitfalls[topic] || [
      { mistake: 'Not following best practices', solution: 'Review documentation and community guidelines', severity: 'medium' },
      { mistake: 'Skipping error handling', solution: 'Implement proper error boundaries and validation', severity: 'low' }
    ];
  }

  generateIndustryContext(topic, moduleSlug) {
    const contextMap = {
      'react': 'React is widely used in enterprise applications for building scalable user interfaces.',
      'typescript': 'TypeScript is increasingly adopted in large codebases for better maintainability.',
      'dotnet': '.NET is a powerful platform for enterprise and cloud applications.',
      'node': 'Node.js is essential for modern backend development and tooling.',
      'database': 'Database skills are fundamental for any backend developer role.'
    };
    
    const moduleKey = moduleSlug.split('-')[0];
    return contextMap[moduleKey] || 'These skills are valuable in professional development environments.';
  }

  async migrateLegacyFile(fileName) {
    const legacyPath = path.join(this.legacyDataDir, fileName);
    const moduleSlug = this.legacyMapping[fileName];
    
    if (!moduleSlug) {
      console.log(`⏭️  Skipping ${fileName} - no mapping defined`);
      return false;
    }
    
    if (!fs.existsSync(legacyPath)) {
      console.log(`⏭️  Skipping ${fileName} - file not found`);
      return false;
    }

    try {
      const legacyContent = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      
      if (fileName.includes('lessons')) {
        await this.migrateLessons(legacyContent, moduleSlug);
      } else if (fileName.includes('questions')) {
        await this.migrateQuestions(legacyContent, moduleSlug);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate ${fileName}:`, error.message);
      return false;
    }
  }

  async migrateLessons(legacyLessons, moduleSlug) {
    const newLessonsPath = path.join(this.lessonsDir, `${moduleSlug}.json`);
    
    // Skip if already exists (don't overwrite)
    if (fs.existsSync(newLessonsPath)) {
      console.log(`📚 Lessons for ${moduleSlug} already exist - skipping`);
      return;
    }

    const transformedLessons = legacyLessons.map((lesson, index) => 
      this.transformLegacyLesson(lesson, moduleSlug, index + 1)
    );

    fs.writeFileSync(newLessonsPath, JSON.stringify(transformedLessons, null, 2));
    console.log(`📚 Migrated ${transformedLessons.length} lessons for ${moduleSlug}`);
  }

  async migrateQuestions(legacyQuestions, moduleSlug) {
    const newQuizPath = path.join(this.quizzesDir, `${moduleSlug}.json`);
    
    // Skip if already exists (don't overwrite)
    if (fs.existsSync(newQuizPath)) {
      console.log(`🎯 Quiz for ${moduleSlug} already exists - skipping`);
      return;
    }

    const transformedQuestions = legacyQuestions.map((question, index) =>
      this.transformLegacyQuestion(question, moduleSlug, index + 1)
    );

    const quiz = {
      moduleSlug: moduleSlug,
      title: `${moduleSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Assessment`,
      description: `Comprehensive assessment covering key concepts from the ${moduleSlug} module`,
      totalQuestions: transformedQuestions.length,
      passingScore: 70,
      timeLimit: Math.ceil(transformedQuestions.length * 1.5), // 1.5 minutes per question
      questions: transformedQuestions,
      metadata: {
        migrated: true,
        originalQuestionCount: legacyQuestions.length,
        migrationDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }
    };

    fs.writeFileSync(newQuizPath, JSON.stringify(quiz, null, 2));
    console.log(`🎯 Migrated ${transformedQuestions.length} questions for ${moduleSlug}`);
  }

  async migrateAll() {
    console.log('🚀 Starting legacy content migration...\n');

    if (!this.loadRegistry()) {
      return false;
    }

    this.ensureDirectories();

    const legacyFiles = Object.keys(this.legacyMapping);
    let successCount = 0;
    let skipCount = 0;

    for (const fileName of legacyFiles) {
      const result = await this.migrateLegacyFile(fileName);
      if (result) {
        successCount++;
      } else {
        skipCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   📊 Successfully migrated: ${successCount} files`);
    console.log(`   ⏭️  Skipped: ${skipCount} files`);
    console.log(`   📁 Content migrated to: ${this.contentDir}`);
    
    if (successCount > 0) {
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Review migrated content for accuracy`);
      console.log(`   2. Enhance content with additional details`);
      console.log(`   3. Run 'npm run validate-content' to check quality`);
      console.log(`   4. Update registry module status from 'content-pending' to 'active'`);
    }

    return true;
  }

  async updateRegistryStatus() {
    console.log('\n🔄 Updating module status in registry...');
    
    const migratedModules = Object.values(this.legacyMapping);
    let updatedCount = 0;

    for (const module of this.registry.modules) {
      if (migratedModules.includes(module.slug) && module.status === 'content-pending') {
        // Check if both lessons and quiz files exist
        const lessonsExist = fs.existsSync(path.join(this.lessonsDir, `${module.slug}.json`));
        const quizExists = fs.existsSync(path.join(this.quizzesDir, `${module.slug}.json`));
        
        if (lessonsExist && quizExists) {
          module.status = 'active';
          updatedCount++;
          console.log(`   ✅ Updated ${module.slug} status to 'active'`);
        }
      }
    }

    if (updatedCount > 0) {
      const registryPath = path.join(this.contentDir, 'registry.json');
      fs.writeFileSync(registryPath, JSON.stringify(this.registry, null, 2));
      console.log(`\n📝 Updated registry with ${updatedCount} module status changes`);
    }

    return updatedCount;
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new LegacyContentMigrator();
  
  migrator.migrateAll()
    .then(() => migrator.updateRegistryStatus())
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = LegacyContentMigrator;