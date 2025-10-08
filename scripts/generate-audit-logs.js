#!/usr/bin/env node

/**
 * Generate Audit Logs for Each Module
 * Creates comprehensive audit logs with sources, validation results, and module statistics
 */

const fs = require('fs');
const path = require('path');

// Load all the reports we have
function loadReports() {
  const reports = {};
  
  // Load final validation report
  try {
    const validationFiles = fs.readdirSync(path.join(__dirname, '..', 'test-reports'))
      .filter(file => file.startsWith('final-validation') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (validationFiles.length > 0) {
      const latestValidation = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'test-reports', validationFiles[0]), 'utf8')
      );
      reports.validation = latestValidation;
    }
  } catch (error) {
    console.warn('Could not load validation report:', error.message);
  }
  
  // Load accessibility report
  try {
    const accessibilityReport = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test-reports', 'accessibility-report.json'), 'utf8')
    );
    reports.accessibility = accessibilityReport;
  } catch (error) {
    console.warn('Could not load accessibility report:', error.message);
  }
  
  // Load quiz randomness report
  try {
    const randomnessReport = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test-reports', 'quiz-randomness-report.json'), 'utf8')
    );
    reports.randomness = randomnessReport;
  } catch (error) {
    console.warn('Could not load randomness report:', error.message);
  }
  
  return reports;
}

// Generate audit log for a specific module
function generateModuleAuditLog(module, reports, registry) {
  const auditLog = {
    moduleSlug: module.slug,
    title: module.title,
    tier: module.tier,
    track: module.track,
    timestamp: new Date().toISOString(),
    content: {
      lessons: {
        required: module.thresholds.requiredLessons,
        actual: 0,
        status: 'unknown'
      },
      quizzes: {
        required: module.thresholds.requiredQuestions,
        actual: 0,
        status: 'unknown'
      }
      },
    validation: {
      issues: [],
      warnings: []
    },
    accessibility: {
      issues: 0,
      severity: 'unknown'
    },
    quizAnalysis: {
      totalQuestions: 0,
      difficultyDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
      targetDistribution: { beginner: 6, intermediate: 10, advanced: 4 },
      topicsCovered: 0,
      duplicationRate: 0
    },
    sources: [],
    routes: module.routes || {}
  };
  
  // Add content counts
  try {
    // Check lessons file
    const lessonsPath = path.join(__dirname, '..', 'content', 'lessons', `${module.slug}.json`);
    if (fs.existsSync(lessonsPath)) {
      const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
      const lessons = JSON.parse(lessonsContent);
      auditLog.content.lessons.actual = Array.isArray(lessons) ? lessons.length : 0;
      auditLog.content.lessons.status = auditLog.content.lessons.actual >= auditLog.content.lessons.required ? 'complete' : 'incomplete';
    }
    
    // Check quiz file
    const quizPath = path.join(__dirname, '..', 'content', 'quizzes', `${module.slug}.json`);
    if (fs.existsSync(quizPath)) {
      const quizContent = fs.readFileSync(quizPath, 'utf8');
      const quiz = JSON.parse(quizContent);
      const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
      auditLog.content.quizzes.actual = questions.length;
      auditLog.content.quizzes.status = auditLog.content.quizzes.actual >= auditLog.content.quizzes.required ? 'complete' : 'incomplete';
    }
  } catch (error) {
    console.warn(`Error counting content for ${module.slug}:`, error.message);
  }
  
  // Add validation issues
  if (reports.validation) {
    const moduleIssues = reports.validation.issues.filter(issue => 
      issue.message.includes(module.slug)
    );
    auditLog.validation.issues = moduleIssues;
    
    const moduleWarnings = reports.validation.warnings.filter(warning => 
      warning.message.includes(module.slug)
    );
    auditLog.validation.warnings = moduleWarnings;
  }
  
  // Add accessibility info
  if (reports.accessibility) {
    auditLog.accessibility.issues = reports.accessibility.summary.totalIssues;
    auditLog.accessibility.severity = reports.accessibility.summary.totalIssues === 0 ? 'compliant' : 'non-compliant';
  }
  
  // Add quiz analysis
  if (reports.randomness) {
    const moduleAnalysis = reports.randomness.modules.find(m => m.module === module.slug);
    if (moduleAnalysis) {
      auditLog.quizAnalysis = {
        totalQuestions: moduleAnalysis.totalQuestions,
        difficultyDistribution: moduleAnalysis.avgDistribution,
        targetDistribution: moduleAnalysis.targetDistribution,
        topicsCovered: moduleAnalysis.topicsCovered,
        duplicationRate: moduleAnalysis.duplicationRate
      };
    }
  }
  
  // Extract sources from lessons
  try {
    const lessonsPath = path.join(__dirname, '..', 'content', 'lessons', `${module.slug}.json`);
    if (fs.existsSync(lessonsPath)) {
      const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
      const lessons = JSON.parse(lessonsContent);
      const lessonsArray = Array.isArray(lessons) ? lessons : [lessons];
      
      const sources = new Set();
      lessonsArray.forEach(lesson => {
        if (lesson.sources && Array.isArray(lesson.sources)) {
          lesson.sources.forEach(source => {
            if (source.url) {
              sources.add(source.url);
            }
          });
        }
      });
      
      auditLog.sources = Array.from(sources).map(url => ({ url }));
    }
  } catch (error) {
    console.warn(`Error extracting sources for ${module.slug}:`, error.message);
  }
  
  return auditLog;
}

