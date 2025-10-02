#!/usr/bin/env node

/**
 * DotNetQuiz Academy Content Audit Script
 * Analyzes content completeness across all 18 modules against design requirements
 */

const fs = require('fs');
const path = require('path');

// Load registry configuration
const registryPath = path.join(__dirname, '../content/registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// Content analysis results
const analysis = {
  modules: {},
  summary: {
    totalModules: 0,
    modulesWithSufficientLessons: 0,
    modulesWithSufficientQuestions: 0,
    totalLessons: 0,
    totalQuestions: 0,
    modulesMeetingThresholds: 0
  },
  issues: [],
  recommendations: []
};

/**
 * Analyze lesson content for a module
 */
function analyzeLessons(moduleSlug) {
  const lessonsPath = path.join(__dirname, `../content/lessons/${moduleSlug}.json`);
  
  if (!fs.existsSync(lessonsPath)) {
    return {
      exists: false,
      count: 0,
      lessons: [],
      issues: [`Missing lessons file: ${moduleSlug}.json`]
    };
  }

  try {
    const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
    const issues = [];

    // Validate lesson structure
    lessons.forEach((lesson, index) => {
      if (!lesson.id) issues.push(`Lesson ${index + 1}: Missing ID`);
      if (!lesson.title) issues.push(`Lesson ${index + 1}: Missing title`);
      if (!lesson.objectives || lesson.objectives.length < 2) {
        issues.push(`Lesson ${index + 1}: Needs at least 2 objectives`);
      }
      if (!lesson.intro || lesson.intro.length < 200) {
        issues.push(`Lesson ${index + 1}: Introduction too short (minimum 200 words)`);
      }
      if (!lesson.code || !lesson.code.example) {
        issues.push(`Lesson ${index + 1}: Missing code example`);
      }
      if (!lesson.exercises || lesson.exercises.length === 0) {
        issues.push(`Lesson ${index + 1}: Missing exercises`);
      }
    });

    return {
      exists: true,
      count: lessons.length,
      lessons: lessons,
      issues: issues
    };
  } catch (error) {
    return {
      exists: true,
      count: 0,
      lessons: [],
      issues: [`Error parsing lessons file: ${error.message}`]
    };
  }
}

/**
 * Analyze quiz content for a module
 */
function analyzeQuiz(moduleSlug) {
  const quizPath = path.join(__dirname, `../content/quizzes/${moduleSlug}.json`);
  
  if (!fs.existsSync(quizPath)) {
    return {
      exists: false,
      count: 0,
      questions: [],
      issues: [`Missing quiz file: ${moduleSlug}.json`]
    };
  }

  try {
    const quiz = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    const questions = quiz.questions || [];
    const issues = [];

    // Validate quiz structure
    if (!quiz.title) issues.push('Quiz missing title');
    if (!quiz.description) issues.push('Quiz missing description');
    if (quiz.totalQuestions !== questions.length) {
      issues.push(`totalQuestions (${quiz.totalQuestions}) doesn't match actual questions (${questions.length})`);
    }

    // Validate question structure
    questions.forEach((question, index) => {
      if (!question.id) issues.push(`Question ${index + 1}: Missing ID`);
      if (!question.question) issues.push(`Question ${index + 1}: Missing question text`);
      if (!question.choices || question.choices.length < 4) {
        issues.push(`Question ${index + 1}: Should have 4 choices`);
      }
      if (question.correctIndex === undefined) {
        issues.push(`Question ${index + 1}: Missing correct answer index`);
      }
      if (!question.explanation || question.explanation.length < 50) {
        issues.push(`Question ${index + 1}: Explanation too short`);
      }
      if (!question.industryContext) {
        issues.push(`Question ${index + 1}: Missing industry context`);
      }
    });

    return {
      exists: true,
      count: questions.length,
      questions: questions,
      issues: issues
    };
  } catch (error) {
    return {
      exists: true,
      count: 0,
      questions: [],
      issues: [`Error parsing quiz file: ${error.message}`]
    };
  }
}

/**
 * Analyze all modules
 */
function analyzeAllModules() {
  console.log('🔍 Starting DotNetQuiz Academy Content Audit...\n');

  registry.modules.forEach(module => {
    console.log(`📚 Analyzing module: ${module.title} (${module.slug})`);
    
    const lessonsAnalysis = analyzeLessons(module.slug);
    const quizAnalysis = analyzeQuiz(module.slug);
    
    const moduleAnalysis = {
      slug: module.slug,
      title: module.title,
      tier: module.tier,
      track: module.track,
      difficulty: module.difficulty,
      thresholds: module.thresholds,
      lessons: lessonsAnalysis,
      quiz: quizAnalysis,
      meetsThresholds: false,
      issues: [...lessonsAnalysis.issues, ...quizAnalysis.issues]
    };

    // Check if module meets thresholds
    const meetLessonThreshold = lessonsAnalysis.count >= module.thresholds.requiredLessons;
    const meetQuizThreshold = quizAnalysis.count >= module.thresholds.requiredQuestions;
    moduleAnalysis.meetsThresholds = meetLessonThreshold && meetQuizThreshold;

    if (!meetLessonThreshold) {
      moduleAnalysis.issues.push(`Insufficient lessons: ${lessonsAnalysis.count}/${module.thresholds.requiredLessons}`);
    }
    if (!meetQuizThreshold) {
      moduleAnalysis.issues.push(`Insufficient questions: ${quizAnalysis.count}/${module.thresholds.requiredQuestions}`);
    }

    analysis.modules[module.slug] = moduleAnalysis;
    
    // Update summary
    analysis.summary.totalModules++;
    analysis.summary.totalLessons += lessonsAnalysis.count;
    analysis.summary.totalQuestions += quizAnalysis.count;
    
    if (meetLessonThreshold) analysis.summary.modulesWithSufficientLessons++;
    if (meetQuizThreshold) analysis.summary.modulesWithSufficientQuestions++;
    if (moduleAnalysis.meetsThresholds) analysis.summary.modulesMeetingThresholds++;

    console.log(`  ✓ Lessons: ${lessonsAnalysis.count}/${module.thresholds.requiredLessons}`);
    console.log(`  ✓ Questions: ${quizAnalysis.count}/${module.thresholds.requiredQuestions}`);
    console.log(`  Status: ${moduleAnalysis.meetsThresholds ? '✅ Complete' : '❌ Needs work'}\n`);
  });
}

/**
 * Generate recommendations
 */
function generateRecommendations() {
  console.log('💡 Generating Recommendations...\n');

  const incompleteModules = Object.values(analysis.modules).filter(m => !m.meetsThresholds);
  
  if (incompleteModules.length > 0) {
    analysis.recommendations.push({
      priority: 'high',
      category: 'content-completion',
      title: 'Complete content for incomplete modules',
      description: `${incompleteModules.length} modules need additional content to meet thresholds`,
      modules: incompleteModules.map(m => m.slug)
    });
  }

  // Tier-specific recommendations
  const tierStats = {};
  Object.values(analysis.modules).forEach(module => {
    if (!tierStats[module.tier]) {
      tierStats[module.tier] = { total: 0, complete: 0 };
    }
    tierStats[module.tier].total++;
    if (module.meetsThresholds) tierStats[module.tier].complete++;
  });

  Object.entries(tierStats).forEach(([tier, stats]) => {
    if (stats.complete < stats.total) {
      analysis.recommendations.push({
        priority: 'medium',
        category: 'tier-completion',
        title: `Complete ${tier} tier modules`,
        description: `${stats.complete}/${stats.total} modules complete in ${tier} tier`,
        tier: tier
      });
    }
  });

  // Quality recommendations
  const modulesWithIssues = Object.values(analysis.modules).filter(m => m.issues.length > 0);
  if (modulesWithIssues.length > 0) {
    analysis.recommendations.push({
      priority: 'medium',
      category: 'content-quality',
      title: 'Address content quality issues',
      description: `${modulesWithIssues.length} modules have quality issues that need attention`,
      modules: modulesWithIssues.map(m => m.slug)
    });
  }
}

/**
 * Generate detailed report
 */
function generateReport() {
  const reportPath = path.join(__dirname, '../test-reports/content-audit-report.json');
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    version: registry.version,
    analysis,
    summary: {
      ...analysis.summary,
      completionRate: (analysis.summary.modulesMeetingThresholds / analysis.summary.totalModules * 100).toFixed(1),
      averageLessonsPerModule: (analysis.summary.totalLessons / analysis.summary.totalModules).toFixed(1),
      averageQuestionsPerModule: (analysis.summary.totalQuestions / analysis.summary.totalModules).toFixed(1)
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Content Audit Summary:');
  console.log(`  Total Modules: ${analysis.summary.totalModules}`);
  console.log(`  Complete Modules: ${analysis.summary.modulesMeetingThresholds}`);
  console.log(`  Completion Rate: ${report.summary.completionRate}%`);
  console.log(`  Total Lessons: ${analysis.summary.totalLessons}`);
  console.log(`  Total Questions: ${analysis.summary.totalQuestions}`);
  console.log(`  Avg Lessons/Module: ${report.summary.averageLessonsPerModule}`);
  console.log(`  Avg Questions/Module: ${report.summary.averageQuestionsPerModule}`);
  
  console.log('\n📋 Priority Recommendations:');
  analysis.recommendations
    .filter(r => r.priority === 'high')
    .forEach(rec => {
      console.log(`  🚨 ${rec.title}: ${rec.description}`);
    });

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run the audit
analyzeAllModules();
generateRecommendations();
const report = generateReport();

// Exit with error code if completion rate is below 80%
const completionRate = parseFloat(report.summary.completionRate);
if (completionRate < 80) {
  console.log(`\n⚠️  Warning: Content completion rate (${completionRate}%) is below target (80%)`);
  process.exit(1);
} else {
  console.log('\n✅ Content audit completed successfully!');
  process.exit(0);
}