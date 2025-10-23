#!/usr/bin/env node

/**
 * Content Validation Framework
 * A comprehensive system for validating educational content integrity
 */

const fs = require('fs');
const path = require('path');

// Configuration and validation modes
const VALIDATION_MODES = {
  DEVELOPMENT: 'development',
  CI: 'ci',
  PRODUCTION: 'production'
};

// Configuration options
const DEFAULT_CONFIG = {
  strictMode: false,
  reportFormat: 'console',
  validateOrphanedContent: true,
  validateCircularDependencies: true,
  minLessonIntroWords: 50,
  requiredQuizChoices: 4
};

// Get validation mode from environment
const validationMode = process.env.NODE_ENV === 'production' ? VALIDATION_MODES.PRODUCTION : 
                      process.env.CI ? VALIDATION_MODES.CI : VALIDATION_MODES.DEVELOPMENT;

// Determine if we're in strict mode
const isStrictMode = process.env.VALIDATION_STRICT === 'true' || 
                    validationMode === VALIDATION_MODES.PRODUCTION || 
                    validationMode === VALIDATION_MODES.CI ||
                    DEFAULT_CONFIG.strictMode;

console.log(`🔍 Running content validation in ${validationMode} mode (strict: ${isStrictMode})`);

// Main validator class
class ContentValidationFramework {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errors = [];
    this.warnings = [];
    this.registry = null;
    this.contentDir = path.join(process.cwd(), '..', 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
  }

