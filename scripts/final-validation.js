#!/usr/bin/env node

/**
 * Final Content Validation and Quality Standards Script
 * Validates all content meets minimum thresholds and quality standards
 */

const fs = require('fs').promises;
const path = require('path');

class FinalContentValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalModules: 0,
      validModules: 0,
      totalLessons: 0,
      validLessons: 0,
      totalQuizzes: 0,
      validQuizzes: 0,
      issues: [],
      warnings: [],
      summary: {
        overallCompliance: 0,
        readyForProduction: false,
        criticalIssues: 0,
        recommendations: []
      }
    };
  }

  async validateAll() {
    console.log('🔍 Starting final content validation...\n');

    try {
      // Load and validate registry
      const registry = await this.loadRegistry();
      await this.validateRegistry(registry);

      // Validate all modules
      for (const module of registry.modules) {
        await this.validateModule(module);
      }

      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async loadRegistry() {
    try {
      const registryPath = path.join(__dirname, '..', 'content', 'registry.json');
      const registryData = await fs.readFile(registryPath, 'utf8');
      return JSON.parse(registryData);
    } catch (error) {
      this.addIssue('critical', 'registry-missing', 'Content registry not found or invalid');
      throw error;
    }
  }

  async validateRegistry(registry) {
    console.log('📋 Validating content registry...');

    // Check required fields
    const requiredFields = ['version', 'tiers', 'modules', 'globalSettings'];
    for (const field of requiredFields) {
      if (!registry[field]) {
        this.addIssue('critical', 'registry-field', `Missing required field: ${field}`);
      }
    }

    // Validate tier structure
    const requiredTiers = ['foundational', 'core', 'specialized', 'quality'];
    for (const tier of requiredTiers) {
      if (!registry.tiers[tier]) {
        this.addIssue('high', 'tier-missing', `Missing tier definition: ${tier}`);
      }
    }

    // Validate modules count
    this.results.totalModules = registry.modules?.length || 0;
    if (this.results.totalModules < 15) {
      this.addWarning('module-count', `Only ${this.results.totalModules} modules found (recommended: 18+)`);
    }

    console.log(`  ✅ Registry contains ${this.results.totalModules} modules\n`);
  }

  async validateModule(module) {
    console.log(`📚 Validating module: ${module.title}`);
    let moduleValid = true;

    // Check module structure
    const requiredModuleFields = ['slug', 'title', 'tier', 'description', 'routes', 'metadata'];
    for (const field of requiredModuleFields) {
      if (!module[field]) {
        this.addIssue('high', 'module-field', `Module ${module.slug}: Missing field ${field}`);
        moduleValid = false;
      }
    }

    // Validate lessons
    const lessonsValid = await this.validateModuleLessons(module);
    if (!lessonsValid) moduleValid = false;

    // Validate quizzes
    const quizzesValid = await this.validateModuleQuizzes(module);
    if (!quizzesValid) moduleValid = false;

    // Check thresholds
    await this.validateModuleThresholds(module);

    if (moduleValid) {
      this.results.validModules++;
      console.log(`  ✅ Module validation passed\n`);
    } else {
      console.log(`  ❌ Module validation failed\n`);
    }
  }

  async validateModuleLessons(module) {
    try {
      const lessonsPath = path.join(__dirname, '..', 'content', 'lessons', `${module.slug}.json`);
      const lessonsData = await fs.readFile(lessonsPath, 'utf8');
      const lessons = JSON.parse(lessonsData);

      this.results.totalLessons += lessons.length;

      // Check minimum lesson count
      const minLessons = module.metadata?.thresholds?.minLessons || 8;
      if (lessons.length < minLessons) {
        this.addIssue('medium', 'lesson-count', 
          `Module ${module.slug}: Only ${lessons.length} lessons (requires ${minLessons})`);
        return false;
      }

      // Validate each lesson
      let validLessons = 0;
      for (const lesson of lessons) {
        if (this.validateLessonStructure(lesson, module.slug)) {
          validLessons++;
        }
      }

      this.results.validLessons += validLessons;
      
      if (validLessons === lessons.length) {
        console.log(`    ✅ All ${lessons.length} lessons valid`);
        return true;
      } else {
        console.log(`    ⚠️  ${validLessons}/${lessons.length} lessons valid`);
        return false;
      }

    } catch (error) {
      this.addIssue('critical', 'lessons-missing', `Module ${module.slug}: Lessons file not found`);
      return false;
    }
  }

  validateLessonStructure(lesson, moduleSlug) {
    const requiredFields = ['id', 'title', 'objectives', 'intro', 'estimatedMinutes'];
    let valid = true;

    for (const field of requiredFields) {
      if (!lesson[field]) {
        this.addIssue('medium', 'lesson-field', 
          `Module ${moduleSlug}, Lesson ${lesson.id || 'unknown'}: Missing field ${field}`);
        valid = false;
      }
    }

    // Check content quality
    if (lesson.intro && lesson.intro.length < 200) {
      this.addWarning('lesson-content', 
        `Module ${moduleSlug}, Lesson ${lesson.id}: Content too short (${lesson.intro.length} chars)`);
    }

    // Check objectives count
    if (lesson.objectives && lesson.objectives.length < 2) {
      this.addWarning('lesson-objectives', 
        `Module ${moduleSlug}, Lesson ${lesson.id}: Should have at least 2 learning objectives`);
    }

    return valid;
  }

  async validateModuleQuizzes(module) {
    try {
      const quizzesPath = path.join(__dirname, '..', 'content', 'quizzes', `${module.slug}.json`);
      const quizzesData = await fs.readFile(quizzesPath, 'utf8');
      const quizContainer = JSON.parse(quizzesData);
      
      // Handle both array format and object with questions array
      const quizzes = Array.isArray(quizContainer) ? quizContainer : quizContainer.questions || [];

      this.results.totalQuizzes += quizzes.length;

      // Check minimum quiz question count
      const minQuestions = module.metadata?.thresholds?.minQuizQuestions || 15;
      if (quizzes.length < minQuestions) {
        this.addIssue('medium', 'quiz-count', 
          `Module ${module.slug}: Only ${quizzes.length} quiz questions (requires ${minQuestions})`);
        return false;
      }

      // Validate each quiz question
      let validQuizzes = 0;
      for (const quiz of quizzes) {
        if (this.validateQuizStructure(quiz, module.slug)) {
          validQuizzes++;
        }
      }

      this.results.validQuizzes += validQuizzes;

      if (validQuizzes === quizzes.length) {
        console.log(`    ✅ All ${quizzes.length} quiz questions valid`);
        return true;
      } else {
        console.log(`    ⚠️  ${validQuizzes}/${quizzes.length} quiz questions valid`);
        return false;
      }

    } catch (error) {
      this.addIssue('critical', 'quizzes-missing', `Module ${module.slug}: Quizzes file not found`);
      return false;
    }
  }

  validateQuizStructure(quiz, moduleSlug) {
    const requiredFields = ['id', 'question', 'choices', 'explanation'];
    let valid = true;

    for (const field of requiredFields) {
      if (!quiz[field]) {
        this.addIssue('medium', 'quiz-field', 
          `Module ${moduleSlug}, Quiz ${quiz.id || 'unknown'}: Missing field ${field}`);
        valid = false;
      }
    }

    // Check for either correctAnswer or correctIndex
    if (!quiz.correctAnswer && quiz.correctIndex === undefined) {
      this.addIssue('medium', 'quiz-correct', 
        `Module ${moduleSlug}, Quiz ${quiz.id || 'unknown'}: Missing correctAnswer or correctIndex`);
      valid = false;
    }

    // Check options count (use choices instead of options for this structure)
    if (quiz.choices && quiz.choices.length < 3) {
      this.addIssue('medium', 'quiz-options', 
        `Module ${moduleSlug}, Quiz ${quiz.id}: Should have at least 3 choices`);
      valid = false;
    }

    // Check correct answer validity
    if (quiz.choices && quiz.correctAnswer) {
      const correctIndex = quiz.choices.indexOf(quiz.correctAnswer);
      if (correctIndex === -1) {
        this.addIssue('high', 'quiz-correct-answer', 
          `Module ${moduleSlug}, Quiz ${quiz.id}: Correct answer not found in choices`);
        valid = false;
      }
    }

    // Check correctIndex validity
    if (quiz.choices && quiz.correctIndex !== undefined) {
      if (quiz.correctIndex < 0 || quiz.correctIndex >= quiz.choices.length) {
        this.addIssue('high', 'quiz-correct-index', 
          `Module ${moduleSlug}, Quiz ${quiz.id}: correctIndex out of range`);
        valid = false;
      }
    }

    // Check explanation quality
    if (quiz.explanation && quiz.explanation.length < 50) {
      this.addWarning('quiz-explanation', 
        `Module ${moduleSlug}, Quiz ${quiz.id}: Explanation too short`);
    }

    return valid;
  }

  async validateModuleThresholds(module) {
    const thresholds = module.metadata?.thresholds;
    if (!thresholds) {
      this.addWarning('module-thresholds', `Module ${module.slug}: Missing threshold configuration`);
      return;
    }

    // Check completion thresholds
    const requiredThresholds = ['passingScore', 'minLessons', 'minQuizQuestions'];
    for (const threshold of requiredThresholds) {
      if (thresholds[threshold] === undefined) {
        this.addWarning('threshold-missing', 
          `Module ${module.slug}: Missing threshold ${threshold}`);
      }
    }

    // Validate passing score
    if (thresholds.passingScore && (thresholds.passingScore < 60 || thresholds.passingScore > 100)) {
      this.addIssue('medium', 'passing-score', 
        `Module ${module.slug}: Invalid passing score ${thresholds.passingScore}% (should be 60-100%)`);
    }
  }

  addIssue(severity, type, message) {
    this.results.issues.push({
      severity,
      type,
      message,
      timestamp: new Date().toISOString()
    });

    if (severity === 'critical' || severity === 'high') {
      this.results.summary.criticalIssues++;
    }

    console.log(`    ❌ ${severity.toUpperCase()}: ${message}`);
  }

  addWarning(type, message) {
    this.results.warnings.push({
      type,
      message,
      timestamp: new Date().toISOString()
    });

    console.log(`    ⚠️  WARNING: ${message}`);
  }

  async generateFinalReport() {
    // Calculate compliance percentages
    const moduleCompliance = this.results.totalModules > 0 ? 
      (this.results.validModules / this.results.totalModules) * 100 : 0;
    
    const lessonCompliance = this.results.totalLessons > 0 ? 
      (this.results.validLessons / this.results.totalLessons) * 100 : 0;
    
    const quizCompliance = this.results.totalQuizzes > 0 ? 
      (this.results.validQuizzes / this.results.totalQuizzes) * 100 : 0;

    this.results.summary.overallCompliance = Math.round(
      (moduleCompliance + lessonCompliance + quizCompliance) / 3
    );

    // Determine production readiness
    this.results.summary.readyForProduction = 
      this.results.summary.criticalIssues === 0 && 
      this.results.summary.overallCompliance >= 90;

    // Generate recommendations
    this.generateRecommendations();

    // Save report
    await this.saveReport();

    // Display summary
    this.displaySummary();
  }

  generateRecommendations() {
    const recs = this.results.summary.recommendations;

    if (this.results.summary.criticalIssues > 0) {
      recs.push('🔴 Address all critical issues before production deployment');
    }

    if (this.results.summary.overallCompliance < 90) {
      recs.push('🟡 Improve content quality to reach 90%+ compliance');
    }

    if (this.results.issues.filter(i => i.type === 'lesson-count').length > 0) {
      recs.push('📚 Add more lessons to modules below threshold');
    }

    if (this.results.issues.filter(i => i.type === 'quiz-count').length > 0) {
      recs.push('❓ Add more quiz questions to meet minimum requirements');
    }

    if (this.results.warnings.length > 5) {
      recs.push('⚠️  Review and address content quality warnings');
    }

    if (this.results.totalModules < 18) {
      recs.push('📈 Consider adding more modules to reach target of 18+');
    }

    if (recs.length === 0) {
      recs.push('✅ Content quality meets all standards - ready for production!');
    }
  }

  async saveReport() {
    const reportPath = path.join(__dirname, '..', 'test-reports', `final-validation-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL CONTENT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Overall Compliance: ${this.results.summary.overallCompliance}%`);
    console.log(`🎯 Production Ready: ${this.results.summary.readyForProduction ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n📚 Modules: ${this.results.validModules}/${this.results.totalModules} valid`);
    console.log(`📖 Lessons: ${this.results.validLessons}/${this.results.totalLessons} valid`);
    console.log(`❓ Quizzes: ${this.results.validQuizzes}/${this.results.totalQuizzes} valid`);
    
    console.log(`\n🔴 Critical Issues: ${this.results.summary.criticalIssues}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    
    console.log('\n📋 Recommendations:');
    this.results.summary.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    if (this.results.summary.readyForProduction) {
      console.log('\n🎉 CONGRATULATIONS! Your Fullstack Academy platform is ready for production deployment!');
    } else {
      console.log('\n⚡ Please address the issues above before production deployment.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FinalContentValidator();
  validator.validateAll().catch(console.error);
}

module.exports = FinalContentValidator;