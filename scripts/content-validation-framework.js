#!/usr/bin/env node

/**
 * Content Validation Framework
 * Automated content validation with quality gates for DotNetQuiz Academy
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Content schemas
const lessonSchema = {
  type: 'object',
  required: ['title', 'moduleSlug', 'order', 'objectives', 'intro', 'code', 'pitfalls', 'exercises'],
  properties: {
    id: { type: 'string', minLength: 1 },
    moduleSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    title: { type: 'string', minLength: 5 },
    order: { type: 'integer', minimum: 1 },
    objectives: {
      type: 'array',
      items: { type: 'string', minLength: 5 },
      minItems: 1
    },
    intro: { type: 'string', minLength: 50 },
    code: {
      type: 'object',
      required: ['example', 'explanation', 'language'],
      properties: {
        example: { type: 'string', minLength: 10 },
        explanation: { type: 'string', minLength: 20 },
        language: { type: 'string' }
      }
    },
    pitfalls: {
      type: 'array',
      items: {
        type: 'object',
        required: ['mistake', 'solution', 'severity'],
        properties: {
          mistake: { type: 'string', minLength: 5 },
          solution: { type: 'string', minLength: 5 },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
        }
      }
    },
    exercises: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'description', 'checkpoints'],
        properties: {
          title: { type: 'string', minLength: 5 },
          description: { type: 'string', minLength: 10 },
          checkpoints: {
            type: 'array',
            items: { type: 'string', minLength: 5 },
            minItems: 1
          }
        }
      }
    }
  }
};

const quizSchema = {
  type: 'object',
  required: ['moduleSlug', 'title', 'questions'],
  properties: {
    moduleSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    title: { type: 'string', minLength: 5 },
    description: { type: 'string', minLength: 10 },
    totalQuestions: { type: 'integer', minimum: 1 },
    passingScore: { type: 'integer', minimum: 0, maximum: 100 },
    timeLimit: { type: 'integer', minimum: 1 },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'question', 'topic', 'difficulty', 'choices', 'correctIndex', 'explanation', 'industryContext', 'tags', 'questionType'],
        properties: {
          id: { type: 'string', minLength: 1 },
          question: { type: 'string', minLength: 10 },
          topic: { type: 'string', minLength: 1 },
          difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
          choices: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            minItems: 2,
            maxItems: 5
          },
          correctIndex: { type: 'integer', minimum: 0 },
          explanation: { type: 'string', minLength: 20 },
          industryContext: { type: 'string', minLength: 10 },
          tags: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          },
          questionType: { type: 'string', enum: ['multiple-choice', 'open-ended'] },
          estimatedTime: { type: 'integer', minimum: 1 }
        }
      },
      minItems: 10
    }
  }
};

// Quality gates configuration
const QUALITY_GATES = {
  lesson: {
    minIntroLength: 100,
    minObjectives: 2,
    minPitfalls: 1,
    minExercises: 1,
    requiredSections: ['title', 'intro', 'code', 'pitfalls', 'exercises', 'objectives']
  },
  quiz: {
    minQuestions: 15,
    maxQuestions: 30,
    requiredQuestionTypes: ['multiple-choice', 'open-ended'],
    minExplanationLength: 50
  }
};

class ContentValidationFramework {
  constructor() {
    this.results = {
      lessons: {},
      quizzes: {},
      summary: {
        totalLessons: 0,
        validLessons: 0,
        totalQuizzes: 0,
        validQuizzes: 0,
        errors: [],
        warnings: []
      }
    };
  }

  async run() {
    console.log('🚀 Starting content validation framework...\n');
    
    // Validate lessons
    await this.validateLessons();
    
    // Validate quizzes
    await this.validateQuizzes();
    
    // Generate report
    await this.generateReport();
    
    // Check quality gates
    const qualityGatePassed = this.checkQualityGates();
    
    console.log('\n✅ Content validation framework completed!');
    
    if (qualityGatePassed) {
      console.log('🎉 All quality gates passed!');
      process.exit(0);
    } else {
      console.log('❌ Some quality gates failed. Check the report for details.');
      process.exit(1);
    }
  }

  async validateLessons() {
    const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
    const lessonFiles = await fs.readdir(lessonsDir);
    
    console.log('📚 Validating lessons...');
    
    for (const file of lessonFiles) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(lessonsDir, file);
        const moduleName = path.basename(file, '.json');
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lessonsArray = JSON.parse(content);
          
          // Validate each lesson in the array
          let moduleValid = true;
          const moduleErrors = [];
          const moduleWarnings = [];
          
          for (let i = 0; i < lessonsArray.length; i++) {
            const lesson = lessonsArray[i];
            
            // Validate against schema
            const validate = ajv.compile(lessonSchema);
            const valid = validate(lesson);
            
            if (!valid) {
              moduleValid = false;
              moduleErrors.push(...validate.errors.map(e => `Lesson ${moduleName}[${i}]: ${e.message}`));
            }
            
            moduleWarnings.push(...this.checkLessonQuality(lesson));
          }
          
          this.results.lessons[moduleName] = {
            valid: moduleValid,
            errors: moduleErrors,
            warnings: moduleWarnings
          };
          
          if (moduleValid) {
            this.results.summary.validLessons++;
            console.log(`  ✅ ${moduleName}`);
          } else {
            console.log(`  ❌ ${moduleName}`);
            this.results.summary.errors.push(...moduleErrors);
          }
        } catch (error) {
          console.log(`  ❌ ${moduleName} (parse error)`);
          this.results.lessons[moduleName] = {
            valid: false,
            errors: [error.message],
            warnings: []
          };
          this.results.summary.errors.push(`Lesson ${moduleName}: ${error.message}`);
        }
        
        this.results.summary.totalLessons++;
      }
    }
  }

  async validateQuizzes() {
    const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
    const quizFiles = await fs.readdir(quizzesDir);
    
    console.log('\n📝 Validating quizzes...');
    
    for (const file of quizFiles) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(quizzesDir, file);
        const moduleName = path.basename(file, '.json');
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const quiz = JSON.parse(content);
          
          // Validate against schema
          const validate = ajv.compile(quizSchema);
          const valid = validate(quiz);
          
          this.results.quizzes[moduleName] = {
            valid: valid,
            errors: valid ? [] : validate.errors,
            warnings: this.checkQuizQuality(quiz)
          };
          
          if (valid) {
            this.results.summary.validQuizzes++;
            console.log(`  ✅ ${moduleName}`);
          } else {
            console.log(`  ❌ ${moduleName}`);
            this.results.summary.errors.push(...validate.errors.map(e => `Quiz ${moduleName}: ${e.message}`));
          }
        } catch (error) {
          console.log(`  ❌ ${moduleName} (parse error)`);
          this.results.quizzes[moduleName] = {
            valid: false,
            errors: [error.message],
            warnings: []
          };
          this.results.summary.errors.push(`Quiz ${moduleName}: ${error.message}`);
        }
        
        this.results.summary.totalQuizzes++;
      }
    }
  }

  checkLessonQuality(lesson) {
    const warnings = [];
    const gates = QUALITY_GATES.lesson;
    
    // Check intro length
    if (lesson.intro && lesson.intro.length < gates.minIntroLength) {
      warnings.push(`Intro length (${lesson.intro.length}) below minimum (${gates.minIntroLength})`);
    }
    
    // Check objectives count
    if (lesson.objectives && lesson.objectives.length < gates.minObjectives) {
      warnings.push(`Objectives count (${lesson.objectives.length}) below minimum (${gates.minObjectives})`);
    }
    
    // Check pitfalls count
    if (lesson.pitfalls && lesson.pitfalls.length < gates.minPitfalls) {
      warnings.push(`Pitfalls count (${lesson.pitfalls.length}) below minimum (${gates.minPitfalls})`);
    }
    
    // Check exercises count
    if (lesson.exercises && lesson.exercises.length < gates.minExercises) {
      warnings.push(`Exercises count (${lesson.exercises.length}) below minimum (${gates.minExercises})`);
    }
    
    return warnings;
  }

  checkQuizQuality(quiz) {
    const warnings = [];
    const gates = QUALITY_GATES.quiz;
    
    // Check questions count
    if (quiz.questions && quiz.questions.length < gates.minQuestions) {
      warnings.push(`Questions count (${quiz.questions.length}) below minimum (${gates.minQuestions})`);
    }
    
    if (quiz.questions && quiz.questions.length > gates.maxQuestions) {
      warnings.push(`Questions count (${quiz.questions.length}) above maximum (${gates.maxQuestions})`);
    }
    
    // Check question types
    if (quiz.questions) {
      const questionTypes = [...new Set(quiz.questions.map(q => q.questionType))];
      const missingTypes = gates.requiredQuestionTypes.filter(type => !questionTypes.includes(type));
      if (missingTypes.length > 0) {
        warnings.push(`Missing required question types: ${missingTypes.join(', ')}`);
      }
    }
    
    return warnings;
  }

  checkQualityGates() {
    console.log('\n🔒 Checking quality gates...');
    
    let passed = true;
    
    // Check overall validation
    if (this.results.summary.validLessons !== this.results.summary.totalLessons) {
      console.log(`  ❌ Not all lessons are valid (${this.results.summary.validLessons}/${this.results.summary.totalLessons})`);
      passed = false;
    } else {
      console.log(`  ✅ All lessons are valid (${this.results.summary.validLessons}/${this.results.summary.totalLessons})`);
    }
    
    if (this.results.summary.validQuizzes !== this.results.summary.totalQuizzes) {
      console.log(`  ❌ Not all quizzes are valid (${this.results.summary.validQuizzes}/${this.results.summary.totalQuizzes})`);
      passed = false;
    } else {
      console.log(`  ✅ All quizzes are valid (${this.results.summary.validQuizzes}/${this.results.summary.totalQuizzes})`);
    }
    
    // Check for errors
    if (this.results.summary.errors.length > 0) {
      console.log(`  ❌ Found ${this.results.summary.errors.length} validation errors`);
      passed = false;
    } else {
      console.log(`  ✅ No validation errors found`);
    }
    
    return passed;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      qualityGates: {
        passed: this.checkQualityGates(),
        configuration: QUALITY_GATES
      }
    };

    const reportDir = path.join(__dirname, '..', 'test-reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'content-validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Validation report saved to: ${reportPath}`);
    
    // Generate HTML report
    await this.generateHtmlReport(report);
  }

  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; }
        .summary-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .valid { color: #22c55e; }
        .invalid { color: #ef4444; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 1.5em; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #eee; }
        .module-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .module-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .module-name { font-weight: bold; font-size: 1.1em; }
        .module-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        .status-valid { background: #dcfce7; color: #166534; }
        .status-invalid { background: #fee2e2; color: #991b1b; }
        .issues { margin-top: 10px; }
        .issue { margin-bottom: 5px; padding: 5px; background: #fffbeb; border-left: 3px solid #f59e0b; font-size: 0.9em; }
        .warnings { margin-top: 10px; }
        .warning { margin-bottom: 5px; padding: 5px; background: #eff6ff; border-left: 3px solid #3b82f6; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Content Validation Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div>Total Lessons</div>
                <div class="summary-value">${report.results.summary.totalLessons}</div>
            </div>
            <div class="summary-card">
                <div>Valid Lessons</div>
                <div class="summary-value valid">${report.results.summary.validLessons}</div>
            </div>
            <div class="summary-card">
                <div>Total Quizzes</div>
                <div class="summary-value">${report.results.summary.totalQuizzes}</div>
            </div>
            <div class="summary-card">
                <div>Valid Quizzes</div>
                <div class="summary-value valid">${report.results.summary.validQuizzes}</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Lesson Validation Results</h2>
            <div class="module-list">
                ${Object.entries(report.results.lessons).map(([name, result]) => `
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-name">${name}</div>
                            <div class="module-status ${result.valid ? 'status-valid' : 'status-invalid'}">
                                ${result.valid ? 'VALID' : 'INVALID'}
                            </div>
                        </div>
                        ${result.errors.length > 0 ? `
                            <div class="issues">
                                <strong>Errors:</strong>
                                ${result.errors.map(error => `<div class="issue">${error.message || error}</div>`).join('')}
                            </div>
                        ` : ''}
                        ${result.warnings.length > 0 ? `
                            <div class="warnings">
                                <strong>Warnings:</strong>
                                ${result.warnings.map(warning => `<div class="warning">${warning}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Quiz Validation Results</h2>
            <div class="module-list">
                ${Object.entries(report.results.quizzes).map(([name, result]) => `
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-name">${name}</div>
                            <div class="module-status ${result.valid ? 'status-valid' : 'status-invalid'}">
                                ${result.valid ? 'VALID' : 'INVALID'}
                            </div>
                        </div>
                        ${result.errors.length > 0 ? `
                            <div class="issues">
                                <strong>Errors:</strong>
                                ${result.errors.map(error => `<div class="issue">${error.message || error}</div>`).join('')}
                            </div>
                        ` : ''}
                        ${result.warnings.length > 0 ? `
                            <div class="warnings">
                                <strong>Warnings:</strong>
                                ${result.warnings.map(warning => `<div class="warning">${warning}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, '..', 'test-reports', 'content-validation-report.html');
    await fs.writeFile(htmlPath, html);
    console.log(`📋 HTML report saved to: ${htmlPath}`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ContentValidationFramework();
  validator.run().catch(console.error);
}

module.exports = ContentValidationFramework;