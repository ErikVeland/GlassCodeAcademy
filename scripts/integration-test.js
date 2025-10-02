#!/usr/bin/env node

/**
 * Integration Testing Script
 * Comprehensive integration testing and quality assurance
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test scenarios covering all major functionality
const TEST_SCENARIOS = [
  {
    name: 'User Journey - New User',
    description: 'Complete user journey from homepage to lesson completion',
    steps: [
      { action: 'navigate', url: '/', description: 'Visit homepage' },
      { action: 'click', selector: '[data-testid="module-card-react-fundamentals"]', description: 'Click on React module' },
      { action: 'click', selector: '[data-testid="start-lesson-button"]', description: 'Start first lesson' },
      { action: 'wait', duration: 2000, description: 'Wait for lesson to load' },
      { action: 'click', selector: '[data-testid="next-lesson-button"]', description: 'Navigate to next lesson' },
      { action: 'click', selector: '[data-testid="quiz-link"]', description: 'Go to module quiz' },
      { action: 'quiz', questions: 5, description: 'Complete 5 quiz questions' },
      { action: 'click', selector: '[data-testid="submit-quiz-button"]', description: 'Submit quiz' },
      { action: 'check', selector: '[data-testid="quiz-results"]', description: 'Verify quiz results displayed' }
    ]
  },
  {
    name: 'Progress Tracking',
    description: 'Verify progress tracking functionality',
    steps: [
      { action: 'navigate', url: '/', description: 'Visit homepage' },
      { action: 'click', selector: '[data-testid="progress-dashboard-link"]', description: 'Go to progress dashboard' },
      { action: 'check', selector: '[data-testid="overall-progress"]', description: 'Check overall progress display' },
      { action: 'check', selector: '[data-testid="streak-counter"]', description: 'Verify streak counter' },
      { action: 'check', selector: '[data-testid="achievements-list"]', description: 'Verify achievements display' }
    ]
  },
  {
    name: 'Search and Filter',
    description: 'Test search and filtering functionality',
    steps: [
      { action: 'navigate', url: '/', description: 'Visit homepage' },
      { action: 'fill', selector: '[data-testid="search-input"]', value: 'react', description: 'Search for "react"' },
      { action: 'check', selector: '[data-testid="search-results"]', description: 'Verify search results' },
      { action: 'select', selector: '[data-testid="filter-tier"]', value: 'core', description: 'Filter by core tier' },
      { action: 'check', selector: '[data-testid="filtered-modules"]', description: 'Verify filtered results' }
    ]
  },
  {
    name: 'Navigation Flow',
    description: 'Test breadcrumb and navigation functionality',
    steps: [
      { action: 'navigate', url: '/modules/react-fundamentals/lessons/react-basics', description: 'Go to specific lesson' },
      { action: 'check', selector: '[data-testid="breadcrumb"]', description: 'Verify breadcrumb navigation' },
      { action: 'click', selector: '[data-testid="breadcrumb-home"]', description: 'Click home breadcrumb' },
      { action: 'check', selector: 'body.homepage', description: 'Verify returned to homepage' }
    ]
  },
  {
    name: 'Accessibility Features',
    description: 'Test accessibility functionality',
    steps: [
      { action: 'navigate', url: '/', description: 'Visit homepage' },
      { action: 'click', selector: '[data-testid="accessibility-toggle"]', description: 'Open accessibility panel' },
      { action: 'click', selector: '[data-testid="high-contrast-toggle"]', description: 'Enable high contrast mode' },
      { action: 'check', selector: 'body.high-contrast', description: 'Verify high contrast applied' },
      { action: 'click', selector: '[data-testid="skip-link"]', description: 'Test skip to content link' },
      { action: 'check', selector: '[data-testid="main-content"]:focus', description: 'Verify skip link focus' }
    ]
  }
];

class IntegrationTester {
  constructor() {
    this.results = [];
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  }

  async runTests() {
    console.log('🚀 Starting integration testing...\n');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (const scenario of TEST_SCENARIOS) {
        console.log(`Testing: ${scenario.name}`);
        await this.testScenario(browser, scenario);
      }
      
      await this.generateReport();
      console.log('\n✅ Integration testing completed!');
    } finally {
      await browser.close();
    }
  }

  async testScenario(browser, scenario) {
    const page = await browser.newPage();
    const scenarioResult = {
      name: scenario.name,
      description: scenario.description,
      steps: [],
      passed: true,
      issues: [],
      duration: 0
    };

    const startTime = Date.now();

    try {
      for (const step of scenario.steps) {
        const stepResult = await this.executeStep(page, step);
        scenarioResult.steps.push(stepResult);
        
        if (!stepResult.passed) {
          scenarioResult.passed = false;
          scenarioResult.issues.push(`Step failed: ${step.description} - ${stepResult.error}`);
        }
      }
    } catch (error) {
      scenarioResult.passed = false;
      scenarioResult.issues.push(`Scenario failed: ${error.message}`);
    } finally {
      scenarioResult.duration = Date.now() - startTime;
      this.results.push(scenarioResult);
      await page.close();
    }

    const status = scenarioResult.passed ? '✅' : '❌';
    console.log(`  ${status} ${scenario.name} (${scenarioResult.duration}ms)\n`);
  }

  async executeStep(page, step) {
    const stepResult = {
      description: step.description,
      action: step.action,
      passed: true,
      error: null
    };

    try {
      switch (step.action) {
        case 'navigate':
          await page.goto(`${this.baseUrl}${step.url}`, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });
          break;

        case 'click':
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.click(step.selector);
          break;

        case 'fill':
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.fill(step.selector, step.value);
          break;

        case 'select':
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.select(step.selector, step.value);
          break;

        case 'wait':
          await page.waitForTimeout(step.duration);
          break;

        case 'check':
          await page.waitForSelector(step.selector, { timeout: 10000 });
          // Element exists, test passes
          break;

        case 'quiz':
          // Simulate quiz completion
          for (let i = 0; i < step.questions; i++) {
            const optionSelector = `[data-testid="quiz-question-${i}"] [data-testid="option-0"]`;
            await page.waitForSelector(optionSelector, { timeout: 5000 });
            await page.click(optionSelector);
          }
          break;

        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
    } catch (error) {
      stepResult.passed = false;
      stepResult.error = error.message;
    }

    return stepResult;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      scenarios: this.results,
      summary: this.generateSummary()
    };

    const reportDir = path.join(__dirname, '..', 'test-reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'integration-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${reportPath}`);
    
    // Generate HTML report
    await this.generateHtmlReport(report);
  }

  generateSummary() {
    const summary = {
      totalScenarios: this.results.length,
      passedScenarios: this.results.filter(r => r.passed).length,
      totalSteps: 0,
      passedSteps: 0,
      totalIssues: 0,
      averageDuration: 0
    };

    let totalDuration = 0;

    this.results.forEach(result => {
      summary.totalSteps += result.steps.length;
      summary.passedSteps += result.steps.filter(s => s.passed).length;
      summary.totalIssues += result.issues.length;
      totalDuration += result.duration;
    });

    summary.averageDuration = Math.round(totalDuration / this.results.length);

    return summary;
  }

  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; }
        .summary-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .pass { color: #22c55e; }
        .fail { color: #ef4444; }
        .scenario-results { margin-bottom: 30px; }
        .scenario-header { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .scenario-name { font-size: 1.2em; font-weight: bold; }
        .scenario-description { color: #6b7280; margin-top: 5px; }
        .scenario-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fee2e2; color: #991b1b; }
        .steps { margin-top: 15px; }
        .step { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
        .step:last-child { border-bottom: none; }
        .step-icon { width: 20px; margin-right: 10px; }
        .step-description { flex: 1; }
        .step-error { color: #ef4444; font-size: 0.9em; margin-top: 5px; padding-left: 30px; }
        .issues { margin-top: 15px; padding: 10px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; }
        .issue { margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Integration Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div>Scenarios</div>
                <div class="summary-value">${report.summary.totalScenarios}</div>
            </div>
            <div class="summary-card">
                <div>Passed</div>
                <div class="summary-value pass">${report.summary.passedScenarios}</div>
            </div>
            <div class="summary-card">
                <div>Steps</div>
                <div class="summary-value">${report.summary.totalSteps}</div>
            </div>
            <div class="summary-card">
                <div>Step Pass Rate</div>
                <div class="summary-value pass">${Math.round((report.summary.passedSteps / report.summary.totalSteps) * 100)}%</div>
            </div>
        </div>
        
        ${report.scenarios.map(scenario => `
            <div class="scenario-results">
                <div class="scenario-header">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="scenario-name">${scenario.name}</div>
                            <div class="scenario-description">${scenario.description}</div>
                        </div>
                        <div class="scenario-status ${scenario.passed ? 'status-pass' : 'status-fail'}">
                            ${scenario.passed ? 'PASS' : 'FAIL'}
                        </div>
                    </div>
                    <div style="margin-top: 10px; color: #6b7280; font-size: 0.9em;">
                        Duration: ${scenario.duration}ms
                    </div>
                </div>
                
                <div class="steps">
                    ${scenario.steps.map(step => `
                        <div class="step">
                            <div class="step-icon">
                                ${step.passed ? '✅' : '❌'}
                            </div>
                            <div class="step-description">
                                ${step.description}
                            </div>
                        </div>
                        ${step.error ? `<div class="step-error">Error: ${step.error}</div>` : ''}
                    `).join('')}
                </div>
                
                ${scenario.issues.length > 0 ? `
                    <div class="issues">
                        <strong>Issues:</strong>
                        ${scenario.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, '..', 'test-reports', 'integration-test-report.html');
    await fs.writeFile(htmlPath, html);
    console.log(`📋 HTML report saved to: ${htmlPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runTests().catch(console.error);
}

module.exports = IntegrationTester;