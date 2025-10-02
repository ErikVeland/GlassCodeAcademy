#!/usr/bin/env node

/**
 * Content Quality Assurance Workflow
 * Automated quality checks and enhancement recommendations for all learning modules
 */

const fs = require('fs');
const path = require('path');

class ContentQualityAssurance {
    constructor() {
        this.contentDir = path.join(__dirname, '..', 'content');
        this.lessonsDir = path.join(this.contentDir, 'lessons');
        this.quizzesDir = path.join(this.contentDir, 'quizzes');
        this.registry = this.loadRegistry();
        this.qualityReport = {
            timestamp: new Date().toISOString(),
            totalModules: 0,
            passedModules: 0,
            failedModules: 0,
            issues: [],
            recommendations: []
        };
    }

    loadRegistry() {
        try {
            const registryPath = path.join(this.contentDir, 'registry.json');
            return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        } catch (error) {
            console.error('Failed to load registry:', error.message);
            return null;
        }
    }

    async runQualityAssurance() {
        console.log('🔍 Starting Content Quality Assurance workflow...\n');
        
        if (!this.registry) {
            console.error('❌ Cannot proceed without registry');
            return false;
        }

        for (const module of this.registry.modules) {
            await this.auditModule(module);
        }

        this.generateQualityReport();
        this.generateRecommendations();
        
        return this.qualityReport.failedModules === 0;
    }

    async auditModule(module) {
        console.log(`📚 Auditing module: ${module.slug}`);
        this.qualityReport.totalModules++;

        const moduleAudit = {
            slug: module.slug,
            title: module.title,
            tier: module.tier,
            passed: true,
            issues: [],
            scores: {
                content: 0,
                structure: 0,
                quality: 0,
                completeness: 0
            }
        };

        // Audit lessons
        const lessonsAudit = await this.auditLessons(module);
        moduleAudit.scores.content = lessonsAudit.score;
        moduleAudit.issues.push(...lessonsAudit.issues);

        // Audit quiz
        const quizAudit = await this.auditQuiz(module);
        moduleAudit.scores.structure = quizAudit.score;
        moduleAudit.issues.push(...quizAudit.issues);

        // Calculate overall scores
        const overallScore = (
            moduleAudit.scores.content +
            moduleAudit.scores.structure +
            moduleAudit.scores.quality +
            moduleAudit.scores.completeness
        ) / 4;

        moduleAudit.passed = overallScore >= 75 && moduleAudit.issues.length === 0;
        
        if (moduleAudit.passed) {
            this.qualityReport.passedModules++;
            console.log(`  ✅ Passed (Score: ${Math.round(overallScore)}%)`);
        } else {
            this.qualityReport.failedModules++;
            console.log(`  ❌ Failed (Score: ${Math.round(overallScore)}%, Issues: ${moduleAudit.issues.length})`);
        }

        this.qualityReport.issues.push(moduleAudit);
    }

    async auditLessons(module) {
        const lessonsPath = path.join(this.lessonsDir, `${module.slug}.json`);
        const audit = { score: 0, issues: [] };

        if (!fs.existsSync(lessonsPath)) {
            audit.issues.push(`Missing lessons file`);
            return audit;
        }

        try {
            const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
            
            // Check lesson count
            const requiredLessons = module.thresholds?.requiredLessons || 12;
            if (lessons.length < requiredLessons) {
                audit.issues.push(`Insufficient lessons: ${lessons.length}/${requiredLessons}`);
            }

            // Check lesson quality
            let qualityScore = 0;
            for (const lesson of lessons) {
                qualityScore += this.assessLessonQuality(lesson);
            }
            audit.score = lessons.length > 0 ? qualityScore / lessons.length : 0;

        } catch (error) {
            audit.issues.push(`Invalid lessons JSON: ${error.message}`);
        }

        return audit;
    }

    assessLessonQuality(lesson) {
        let score = 100;

        // Check required fields
        const requiredFields = ['id', 'title', 'objectives', 'intro', 'code', 'difficulty'];
        for (const field of requiredFields) {
            if (!lesson[field]) {
                score -= 15;
            }
        }

        // Check intro length (should be substantial)
        if (lesson.intro && lesson.intro.split(' ').length < 50) {
            score -= 10;
        }

        // Check code examples
        if (lesson.code && (!lesson.code.example || !lesson.code.explanation)) {
            score -= 15;
        }

        // Check objectives count
        if (!lesson.objectives || lesson.objectives.length < 2) {
            score -= 10;
        }

        return Math.max(0, score);
    }

