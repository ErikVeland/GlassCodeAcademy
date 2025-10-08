#!/usr/bin/env node

/**
 * Quiz Randomness Checker
 * Verifies that quiz question selection works correctly with proper randomness
 * and difficulty distribution
 */

const fs = require('fs');
const path = require('path');

// Function to randomly select questions from a pool
function selectRandomQuestions(questions, count) {
  // Create a copy of the questions array to avoid modifying the original
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to analyze difficulty distribution
function analyzeDifficultyDistribution(questions) {
  const distribution = {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  };
  
  questions.forEach(question => {
    const difficulty = question.difficulty.toLowerCase();
    if (distribution.hasOwnProperty(difficulty)) {
      distribution[difficulty]++;
    }
  });
  
  return distribution;
}

// Function to check topic coverage
function analyzeTopicCoverage(questions) {
  const topics = {};
  
  questions.forEach(question => {
    const topic = question.topic || 'unknown';
    if (!topics[topic]) {
      topics[topic] = 0;
    }
    topics[topic]++;
  });
  
  return topics;
}

// Check quiz randomness for all modules
function checkQuizRandomness() {
  const quizzesDir = path.join(__dirname, '..', 'content', 'quizzes');
  const quizFiles = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));
  
  console.log('🎲 Checking quiz randomness for all modules...\n');
  
  const results = [];
  
  quizFiles.forEach(file => {
    const filePath = path.join(quizzesDir, file);
    console.log(`📄 Checking ${file}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const quiz = JSON.parse(fileContent);
      
      if (!quiz.questions || !Array.isArray(quiz.questions)) {
        console.log(`  ⚠️  No questions found in ${file}`);
        return;
      }
      
      const totalQuestions = quiz.questions.length;
      console.log(`  Total questions: ${totalQuestions}`);
      
      // Run 5 quiz draws of 20 questions each
      const draws = [];
      for (let i = 0; i < 5; i++) {
        const selectedQuestions = selectRandomQuestions(quiz.questions, 20);
        draws.push(selectedQuestions);
      }
      
      // Analyze difficulty distribution across draws
      const difficultyStats = [];
      draws.forEach((draw, index) => {
        const distribution = analyzeDifficultyDistribution(draw);
        difficultyStats.push(distribution);
        console.log(`  Draw ${index + 1}: Beginner=${distribution.beginner}, Intermediate=${distribution.intermediate}, Advanced=${distribution.advanced}`);
      });
      
      // Calculate average distribution
      const avgDistribution = {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      };
      
      difficultyStats.forEach(stats => {
        avgDistribution.beginner += stats.beginner;
        avgDistribution.intermediate += stats.intermediate;
        avgDistribution.advanced += stats.advanced;
      });
      
      avgDistribution.beginner = Math.round(avgDistribution.beginner / 5);
      avgDistribution.intermediate = Math.round(avgDistribution.intermediate / 5);
      avgDistribution.advanced = Math.round(avgDistribution.advanced / 5);
      
      console.log(`  Average: Beginner=${avgDistribution.beginner}, Intermediate=${avgDistribution.intermediate}, Advanced=${avgDistribution.advanced}`);
      
      // Check if distribution is close to target (6/10/4)
      const targetBeginner = 6;
      const targetIntermediate = 10;
      const targetAdvanced = 4;
      
      const beginnerDeviation = Math.abs(avgDistribution.beginner - targetBeginner);
      const intermediateDeviation = Math.abs(avgDistribution.intermediate - targetIntermediate);
      const advancedDeviation = Math.abs(avgDistribution.advanced - targetAdvanced);
      
      const isDistributionGood = beginnerDeviation <= 1 && intermediateDeviation <= 1 && advancedDeviation <= 1;
      
      console.log(`  Target: Beginner=${targetBeginner}, Intermediate=${targetIntermediate}, Advanced=${targetAdvanced}`);
      console.log(`  Distribution quality: ${isDistributionGood ? '✅ Good' : '⚠️  Needs improvement'}`);
      
      // Analyze topic coverage
      const allSelectedQuestions = draws.flat();
      const topicCoverage = analyzeTopicCoverage(allSelectedQuestions);
      
      console.log(`  Topics covered: ${Object.keys(topicCoverage).length}`);
      console.log(`  Topic distribution:`);
      Object.entries(topicCoverage).forEach(([topic, count]) => {
        console.log(`    ${topic}: ${count}`);
      });
      
      // Check for question duplication
      const questionIds = allSelectedQuestions.map(q => q.id);
      const uniqueQuestionIds = [...new Set(questionIds)];
      const duplicationRate = ((questionIds.length - uniqueQuestionIds.length) / questionIds.length * 100).toFixed(2);
      
      console.log(`  Duplication rate: ${duplicationRate}%`);
      
      results.push({
        module: file.replace('.json', ''),
        totalQuestions,
        avgDistribution,
        targetDistribution: { beginner: targetBeginner, intermediate: targetIntermediate, advanced: targetAdvanced },
        isDistributionGood,
        topicsCovered: Object.keys(topicCoverage).length,
        duplicationRate: parseFloat(duplicationRate)
      });
      
      console.log('');
      
    } catch (error) {
      console.error(`  ❌ Error processing ${file}: ${error.message}`);
    }
  });
  
  // Generate summary report
  generateSummaryReport(results);
}

// Generate summary report
function generateSummaryReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 QUIZ RANDOMNESS AND DISTRIBUTION REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n📈 Summary for ${results.length} modules:`);
  
  const goodDistributionModules = results.filter(r => r.isDistributionGood).length;
  const totalModules = results.length;
  
  console.log(`  Modules with good difficulty distribution: ${goodDistributionModules}/${totalModules}`);
  
  // Calculate overall statistics
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
  const avgQuestions = Math.round(totalQuestions / totalModules);
  
  console.log(`  Average questions per module: ${avgQuestions}`);
  
  // Distribution quality
  const avgBeginner = Math.round(results.reduce((sum, r) => sum + r.avgDistribution.beginner, 0) / totalModules);
  const avgIntermediate = Math.round(results.reduce((sum, r) => sum + r.avgDistribution.intermediate, 0) / totalModules);
  const avgAdvanced = Math.round(results.reduce((sum, r) => sum + r.avgDistribution.advanced, 0) / totalModules);
  
  console.log(`  Average difficulty distribution: Beginner=${avgBeginner}, Intermediate=${avgIntermediate}, Advanced=${avgAdvanced}`);
  
  // Duplication statistics
  const avgDuplication = (results.reduce((sum, r) => sum + r.duplicationRate, 0) / totalModules).toFixed(2);
  console.log(`  Average duplication rate: ${avgDuplication}%`);
  
  // Modules that need attention
  const modulesNeedingAttention = results.filter(r => !r.isDistributionGood || r.duplicationRate > 10);
  if (modulesNeedingAttention.length > 0) {
    console.log(`\n⚠️  Modules needing attention:`);
    modulesNeedingAttention.forEach(module => {
      console.log(`  • ${module.module}: ${module.isDistributionGood ? '' : 'Poor distribution, '}${module.duplicationRate > 10 ? 'High duplication' : ''}`);
    });
  } else {
    console.log(`\n✅ All modules have good randomness and distribution!`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules,
      goodDistributionModules,
      avgQuestions,
      avgDistribution: { beginner: avgBeginner, intermediate: avgIntermediate, advanced: avgAdvanced },
      avgDuplication: parseFloat(avgDuplication)
    },
    modules: results
  };
  
  const reportPath = path.join(__dirname, '..', 'test-reports', 'quiz-randomness-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
}

// Main function
function runQuizRandomnessCheck() {
  console.log('🚀 Starting quiz randomness verification...\n');
  checkQuizRandomness();
  console.log('\n✅ Quiz randomness check completed!');
}

// Run if called directly
if (require.main === module) {
  runQuizRandomnessCheck();
}

module.exports = {
  selectRandomQuestions,
  analyzeDifficultyDistribution,
  analyzeTopicCoverage,
  checkQuizRandomness,
  runQuizRandomnessCheck
};