  addError(message, context = null, severity = 'error') {
    const error = { message, context, type: 'error', severity };
    this.errors.push(error);
    
    // Log immediately based on severity
    switch(severity) {
      case 'critical':
        console.error(`💥 CRITICAL: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
      case 'high':
        console.error(`❌ ERROR: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
      case 'medium':
      case 'low':
      default:
        console.error(`⚠️  ERROR: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
    }
  }

  addWarning(message, context = null, severity = 'medium') {
    const warning = { message, context, type: 'warning', severity };
    this.warnings.push(warning);
    
    // Log immediately based on severity
    switch(severity) {
      case 'high':
        console.warn(`⚠️  WARNING (High): ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
      case 'medium':
        console.warn(`⚠️  WARNING: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
      case 'low':
      default:
        console.warn(`ℹ️  WARNING (Low): ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
        break;
    }
  }

  addInfo(message) {
    console.log(`ℹ️  INFO: ${message}`);
  }

  // REGISTRY VALIDATOR
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

  // Enhanced validation with error categorization
  validateModuleStructure(module, index) {
    const requiredFields = [
      'slug', 'title', 'description', 'tier', 'track', 'order',
      'difficulty', 'estimatedHours', 'category', 'technologies',
      'prerequisites', 'thresholds', 'status', 'routes'
    ];

    const context = { moduleSlug: module.slug, moduleIndex: index };

    for (const field of requiredFields) {
      if (module[field] === undefined || module[field] === null) {
        this.addError(`Module missing required field: ${field}`, context, 'high');
      }
    }

    // Validate thresholds structure
    if (module.thresholds) {
      if (!module.thresholds.requiredLessons || !module.thresholds.requiredQuestions) {
        this.addError('Module thresholds must include requiredLessons and requiredQuestions', context, 'high');
      }
    }

    // Validate tier reference
    if (module.tier && this.registry.tiers && !this.registry.tiers[module.tier]) {
      this.addError(`Module references non-existent tier: ${module.tier}`, context, 'high');
    }

    // Validate difficulty levels
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (module.difficulty && !validDifficulties.includes(module.difficulty)) {
      this.addError(`Invalid difficulty level: ${module.difficulty}`, context, 'medium');
    }

    // Validate prerequisites exist
    if (module.prerequisites && Array.isArray(module.prerequisites)) {
      for (const prereq of module.prerequisites) {
        const prereqExists = this.registry.modules.some(m => m.slug === prereq);
        if (!prereqExists) {
          this.addError(`Module references non-existent prerequisite: ${prereq}`, context, 'high');
        }
      }
    }

    // Validate routes structure
    if (module.routes) {
      const requiredRoutes = ['overview', 'lessons', 'quiz'];
      for (const route of requiredRoutes) {
        if (!module.routes[route]) {
          this.addError(`Module missing required route: ${route}`, context, 'medium');
        }
      }
    }
  }

  // LESSON VALIDATOR
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
        if (isStrictMode || this.config.strictMode) {
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

    // Validate intro length based on configuration
    if (lesson.intro && typeof lesson.intro === 'string') {
      const wordCount = lesson.intro.split(/\s+/).length;
      if (wordCount < this.config.minLessonIntroWords) {
        this.addWarning(`Lesson intro is very short (${wordCount} words)`, context);
      }
    }

    // Validate code example structure
    if (lesson.code) {
      const codeFields = ['example', 'explanation', 'language'];
      for (const field of codeFields) {
        if (!lesson.code[field]) {
          this.addWarning(`Lesson code example missing field: ${field}`, context);
        }
      }
    }

    // Validate pitfalls structure
    if (lesson.pitfalls && Array.isArray(lesson.pitfalls)) {
      lesson.pitfalls.forEach((pitfall, pitfallIndex) => {
        const pitfallFields = ['mistake', 'solution', 'severity'];
        for (const field of pitfallFields) {
          if (!pitfall[field]) {
            this.addWarning(`Pitfall ${pitfallIndex} missing field: ${field}`, context);
          }
        }
      });
    }

    // Validate exercises structure
    if (lesson.exercises && Array.isArray(lesson.exercises)) {
      lesson.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseFields = ['title', 'description', 'checkpoints'];
        for (const field of exerciseFields) {
          if (!exercise[field]) {
            this.addWarning(`Exercise ${exerciseIndex} missing field: ${field}`, context);
          }
        }
        
        // Validate checkpoints array
        if (exercise.checkpoints && !Array.isArray(exercise.checkpoints)) {
          this.addWarning(`Exercise ${exerciseIndex} checkpoints must be an array`, context);
        }
      });
    }
  }

  // QUIZ VALIDATOR
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

      // Handle both formats: direct array of questions or object with questions property
      let questions = [];
      if (Array.isArray(quiz)) {
        // Direct array format (current structure)
        questions = quiz;
      } else if (quiz.questions && Array.isArray(quiz.questions)) {
        // Object with questions property format
        questions = quiz.questions;
      } else {
        this.addError(`Quiz must be an array of questions or have a questions array: ${module.slug}`, context);
        return false;
      }

      const requiredQuestions = module.thresholds?.requiredQuestions || 15;
      if (questions.length < requiredQuestions) {
        const message = `Module ${module.slug} has ${questions.length} questions, requires ${requiredQuestions}`;
        if (isStrictMode || this.config.strictMode) {
          this.addError(message, context);
          return false;
        } else {
          this.addWarning(message, context);
        }
      }

      // Validate question structure
      questions.forEach((question, index) => {
        this.validateQuestionStructure(question, module.slug, index);
      });

      return true;
    } catch (error) {
      this.addError(`Failed to parse quiz file for ${module.slug}`, { ...context, error: error.message });
      return false;
    }
  }

  validateQuestionStructure(question, moduleSlug, index) {
    const context = { moduleSlug, questionIndex: index };

    // Required for all question types
    const baseRequired = ['id', 'question', 'explanation'];
    for (const field of baseRequired) {
      if (!question[field]) {
        this.addError(`Question missing required field: ${field}`, context);
      }
    }

    // Soft-check topic presence
    if (!question.topic) {
      this.addWarning('Question missing field: topic', context);
    }

    // Validate difficulty value when present
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced', 'Basic'];
    if (question.difficulty && !validDifficulties.includes(question.difficulty)) {
      this.addError(`Invalid question difficulty: ${question.difficulty}`, context);
    }

    // Determine question type (support legacy "type" and new "questionType")
    const qType = (question.questionType || question.type || 'multiple-choice').toLowerCase();

    if (qType === 'multiple-choice') {
      // Choices required and must have exactly the configured number of entries
      if (!question.choices || !Array.isArray(question.choices)) {
        this.addError('Question missing required field: choices', context);
      } else if (question.choices.length !== this.config.requiredQuizChoices) {
        this.addError(`Question must have exactly ${this.config.requiredQuizChoices} choices`, context);
      }

      // Must have correctIndex or correctAnswer
      if (question.correctIndex === undefined && question.correctAnswer === undefined) {
        this.addError('Question missing correctIndex or correctAnswer field', context);
      }

      // Validate correctIndex range when present
      if (typeof question.correctIndex === 'number' && Array.isArray(question.choices)) {
        if (question.correctIndex < 0 || question.correctIndex >= question.choices.length) {
          this.addError('Question correctIndex out of range', context);
        }
      }
    } else {
      // Open-ended or coding-challenge: choices/correctIndex/correctAnswer should be omitted
      const hasChoices = question.choices && Array.isArray(question.choices);
      const hasCorrectIndex = question.correctIndex !== undefined;
      const hasCorrectAnswer = question.correctAnswer !== undefined;

      if (hasChoices || hasCorrectIndex || hasCorrectAnswer) {
        const msg = 'Open-ended/coding question should not include choices, correctIndex, or correctAnswer';
        this.addWarning(msg, context);
      }
    }
  }

  // CROSS-REFERENCE VALIDATOR
  validateReferenceIntegrity() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate reference integrity without registry');
      return false;
    }

    // Check for circular dependencies if enabled
    if (this.config.validateCircularDependencies) {
      for (const module of this.registry.modules) {
        this.checkCircularDependencies(module.slug, [], new Set());
      }
    }

    // Check for orphaned content files if enabled
    if (this.config.validateOrphanedContent) {
      this.validateOrphanedContent();
    }

    return this.errors.length === 0;
  }

  checkCircularDependencies(moduleSlug, path, visited) {
    if (visited.has(moduleSlug)) {
      this.addError(`Circular dependency detected`, { path: [...path, moduleSlug] }, 'high');
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
          this.addWarning(`Orphaned lesson file: ${lessonSlug}.json`, null, 'low');
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
          this.addWarning(`Orphaned quiz file: ${quizSlug}.json`, null, 'low');
        }
      }
    }
  }

  // THRESHOLD VALIDATOR
  validateContentThresholds() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate thresholds without registry');
      return false;
    }

    let allModulesMeetThresholds = true;

    for (const module of this.registry.modules) {
      if (module.status === 'content-pending') {
        if (isStrictMode || this.config.strictMode) {
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

  // Reporting and error handling mechanisms
  generateReport(format = 'console') {
    const report = {
      timestamp: new Date().toISOString(),
      mode: validationMode,
      strictMode: isStrictMode,
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'console':
      default:
        return this.formatConsoleReport(report);
    }
  }

  formatConsoleReport(report) {
    let output = `\n=== Content Validation Report ===\n`;
    output += `Timestamp: ${report.timestamp}\n`;
    output += `Mode: ${report.mode}\n`;
    output += `Strict Mode: ${report.strictMode}\n`;
    output += `Errors: ${report.totalErrors}\n`;
    output += `Warnings: ${report.totalWarnings}\n\n`;

    if (report.errors.length > 0) {
      output += 'Errors:\n';
      report.errors.forEach((error, index) => {
        output += `  ${index + 1}. ${error.message}\n`;
        if (error.context) {
          output += `     Context: ${JSON.stringify(error.context)}\n`;
        }
      });
      output += '\n';
    }

    if (report.warnings.length > 0) {
      output += 'Warnings:\n';
      report.warnings.forEach((warning, index) => {
        output += `  ${index + 1}. ${warning.message}\n`;
        if (warning.context) {
          output += `     Context: ${JSON.stringify(warning.context)}\n`;
        }
      });
      output += '\n';
    }

    return output;
  }

  // Main execution method
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
  const validator = new ContentValidationFramework();
  validator.run().catch(error => {
    console.error('💥 Validation failed with unexpected error:', error);
    process.exit(1);
  });
}

module.exports = ContentValidationFramework;