// Generate audit logs for all modules
function generateAllAuditLogs() {
  console.log('📝 Generating audit logs for all modules...\n');
  
  // Load registry
  const registryPath = path.join(__dirname, '..', 'content', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  
  // Load reports
  const reports = loadReports();
  
  // Create audit logs directory
  const auditLogsDir = path.join(__dirname, '..', 'audit-logs');
  if (!fs.existsSync(auditLogsDir)) {
    fs.mkdirSync(auditLogsDir);
  }
  
  // Generate audit log for each module
  const allAuditLogs = [];
  
  registry.modules.forEach(module => {
    console.log(`📄 Generating audit log for ${module.slug}...`);
    
    const auditLog = generateModuleAuditLog(module, reports, registry);
    allAuditLogs.push(auditLog);
    
    // Save individual audit log
    const auditLogPath = path.join(auditLogsDir, `${module.slug}-audit.json`);
    fs.writeFileSync(auditLogPath, JSON.stringify(auditLog, null, 2));
    console.log(`  ✅ Saved to ${auditLogPath}`);
  });
  
  // Generate summary report
  generateSummaryReport(allAuditLogs, reports);
  
  console.log('\n✅ All audit logs generated successfully!');
}

// Generate summary report
function generateSummaryReport(auditLogs, reports) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MODULE AUDIT SUMMARY REPORT');
  console.log('='.repeat(60));
  
  // Overall statistics
  const totalModules = auditLogs.length;
  const completeLessons = auditLogs.filter(log => log.content.lessons.status === 'complete').length;
  const completeQuizzes = auditLogs.filter(log => log.content.quizzes.status === 'complete').length;
  const accessibleModules = auditLogs.filter(log => log.accessibility.severity === 'compliant').length;
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`  Total Modules: ${totalModules}`);
  console.log(`  Lessons Complete: ${completeLessons}/${totalModules}`);
  console.log(`  Quizzes Complete: ${completeQuizzes}/${totalModules}`);
  console.log(`  Accessible Modules: ${accessibleModules}/${totalModules}`);
  
  // Content status
  console.log(`\n📚 Content Status:`);
  auditLogs.forEach(log => {
    const lessonsStatus = log.content.lessons.status === 'complete' ? '✅' : '❌';
    const quizzesStatus = log.content.quizzes.status === 'complete' ? '✅' : '❌';
    console.log(`  ${log.moduleSlug}: Lessons ${lessonsStatus} (${log.content.lessons.actual}/${log.content.lessons.required}), Quizzes ${quizzesStatus} (${log.content.quizzes.actual}/${log.content.quizzes.required})`);
  });
  
  // Issues summary
  if (reports.validation && reports.validation.issues.length > 0) {
    console.log(`\n⚠️  Issues Found:`);
    reports.validation.issues.forEach(issue => {
      console.log(`  • ${issue.message}`);
    });
  }
  
  // Accessibility summary
  if (reports.accessibility) {
    console.log(`\n♿ Accessibility:`);
    if (reports.accessibility.summary.totalIssues === 0) {
      console.log(`  ✅ All modules are WCAG 2.1 AA compliant`);
    } else {
      console.log(`  ❌ ${reports.accessibility.summary.totalIssues} accessibility issues found`);
    }
  }
  
  // Quiz analysis summary
  if (reports.randomness) {
    console.log(`\n🎲 Quiz Analysis:`);
    console.log(`  Average Questions per Module: ${reports.randomness.summary.avgQuestions}`);
    console.log(`  Average Difficulty Distribution: Beginner=${reports.randomness.summary.avgDistribution.beginner}, Intermediate=${reports.randomness.summary.avgDistribution.intermediate}, Advanced=${reports.randomness.summary.avgDistribution.advanced}`);
    console.log(`  Average Duplication Rate: ${reports.randomness.summary.avgDuplication}%`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save summary report
  const summary = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalModules,
      completeLessons,
      completeQuizzes,
      accessibleModules
    },
    modules: auditLogs,
    reports: {
      validation: reports.validation || null,
      accessibility: reports.accessibility || null,
      randomness: reports.randomness || null
    }
  };
  
  const summaryPath = path.join(__dirname, '..', 'audit-logs', 'summary-report.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Summary report saved to: ${summaryPath}`);
}

// Main function
function runAuditLogGeneration() {
  console.log('🚀 Starting audit log generation...\n');
  generateAllAuditLogs();
  console.log('\n✅ Audit log generation completed!');
}

// Run if called directly
if (require.main === module) {
  runAuditLogGeneration();
}

module.exports = {
  generateModuleAuditLog,
  generateAllAuditLogs,
  runAuditLogGeneration
};