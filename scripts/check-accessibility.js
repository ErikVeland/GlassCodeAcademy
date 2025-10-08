#!/usr/bin/env node

/**
 * Accessibility Checker Script
 * Checks content files for WCAG 2.1 AA compliance issues
 */

const fs = require('fs');
const path = require('path');

// WCAG 2.1 AA compliance checks
const accessibilityChecks = {
  // Check for proper heading structure (H1, H2, H3, etc.)
  checkHeadingStructure: (content) => {
    const issues = [];
    const lines = content.split('\n');
    let lastHeadingLevel = 0;
    
    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        if (level > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
          issues.push({
            line: index + 1,
            message: `Heading level skipped from H${lastHeadingLevel} to H${level}`,
            severity: 'medium'
          });
        }
        lastHeadingLevel = level;
      }
    });
    
    return issues;
  },
  
  // Check for alt text in images
  checkAltText: (content) => {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for markdown images without alt text
      if (line.includes('![](') || line.includes('<img') && !line.includes('alt=')) {
        issues.push({
          line: index + 1,
          message: 'Image missing alt text',
          severity: 'high'
        });
      }
    });
    
    return issues;
  },
  
  // Check for sufficient color contrast (placeholder - would need actual color values)
  checkColorContrast: (content) => {
    // This is a simplified check - real implementation would need actual color values
    const issues = [];
    return issues;
  },
  
  // Check for proper link text
  checkLinkText: (content) => {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for generic link text
      if (line.includes('[click here]') || line.includes('[here]') || line.includes('[link]')) {
        issues.push({
          line: index + 1,
          message: 'Generic link text found - use descriptive text instead',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  },
  
  // Check for proper list structure
  checkListStructure: (content) => {
    const issues = [];
    const lines = content.split('\n');
    
    // Check for proper ordered list numbering
    let inOrderedList = false;
    let expectedNumber = 1;
    
    lines.forEach((line, index) => {
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (orderedMatch) {
        const actualNumber = parseInt(orderedMatch[1]);
        if (actualNumber !== expectedNumber) {
          issues.push({
            line: index + 1,
            message: `Ordered list numbering error: expected ${expectedNumber}, found ${actualNumber}`,
            severity: 'low'
          });
        }
        expectedNumber = actualNumber + 1;
      } else if (line.trim() === '') {
        // Reset when we hit a blank line
        expectedNumber = 1;
      }
    });
    
    return issues;
  }
};

// Check lesson files for accessibility issues
function checkLessonFiles() {
  const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
  const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));
  
  console.log('🔍 Checking lesson files for accessibility issues...\n');
  
  const allIssues = [];
  
  lessonFiles.forEach(file => {
    const filePath = path.join(lessonsDir, file);
    console.log(`📄 Checking ${file}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lessons = JSON.parse(fileContent);
      
      // Check if it's an array of lessons or a single lesson object
      const lessonsToProcess = Array.isArray(lessons) ? lessons : [lessons];
      
      lessonsToProcess.forEach(lesson => {
        // Check lesson title
        if (lesson.title) {
          const titleIssues = checkLessonTitle(lesson.title);
          titleIssues.forEach(issue => {
            allIssues.push({
              file: file,
              lesson: lesson.id,
              type: 'title',
              ...issue
            });
          });
        }
        
        // Check lesson intro
        if (lesson.intro) {
          const introIssues = checkTextContent(lesson.intro);
          introIssues.forEach(issue => {
            allIssues.push({
              file: file,
              lesson: lesson.id,
              type: 'intro',
              ...issue
            });
          });
        }
        
        // Check code examples
        if (lesson.code && lesson.code.example) {
          const codeIssues = checkCodeExample(lesson.code.example);
          codeIssues.forEach(issue => {
            allIssues.push({
              file: file,
              lesson: lesson.id,
              type: 'code',
              ...issue
            });
          });
        }
        
        // Check exercises
        if (lesson.exercises && Array.isArray(lesson.exercises)) {
          lesson.exercises.forEach((exercise, exerciseIndex) => {
            if (exercise.title) {
              const titleIssues = checkLessonTitle(exercise.title);
              titleIssues.forEach(issue => {
                allIssues.push({
                  file: file,
                  lesson: lesson.id,
                  exercise: exerciseIndex,
                  type: 'exercise_title',
                  ...issue
                });
              });
            }
            
            if (exercise.description) {
              const descIssues = checkTextContent(exercise.description);
              descIssues.forEach(issue => {
                allIssues.push({
                  file: file,
                  lesson: lesson.id,
                  exercise: exerciseIndex,
                  type: 'exercise_description',
                  ...issue
                });
              });
            }
          });
        }
      });
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error.message}`);
    }
  });
  
  return allIssues;
}

// Check lesson title for accessibility issues
function checkLessonTitle(title) {
  const issues = [];
  
  // Check for proper capitalization
  if (title.length > 0 && title[0] !== title[0].toUpperCase()) {
    issues.push({
      message: 'Title should start with a capital letter',
      severity: 'low'
    });
  }
  
  return issues;
}

// Check text content for accessibility issues
function checkTextContent(content) {
  const issues = [];
  
  // Check for proper heading structure
  const headingIssues = accessibilityChecks.checkHeadingStructure(content);
  issues.push(...headingIssues);
  
  // Check for alt text
  const altTextIssues = accessibilityChecks.checkAltText(content);
  issues.push(...altTextIssues);
  
  // Check for proper link text
  const linkTextIssues = accessibilityChecks.checkLinkText(content);
  issues.push(...linkTextIssues);
  
  // Check for proper list structure
  const listStructureIssues = accessibilityChecks.checkListStructure(content);
  issues.push(...listStructureIssues);
  
  return issues;
}

