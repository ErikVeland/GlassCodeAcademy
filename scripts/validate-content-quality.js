#!/usr/bin/env node

/**
 * Content Quality Validation Script
 * Validates code examples, content structure, and quality metrics across all modules
 */

const fs = require('fs');
const path = require('path');

class ContentValidator {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'dot-net-quiz', 'backend', 'Data');
        this.results = {
            modules: [],
            summary: {
                totalModules: 0,
                totalLessons: 0,
                totalQuestions: 0,
                codeExampleErrors: 0,
                structureErrors: 0,
                qualityIssues: 0
            }
        };
    }

    async validateAllModules() {
        console.log('🔍 Starting comprehensive content validation...\n');
        
        const moduleFiles = this.getModuleFiles();
        
        for (const moduleName of moduleFiles) {
            await this.validateModule(moduleName);
        }
        
        this.generateReport();
    }

    getModuleFiles() {
        const files = fs.readdirSync(this.dataDir);
        const modules = new Set();
        
        files.forEach(file => {
            if (file.endsWith('_lessons.json') || file.endsWith('_questions.json')) {
                const moduleName = file.replace(/_lessons\.json|_questions\.json/, '');
                modules.add(moduleName);
            }
        });
        
        return Array.from(modules);
    }

    async validateModule(moduleName) {
        console.log(`📚 Validating ${moduleName} module...`);
        
        const moduleResult = {
            name: moduleName,
            lessons: { count: 0, errors: [], quality: [] },
            questions: { count: 0, errors: [], quality: [] },
            codeExamples: { total: 0, errors: [], warnings: [] },
            recommendations: []
        };

        try {
            // Validate lessons
            const lessonsPath = path.join(this.dataDir, `${moduleName}_lessons.json`);
            if (fs.existsSync(lessonsPath)) {
                const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
                moduleResult.lessons = this.validateLessons(lessons);
            } else {
                moduleResult.lessons.errors.push('Lessons file not found');
            }

            // Validate questions
            const questionsPath = path.join(this.dataDir, `${moduleName}_questions.json`);
            if (fs.existsSync(questionsPath)) {
                const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
                moduleResult.questions = this.validateQuestions(questions);
            } else {
                moduleResult.questions.errors.push('Questions file not found');
            }

            // Generate recommendations
            moduleResult.recommendations = this.generateModuleRecommendations(moduleResult);

        } catch (error) {
            moduleResult.lessons.errors.push(`Validation error: ${error.message}`);
        }

        this.results.modules.push(moduleResult);
        this.updateSummary(moduleResult);
    }

    validateLessons(lessons) {
        const result = {
            count: lessons.length,
            errors: [],
            quality: [],
            topics: new Set(),
            codeExamples: { total: 0, errors: [], warnings: [] }
        };

        lessons.forEach((lesson, index) => {
            // Structure validation
            const requiredFields = ['id', 'title', 'description', 'codeExample', 'output'];
            for (const field of requiredFields) {
                if (!lesson[field]) {
                    result.errors.push(`Lesson ${index + 1}: Missing ${field}`);
                }
            }

            // Content quality validation
            if (lesson.description && lesson.description.length < 50) {
                result.quality.push(`Lesson ${index + 1}: Description too short (${lesson.description.length} chars)`);
            }

            if (lesson.title && lesson.title.length < 10) {
                result.quality.push(`Lesson ${index + 1}: Title too short`);
            }

            // Topic tracking
            if (lesson.topic) {
                result.topics.add(lesson.topic);
            }

            // Code example validation
            if (lesson.codeExample) {
                result.codeExamples.total++;
                this.validateCodeExample(lesson.codeExample, `Lesson ${index + 1}`, result.codeExamples);
            }
        });

        // Target validation
        if (result.count < 12) {
            result.quality.push(`Module has only ${result.count} lessons, target is 12-15`);
        } else if (result.count > 15) {
            result.quality.push(`Module has ${result.count} lessons, target is 12-15 (may be acceptable)`);
        }

        return result;
    }

    validateQuestions(questions) {
        const result = {
            count: questions.length,
            errors: [],
            quality: [],
            topics: new Set(),
            types: { 'multiple-choice': 0, 'open-ended': 0 },
            difficulty: { basic: 0, intermediate: 0, advanced: 0 }
        };

        questions.forEach((question, index) => {
            // Structure validation
            const requiredFields = ['id', 'question', 'explanation'];
            for (const field of requiredFields) {
                if (!question[field]) {
                    result.errors.push(`Question ${index + 1}: Missing ${field}`);
                }
            }

            // Multiple choice specific validation
            if (question.type === 'multiple-choice') {
                if (!question.choices || !Array.isArray(question.choices) || question.choices.length !== 4) {
                    result.errors.push(`Question ${index + 1}: Multiple choice must have exactly 4 choices`);
                }
                if (question.correctAnswer === undefined || question.correctAnswer === null) {
                    result.errors.push(`Question ${index + 1}: Missing correct answer index`);
                }
            }

            // Content quality validation
            if (question.explanation && question.explanation.length < 30) {
                result.quality.push(`Question ${index + 1}: Explanation too short`);
            }

            // Topic and type tracking
            if (question.topic) {
                result.topics.add(question.topic);
            }
            if (question.type) {
                result.types[question.type] = (result.types[question.type] || 0) + 1;
            }

            // Difficulty classification (heuristic)
            this.classifyQuestionDifficulty(question, result.difficulty);
        });

        // Target validation
        if (result.count < 15) {
            result.quality.push(`Module has only ${result.count} questions, target is 15-20`);
        } else if (result.count > 20) {
            result.quality.push(`Module has ${result.count} questions, target is 15-20 (may be acceptable)`);
        }

        return result;
    }

    validateCodeExample(code, context, codeResult) {
        // Basic syntax checks
        if (!code.trim()) {
            codeResult.errors.push(`${context}: Empty code example`);
            return;
        }

        // Language-specific validation
        if (code.includes('Console.WriteLine') || code.includes('using ')) {
            this.validateCSharpCode(code, context, codeResult);
        } else if (code.includes('SELECT') || code.includes('CREATE TABLE')) {
            this.validateSQLCode(code, context, codeResult);
        } else if (code.includes('function') || code.includes('const ') || code.includes('import ')) {
            this.validateJavaScriptCode(code, context, codeResult);
        } else if (code.includes('<?php') || code.includes('Route::')) {
            this.validatePHPCode(code, context, codeResult);
        }

        // General quality checks
        if (code.length > 2000) {
            codeResult.warnings.push(`${context}: Code example very long (${code.length} chars)`);
        }
        
        if (code.split('\n').length > 50) {
            codeResult.warnings.push(`${context}: Code example has many lines (${code.split('\n').length})`);
        }
    }

    validateCSharpCode(code, context, codeResult) {
        // Check for common C# syntax issues
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            codeResult.errors.push(`${context}: Unmatched braces in C# code`);
        }

        // Check for proper semicolons
        if (code.includes('Console.WriteLine') && !code.includes(';')) {
            codeResult.warnings.push(`${context}: Missing semicolons in C# code`);
        }
    }

    validateSQLCode(code, context, codeResult) {
        // Basic SQL validation
        if (code.includes('SELECT') && !code.includes('FROM')) {
            codeResult.warnings.push(`${context}: SELECT without FROM in SQL`);
        }
    }

    validateJavaScriptCode(code, context, codeResult) {
        // Check for balanced parentheses
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            codeResult.errors.push(`${context}: Unmatched parentheses in JavaScript code`);
        }
    }

    validatePHPCode(code, context, codeResult) {
        // Basic PHP validation
        if (code.includes('<?php') && !code.includes('?>') && code.split('\n').length === 1) {
            codeResult.warnings.push(`${context}: Single-line PHP code with opening tag`);
        }
    }

    classifyQuestionDifficulty(question, difficulty) {
        // Heuristic difficulty classification
        const text = (question.question + ' ' + (question.explanation || '')).toLowerCase();
        
        // Advanced indicators
        if (text.includes('advanced') || text.includes('complex') || text.includes('optimization') || 
            text.includes('performance') || text.includes('architecture') || text.includes('design pattern')) {
            difficulty.advanced++;
        }
        // Basic indicators
        else if (text.includes('basic') || text.includes('introduction') || text.includes('fundamental') ||
                 text.includes('what is') || text.includes('define') || text.includes('simple')) {
            difficulty.basic++;
        }
        // Everything else is intermediate
        else {
            difficulty.intermediate++;
        }
    }

    generateModuleRecommendations(moduleResult) {
        const recommendations = [];
        
        // Content quantity recommendations
        if (moduleResult.lessons.count < 12) {
            recommendations.push(`Add ${12 - moduleResult.lessons.count} more lessons to reach minimum target`);
        }
        if (moduleResult.questions.count < 15) {
            recommendations.push(`Add ${15 - moduleResult.questions.count} more questions to reach minimum target`);
        }

        // Quality recommendations
        if (moduleResult.lessons.quality.length > 0) {
            recommendations.push(`Address ${moduleResult.lessons.quality.length} lesson quality issues`);
        }
        if (moduleResult.questions.quality.length > 0) {
            recommendations.push(`Address ${moduleResult.questions.quality.length} question quality issues`);
        }

        // Code example recommendations
        if (moduleResult.lessons.codeExamples && moduleResult.lessons.codeExamples.errors.length > 0) {
            recommendations.push(`Fix ${moduleResult.lessons.codeExamples.errors.length} code example errors`);
        }

        return recommendations;
    }

    updateSummary(moduleResult) {
        this.results.summary.totalModules++;
        this.results.summary.totalLessons += moduleResult.lessons.count;
        this.results.summary.totalQuestions += moduleResult.questions.count;
        this.results.summary.codeExampleErrors += (moduleResult.lessons.codeExamples?.errors.length || 0);
        this.results.summary.structureErrors += moduleResult.lessons.errors.length + moduleResult.questions.errors.length;
        this.results.summary.qualityIssues += moduleResult.lessons.quality.length + moduleResult.questions.quality.length;
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 CONTENT VALIDATION REPORT');
        console.log('='.repeat(80));
        
        // Summary
        console.log('\n📈 SUMMARY:');
        console.log(`Total Modules: ${this.results.summary.totalModules}`);
        console.log(`Total Lessons: ${this.results.summary.totalLessons}`);
        console.log(`Total Questions: ${this.results.summary.totalQuestions}`);
        console.log(`Code Example Errors: ${this.results.summary.codeExampleErrors}`);
        console.log(`Structure Errors: ${this.results.summary.structureErrors}`);
        console.log(`Quality Issues: ${this.results.summary.qualityIssues}`);

        // Detailed module reports
        console.log('\n🔍 DETAILED MODULE ANALYSIS:');
        this.results.modules.forEach(module => {
            console.log(`\n📚 ${module.name.toUpperCase()}`);
            console.log(`   Lessons: ${module.lessons.count} | Questions: ${module.questions.count}`);
            
            if (module.lessons.errors.length > 0) {
                console.log(`   ❌ Lesson Errors: ${module.lessons.errors.join(', ')}`);
            }
            
            if (module.questions.errors.length > 0) {
                console.log(`   ❌ Question Errors: ${module.questions.errors.join(', ')}`);
            }
            
            if (module.recommendations.length > 0) {
                console.log(`   💡 Recommendations:`);
                module.recommendations.forEach(rec => {
                    console.log(`      • ${rec}`);
                });
            }
        });

        // Priority ranking
        console.log('\n🎯 PRIORITY RECOMMENDATIONS:');
        const priorityModules = this.results.modules
            .filter(m => m.lessons.count < 12 || m.questions.count < 15)
            .sort((a, b) => (a.lessons.count + a.questions.count) - (b.lessons.count + b.questions.count));

        priorityModules.forEach((module, index) => {
            const priority = index < 3 ? '🔴 CRITICAL' : index < 6 ? '🟡 HIGH' : '🟢 MEDIUM';
            console.log(`   ${priority}: ${module.name} (${module.lessons.count}L, ${module.questions.count}Q)`);
        });

        console.log('\n✅ Validation complete!');
    }
}

// Run validation
const validator = new ContentValidator();
validator.validateAllModules().catch(console.error);