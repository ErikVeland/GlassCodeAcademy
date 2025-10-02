#!/usr/bin/env node

/**
 * Content Validation Framework
 * Validates content registry, lessons, and quizzes against schema and thresholds
 */

const fs = require('fs');
const path = require('path');

// Validation modes
const MODES = {
  DEVELOPMENT: 'development',
  CI: 'ci',
  PRODUCTION: 'production'
};

// Get validation mode from environment
const validationMode = process.env.NODE_ENV === 'production' ? MODES.PRODUCTION : 
                      process.env.CI ? MODES.CI : MODES.DEVELOPMENT;

const isStrictMode = validationMode === MODES.PRODUCTION || validationMode === MODES.CI;

console.log(`🔍 Running content validation in ${validationMode} mode (strict: ${isStrictMode})`);

class ContentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.registry = null;
    this.contentDir = path.join(process.cwd(), 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
  }

  addError(message, context = null) {
    this.errors.push({ message, context, type: 'error' });
    console.error(`❌ ERROR: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
  }

  addWarning(message, context = null) {
    this.warnings.push({ message, context, type: 'warning' });
    console.warn(`⚠️  WARNING: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
  }

  addInfo(message) {
    console.log(`ℹ️  INFO: ${message}`);
  }

  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      this.addError('Content registry not found', { path: registryPath });
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      this.addInfo(`Loaded content registry with ${this.registry.modules.length} modules`);
      return true;
    } catch (error) {
      this.addError('Failed to parse content registry', { error: error.message });
      return false;
    }
  }

  validateRegistrySchema() {
    if (!this.registry) {
      this.addError('Registry not loaded for schema validation');
      return false;
    }

    // Validate required top-level fields
    const requiredFields = ['version', 'tiers', 'modules', 'globalSettings'];
    for (const field of requiredFields) {
      if (!this.registry[field]) {
        this.addError(`Missing required registry field: ${field}`);
      }
    }

    // Validate tiers structure
    if (this.registry.tiers) {
      const expectedTiers = ['foundational', 'core', 'specialized', 'quality'];
      for (const tierKey of expectedTiers) {
        if (!this.registry.tiers[tierKey]) {
          this.addError(`Missing tier definition: ${tierKey}`);
        } else {
          this.validateTierStructure(tierKey, this.registry.tiers[tierKey]);
        }
      }
    }

    // Validate modules structure
    if (this.registry.modules) {
      this.registry.modules.forEach((module, index) => {
        this.validateModuleStructure(module, index);
      });
    }

    return this.errors.length === 0;
  }

  validateTierStructure(tierKey, tier) {
    const requiredFields = ['level', 'title', 'description', 'focusArea', 'learningObjectives'];
    
    for (const field of requiredFields) {
      if (!tier[field]) {
        this.addError(`Tier ${tierKey} missing required field: ${field}`);
      }
    }

    if (tier.learningObjectives && !Array.isArray(tier.learningObjectives)) {
      this.addError(`Tier ${tierKey} learningObjectives must be an array`);
    }
  }

  validateModuleStructure(module, index) {
    const requiredFields = [
      'slug', 'title', 'description', 'tier', 'track', 'order',
      'difficulty', 'estimatedHours', 'category', 'technologies',
      'prerequisites', 'thresholds', 'status', 'routes'
    ];

    const context = { moduleSlug: module.slug, moduleIndex: index };

    for (const field of requiredFields) {
      if (module[field] === undefined || module[field] === null) {
        this.addError(`Module missing required field: ${field}`, context);
      }
    }

    // Validate thresholds structure
    if (module.thresholds) {
      if (!module.thresholds.requiredLessons || !module.thresholds.requiredQuestions) {
        this.addError('Module thresholds must include requiredLessons and requiredQuestions', context);
      }
    }

    // Validate tier reference
    if (module.tier && this.registry.tiers && !this.registry.tiers[module.tier]) {
      this.addError(`Module references non-existent tier: ${module.tier}`, context);
    }

    // Validate difficulty levels
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (module.difficulty && !validDifficulties.includes(module.difficulty)) {
      this.addError(`Invalid difficulty level: ${module.difficulty}`, context);
    }

    // Validate prerequisites exist
    if (module.prerequisites && Array.isArray(module.prerequisites)) {
      for (const prereq of module.prerequisites) {
        const prereqExists = this.registry.modules.some(m => m.slug === prereq);
        if (!prereqExists) {
          this.addError(`Module references non-existent prerequisite: ${prereq}`, context);
        }
      }
    }

    // Validate routes structure
    if (module.routes) {
      const requiredRoutes = ['overview', 'lessons', 'quiz'];
      for (const route of requiredRoutes) {
        if (!module.routes[route]) {
          this.addError(`Module missing required route: ${route}`, context);
        }
      }
    }
  }

  validateContentThresholds() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate thresholds without registry');
      return false;
    }

    let allModulesMeetThresholds = true;

    for (const module of this.registry.modules) {
      if (module.status === 'content-pending') {
        if (isStrictMode) {
          this.addError(`Module ${module.slug} has content-pending status in strict mode`);
          allModulesMeetThresholds = false;
        } else {
          this.addWarning(`Module ${module.slug} has content-pending status`);
        }
        continue;
      }

      const lessonsValid = this.validateModuleLessons(module);
      const quizValid = this.validateModuleQuiz(module);

      if (!lessonsValid || !quizValid) {
        allModulesMeetThresholds = false;
      }
    }

    return allModulesMeetThresholds;
  }

  validateModuleLessons(module) {
    const lessonsPath = path.join(this.lessonsDir, `${module.slug}.json`);
    const context = { moduleSlug: module.slug, lessonsPath };

    if (!fs.existsSync(lessonsPath)) {
      if (isStrictMode) {
        this.addError(`Missing lessons file for module: ${module.slug}`, context);
        return false;
      } else {
        this.addWarning(`Missing lessons file for module: ${module.slug}`, context);
        return true;
      }
    }

    try {
      const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
      const lessons = JSON.parse(lessonsContent);

      if (!Array.isArray(lessons)) {
        this.addError(`Lessons file must contain an array: ${module.slug}`, context);
        return false;
      }

      const requiredLessons = module.thresholds?.requiredLessons || 12;
      if (lessons.length < requiredLessons) {
        const message = `Module ${module.slug} has ${lessons.length} lessons, requires ${requiredLessons}`;
        if (isStrictMode) {
          this.addError(message, context);
          return false;
        } else {
          this.addWarning(message, context);
        }
      }

      // Validate lesson structure
      lessons.forEach((lesson, index) => {
        this.validateLessonStructure(lesson, module.slug, index);
      });

      return true;
    } catch (error) {
      this.addError(`Failed to parse lessons file for ${module.slug}`, { ...context, error: error.message });
      return false;
    }
  }

  validateLessonStructure(lesson, moduleSlug, index) {
    const requiredFields = ['id', 'title', 'order', 'objectives', 'intro'];
    const context = { moduleSlug, lessonIndex: index, lessonId: lesson.id };

    for (const field of requiredFields) {
      if (!lesson[field]) {
        this.addError(`Lesson missing required field: ${field}`, context);
      }
    }

    // Validate objectives array
    if (lesson.objectives && !Array.isArray(lesson.objectives)) {
      this.addError('Lesson objectives must be an array', context);
    }

    // Validate intro length (recommended 200-300 words)
    if (lesson.intro && typeof lesson.intro === 'string') {
      const wordCount = lesson.intro.split(/\s+/).length;
      if (wordCount < 50) {
        this.addWarning(`Lesson intro is very short (${wordCount} words)`, context);
      }
    }
  }

  validateModuleQuiz(module) {
    const quizPath = path.join(this.quizzesDir, `${module.slug}.json`);
    const context = { moduleSlug: module.slug, quizPath };

    if (!fs.existsSync(quizPath)) {
      if (isStrictMode) {
        this.addError(`Missing quiz file for module: ${module.slug}`, context);
        return false;
      } else {
        this.addWarning(`Missing quiz file for module: ${module.slug}`, context);
        return true;
      }
    }

    try {
      const quizContent = fs.readFileSync(quizPath, 'utf8');
      const quiz = JSON.parse(quizContent);

      if (!quiz.questions || !Array.isArray(quiz.questions)) {
        this.addError(`Quiz must have questions array: ${module.slug}`, context);
        return false;
      }

      const requiredQuestions = module.thresholds?.requiredQuestions || 15;
      if (quiz.questions.length < requiredQuestions) {
        const message = `Module ${module.slug} has ${quiz.questions.length} questions, requires ${requiredQuestions}`;
        if (isStrictMode) {
          this.addError(message, context);
          return false;
        } else {
          this.addWarning(message, context);
        }
      }

      // Validate question structure
      quiz.questions.forEach((question, index) => {
        this.validateQuestionStructure(question, module.slug, index);
      });

      return true;
    } catch (error) {
      this.addError(`Failed to parse quiz file for ${module.slug}`, { ...context, error: error.message });
      return false;
    }
  }

  validateQuestionStructure(question, moduleSlug, index) {
    const requiredFields = ['question', 'choices', 'explanation'];
    const context = { moduleSlug, questionIndex: index };

    for (const field of requiredFields) {
      if (!question[field]) {
        this.addError(`Question missing required field: ${field}`, context);
      }
    }

    // Check for correctIndex field (allow both correctIndex and correctAnswer for legacy compatibility)
    if (question.correctIndex === undefined && question.correctAnswer === undefined) {
      this.addError('Question missing correctIndex or correctAnswer field', context);
    }

    // Validate choices array
    if (question.choices && Array.isArray(question.choices)) {
      if (question.choices.length !== 4) {
        this.addError('Question must have exactly 4 choices', context);
      }
    }

    // Validate correctIndex
    if (typeof question.correctIndex === 'number') {
      if (question.correctIndex < 0 || question.correctIndex >= (question.choices?.length || 4)) {
        this.addError('Question correctIndex out of range', context);
      }
    }
  }

  validateReferenceIntegrity() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate reference integrity without registry');
      return false;
    }

    // Check for circular dependencies
    for (const module of this.registry.modules) {
      this.checkCircularDependencies(module.slug, [], new Set());
    }

    // Check for orphaned content files
    this.validateOrphanedContent();

    return this.errors.length === 0;
  }

  checkCircularDependencies(moduleSlug, path, visited) {
    if (visited.has(moduleSlug)) {
      this.addError(`Circular dependency detected`, { path: [...path, moduleSlug] });
      return;
    }

    const module = this.registry.modules.find(m => m.slug === moduleSlug);
    if (!module) return;

    visited.add(moduleSlug);
    path.push(moduleSlug);

    if (module.prerequisites && Array.isArray(module.prerequisites)) {
      for (const prereq of module.prerequisites) {
        this.checkCircularDependencies(prereq, [...path], new Set(visited));
      }
    }
  }

  validateOrphanedContent() {
    const modulesSlugs = new Set(this.registry.modules.map(m => m.slug));

    // Check lessons directory
    if (fs.existsSync(this.lessonsDir)) {
      const lessonFiles = fs.readdirSync(this.lessonsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      for (const lessonSlug of lessonFiles) {
        if (!modulesSlugs.has(lessonSlug)) {
          this.addWarning(`Orphaned lesson file: ${lessonSlug}.json`);
        }
      }
    }

    // Check quizzes directory  
    if (fs.existsSync(this.quizzesDir)) {
      const quizFiles = fs.readdirSync(this.quizzesDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      for (const quizSlug of quizFiles) {
        if (!modulesSlugs.has(quizSlug)) {
          this.addWarning(`Orphaned quiz file: ${quizSlug}.json`);
        }
      }
    }
  }

  async run() {
    console.log('🚀 Starting content validation...\n');

    // Step 1: Load and validate registry
    if (!this.loadRegistry()) {
      return this.exitWithResults();
    }

    // Step 2: Validate registry schema
    this.addInfo('Validating registry schema...');
    this.validateRegistrySchema();

    // Step 3: Validate content thresholds
    this.addInfo('Validating content thresholds...');
    this.validateContentThresholds();

    // Step 4: Validate reference integrity
    this.addInfo('Validating reference integrity...');
    this.validateReferenceIntegrity();

    return this.exitWithResults();
  }

  exitWithResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed! Content is ready for production.');
      process.exit(0);
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings found:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ ${this.errors.length} errors found:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
      });

      if (isStrictMode) {
        console.log('\n💥 Validation failed in strict mode. Fix errors before proceeding.');
        process.exit(1);
      } else {
        console.log('\n🔧 Validation completed with errors. Development mode allows continued work.');
        process.exit(0);
      }
    }

    console.log('\n✨ Validation completed successfully.');
    process.exit(0);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ContentValidator();
  validator.run().catch(error => {
    console.error('💥 Validation failed with unexpected error:', error);
    process.exit(1);
  });
}

module.exports = ContentValidator;