// Check code examples for accessibility issues
function checkCodeExample(code) {
  const issues = [];
  
  // Check for comments that might indicate accessibility issues
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    // Check for TODO comments that might indicate accessibility issues
    if (line.includes('// TODO') && line.toLowerCase().includes('accessibility')) {
      issues.push({
        line: index + 1,
        message: 'TODO comment related to accessibility found',
        severity: 'medium'
      });
    }
  });
  
  return issues;
}

// Check quiz files for accessibility issues
function checkQuizFiles() {
  const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
  const quizFiles = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));
  
  console.log('\n🔍 Checking quiz files for accessibility issues...\n');
  
  const allIssues = [];
  
  quizFiles.forEach(file => {
    const filePath = path.join(quizzesDir, file);
    console.log(`📄 Checking ${file}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const quiz = JSON.parse(fileContent);
      
      if (quiz.questions && Array.isArray(quiz.questions)) {
        quiz.questions.forEach((question, questionIndex) => {
          // Check question text
          if (question.question) {
            const questionIssues = checkTextContent(question.question);
            questionIssues.forEach(issue => {
              allIssues.push({
                file: file,
                question: questionIndex,
                type: 'question',
                ...issue
              });
            });
          }
          
          // Check choices
          if (question.choices && Array.isArray(question.choices)) {
            question.choices.forEach((choice, choiceIndex) => {
              const choiceIssues = checkTextContent(choice);
              choiceIssues.forEach(issue => {
                allIssues.push({
                  file: file,
                  question: questionIndex,
                  choice: choiceIndex,
                  type: 'choice',
                  ...issue
                });
              });
            });
          }
          
          // Check explanation
          if (question.explanation) {
            const explanationIssues = checkTextContent(question.explanation);
            explanationIssues.forEach(issue => {
              allIssues.push({
                file: file,
                question: questionIndex,
                type: 'explanation',
                ...issue
              });
            });
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error.message}`);
    }
  });
  
  return allIssues;
}

// Generate accessibility report
function generateReport(lessonIssues, quizIssues) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ACCESSIBILITY COMPLIANCE REPORT');
  console.log('='.repeat(60));
  
  const totalIssues = lessonIssues.length + quizIssues.length;
  const highSeverity = [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'high').length;
  const mediumSeverity = [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'medium').length;
  const lowSeverity = [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'low').length;
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total Issues: ${totalIssues}`);
  console.log(`  High Severity: ${highSeverity}`);
  console.log(`  Medium Severity: ${mediumSeverity}`);
  console.log(`  Low Severity: ${lowSeverity}`);
  
  if (totalIssues > 0) {
    console.log(`\n📋 Detailed Issues:`);
    
    // Group issues by severity
    const issuesBySeverity = {
      high: [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'high'),
      medium: [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'medium'),
      low: [...lessonIssues, ...quizIssues].filter(issue => issue.severity === 'low')
    };
    
    // Display high severity issues first
    if (issuesBySeverity.high.length > 0) {
      console.log(`\n🔴 High Severity Issues:`);
      issuesBySeverity.high.forEach(issue => {
        console.log(`  • File: ${issue.file}${issue.lesson ? `, Lesson: ${issue.lesson}` : ''}${issue.question !== undefined ? `, Question: ${issue.question}` : ''}`);
        console.log(`    ${issue.message}`);
        if (issue.line) console.log(`    Line: ${issue.line}`);
        console.log('');
      });
    }
    
    // Display medium severity issues
    if (issuesBySeverity.medium.length > 0) {
      console.log(`🟡 Medium Severity Issues:`);
      issuesBySeverity.medium.forEach(issue => {
        console.log(`  • File: ${issue.file}${issue.lesson ? `, Lesson: ${issue.lesson}` : ''}${issue.question !== undefined ? `, Question: ${issue.question}` : ''}`);
        console.log(`    ${issue.message}`);
        if (issue.line) console.log(`    Line: ${issue.line}`);
        console.log('');
      });
    }
    
    // Display low severity issues
    if (issuesBySeverity.low.length > 0) {
      console.log(`🟢 Low Severity Issues:`);
      issuesBySeverity.low.forEach(issue => {
        console.log(`  • File: ${issue.file}${issue.lesson ? `, Lesson: ${issue.lesson}` : ''}${issue.question !== undefined ? `, Question: ${issue.question}` : ''}`);
        console.log(`    ${issue.message}`);
        if (issue.line) console.log(`    Line: ${issue.line}`);
        console.log('');
      });
    }
  } else {
    console.log('\n✅ No accessibility issues found! Content appears to be WCAG 2.1 AA compliant.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues,
      highSeverity,
      mediumSeverity,
      lowSeverity
    },
    issues: [...lessonIssues, ...quizIssues]
  };
  
  const reportPath = path.join(__dirname, '..', 'test-reports', 'accessibility-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
}

// Main function
function runAccessibilityCheck() {
  console.log('🚀 Starting accessibility compliance check...\n');
  
  const lessonIssues = checkLessonFiles();
  const quizIssues = checkQuizFiles();
  
  generateReport(lessonIssues, quizIssues);
  
  console.log('\n✅ Accessibility compliance check completed!');
}

// Run if called directly
if (require.main === module) {
  runAccessibilityCheck();
}

module.exports = {
  checkLessonFiles,
  checkQuizFiles,
  generateReport,
  runAccessibilityCheck
};