    async auditQuiz(module) {
        const quizPath = path.join(this.quizzesDir, `${module.slug}.json`);
        const audit = { score: 0, issues: [] };

        if (!fs.existsSync(quizPath)) {
            audit.issues.push(`Missing quiz file`);
            return audit;
        }

        try {
            const quiz = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
            
            // Check question count
            const requiredQuestions = module.thresholds?.requiredQuestions || 15;
            if (quiz.questions.length < requiredQuestions) {
                audit.issues.push(`Insufficient questions: ${quiz.questions.length}/${requiredQuestions}`);
            }

            // Check quiz structure
            if (!quiz.totalQuestions || !quiz.passingScore || !quiz.timeLimit) {
                audit.issues.push(`Missing quiz metadata`);
            }

            // Calculate quality score
            audit.score = this.assessQuizQuality(quiz);

        } catch (error) {
            audit.issues.push(`Invalid quiz JSON: ${error.message}`);
        }

        return audit;
    }

    assessQuizQuality(quiz) {
        let score = 100;

        if (!quiz.questions || quiz.questions.length === 0) {
            return 0;
        }

        for (const question of quiz.questions) {
            // Check required question fields
            const requiredFields = ['id', 'question', 'topic', 'difficulty', 'explanation'];
            for (const field of requiredFields) {
                if (!question[field]) {
                    score -= 5;
                }
            }

            // Check multiple choice questions have choices
            if (question.questionType === 'multiple-choice' && (!question.choices || question.choices.length < 2)) {
                score -= 10;
            }
        }

        return Math.max(0, score);
    }

    generateQualityReport() {
        console.log('\n==================================================');
        console.log('📊 CONTENT QUALITY ASSURANCE REPORT');
        console.log('==================================================\n');

        console.log(`📈 Overall Statistics:`);
        console.log(`   Total Modules: ${this.qualityReport.totalModules}`);
        console.log(`   ✅ Passed: ${this.qualityReport.passedModules}`);
        console.log(`   ❌ Failed: ${this.qualityReport.failedModules}`);
        console.log(`   📊 Success Rate: ${Math.round((this.qualityReport.passedModules / this.qualityReport.totalModules) * 100)}%\n`);

        // Show failed modules
        const failedModules = this.qualityReport.issues.filter(m => !m.passed);
        if (failedModules.length > 0) {
            console.log(`❌ Failed Modules (${failedModules.length}):`);
            failedModules.forEach(module => {
                console.log(`   ${module.slug}:`);
                module.issues.forEach(issue => {
                    console.log(`     - ${issue}`);
                });
            });
            console.log('');
        }

        // Save detailed report
        const reportPath = path.join(__dirname, '..', 'QUALITY_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.qualityReport, null, 2));
        console.log(`📄 Detailed report saved to: QUALITY_REPORT.json\n`);
    }

    generateRecommendations() {
        console.log('💡 Quality Improvement Recommendations:\n');

        const recommendations = [
            {
                priority: 'High',
                category: 'Content Completeness',
                action: 'Add missing lessons and quiz questions to meet threshold requirements',
                impact: 'Critical for module completion'
            },
            {
                priority: 'Medium',
                category: 'Content Quality',
                action: 'Expand lesson introductions to be more comprehensive (50+ words)',
                impact: 'Improves learning experience'
            },
            {
                priority: 'Medium',
                category: 'Code Examples',
                action: 'Ensure all lessons have working code examples with explanations',
                impact: 'Essential for practical learning'
            },
            {
                priority: 'Low',
                category: 'Assessment Quality',
                action: 'Add more diverse question types and difficulty levels',
                impact: 'Better skill assessment'
            }
        ];

        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority}] ${rec.category}`);
            console.log(`   Action: ${rec.action}`);
            console.log(`   Impact: ${rec.impact}\n`);
        });
    }
}

// Run QA workflow if called directly
if (require.main === module) {
    const qa = new ContentQualityAssurance();
    qa.runQualityAssurance().then(success => {
        if (success) {
            console.log('🎉 Content Quality Assurance completed successfully!');
            process.exit(0);
        } else {
            console.log('⚠️  Content Quality Assurance found issues that need attention.');
            process.exit(1);
        }
    }).catch(error => {
        console.error('💥 QA workflow failed:', error.message);
        process.exit(1);
    });
}

module.exports = ContentQualityAssurance;