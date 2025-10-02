#!/usr/bin/env node

/**
 * Module Testing Script
 * Simple module testing to verify basic functionality
 */

const fs = require('fs');
const path = require('path');

class ModuleTester {
  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
    this.errors = [];
    this.warnings = [];
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

  // Load and validate registry
  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      this.addError('Content registry not found', { path: registryPath });
      return null;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      const registry = JSON.parse(registryContent);
      this.addInfo(`Loaded content registry with ${registry.modules.length} modules`);
      return registry;
    } catch (error) {
      this.addError('Failed to parse content registry', { error: error.message });
      return null;
    }
  }

  // Test module content files
  testModuleContent(module) {
    const context = { moduleSlug: module.slug };
    
    // Test lessons file
    const lessonsPath = path.join(this.lessonsDir, `${module.slug}.json`);
    if (!fs.existsSync(lessonsPath)) {
      this.addError(`Missing lessons file for module`, context);
    } else {
      try {
        const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
        const lessons = JSON.parse(lessonsContent);
        
        if (!Array.isArray(lessons)) {
          this.addError(`Lessons file must contain an array`, context);
        } else {
          this.addInfo(`Module ${module.slug} has ${lessons.length} lessons`);
          
          // Check lesson structure
          lessons.forEach((lesson, index) => {
            if (!lesson.id) {
              this.addError(`Lesson missing id`, { ...context, lessonIndex: index });
            }
            if (!lesson.title) {
              this.addError(`Lesson missing title`, { ...context, lessonIndex: index });
            }
            if (!lesson.order) {
              this.addError(`Lesson missing order`, { ...context, lessonIndex: index });
            }
          });
        }
      } catch (error) {
        this.addError(`Failed to parse lessons file`, { ...context, error: error.message });
      }
    }
    
    // Test quiz file
    const quizPath = path.join(this.quizzesDir, `${module.slug}.json`);
    if (!fs.existsSync(quizPath)) {
      this.addError(`Missing quiz file for module`, context);
    } else {
      try {
        const quizContent = fs.readFileSync(quizPath, 'utf8');
        const quiz = JSON.parse(quizContent);
        
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
          this.addError(`Quiz must have questions array`, context);
        } else {
          this.addInfo(`Module ${module.slug} has ${quiz.questions.length} quiz questions`);
          
          // Check question structure
          quiz.questions.forEach((question, index) => {
            if (!question.question) {
              this.addError(`Question missing question text`, { ...context, questionIndex: index });
            }
            if (!question.choices || !Array.isArray(question.choices)) {
              this.addError(`Question missing choices array`, { ...context, questionIndex: index });
            }
            if (question.correctIndex === undefined && question.correctAnswer === undefined) {
              this.addError(`Question missing correct answer`, { ...context, questionIndex: index });
            }
          });
        }
      } catch (error) {
        this.addError(`Failed to parse quiz file`, { ...context, error: error.message });
      }
    }
  }

  // Run comprehensive module tests
  async run() {
    console.log('🧪 Starting module testing...\n');
    
    const registry = this.loadRegistry();
    if (!registry) {
      return this.exitWithResults();
    }
    
    this.addInfo('Testing all modules...');
    
    for (const module of registry.modules) {
      this.testModuleContent(module);
    }
    
    return this.exitWithResults();
  }
  
  exitWithResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MODULE TESTING RESULTS');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All modules passed testing!');
      process.exit(0);
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings found:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`);
        if (warning.context) {
          console.log(`      Context: ${JSON.stringify(warning.context)}`);
        }
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ${this.errors.length} errors found:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
        if (error.context) {
          console.log(`      Context: ${JSON.stringify(error.context)}`);
        }
      });
      
      console.log('\n💥 Module testing failed. Fix errors before proceeding.');
      process.exit(1);
    }
    
    console.log('\n✨ Module testing completed successfully.');
    process.exit(0);
  }
}

// CLI execution
if (require.main === module) {
  const tester = new ModuleTester();
  tester.run().catch(error => {
    console.error('💥 Module testing failed with unexpected error:', error);
    process.exit(1);
  });
}

module.exports = ModuleTester;