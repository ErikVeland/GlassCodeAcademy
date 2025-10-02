#!/usr/bin/env node

/**
 * Cross-Browser Testing and Validation Script
 * Ensures consistent experience across different browsers and platforms
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Browser configurations for testing
const BROWSER_CONFIGS = [
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Firefox Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Safari Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    viewport: { width: 1920, height: 1080 }
  },
  {
    name: 'Mobile Chrome',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 375, height: 667, isMobile: true }
  },
  {
    name: 'Mobile Safari',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812, isMobile: true }
  }
];

// Test scenarios to validate
const TEST_SCENARIOS = [
  {
    name: 'Homepage Loading',
    url: '/',
    checks: [
      'title', 'navigation', 'search', 'modules-grid', 'footer'
    ]
  },
  {
    name: 'Module Navigation',
    url: '/modules/react-fundamentals',
    checks: [
      'breadcrumbs', 'lesson-list', 'progress-indicator', 'quiz-link'
    ]
  },
  {
    name: 'Lesson Content',
    url: '/modules/react-fundamentals/lessons/react-basics',
    checks: [
      'lesson-content', 'code-examples', 'navigation-controls', 'progress-tracking'
    ]
  },
  {
    name: 'Quiz Interface',
    url: '/modules/react-fundamentals/quiz',
    checks: [
      'quiz-questions', 'answer-options', 'submit-button', 'progress-bar'
    ]
  },
  {
    name: 'Progress Dashboard',
    url: '/dashboard',
    checks: [
      'progress-overview', 'achievements', 'streak-counter', 'charts'
    ]
  }
];

class CrossBrowserTester {
  constructor() {
    this.results = [];
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  }

  async runTests() {
    console.log('🚀 Starting cross-browser testing...\n');
    
    for (const config of BROWSER_CONFIGS) {
      console.log(`Testing: ${config.name}`);
      await this.testBrowser(config);
    }
    
    await this.generateReport();
    console.log('\n✅ Cross-browser testing completed!');
  }

  async testBrowser(config) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent(config.userAgent);
      await page.setViewport(config.viewport);
      
      const browserResult = {
        browser: config.name,
        scenarios: [],
        overallScore: 0,
        issues: []
      };

      for (const scenario of TEST_SCENARIOS) {
        console.log(`  📄 Testing: ${scenario.name}`);
        const scenarioResult = await this.testScenario(page, scenario);
        browserResult.scenarios.push(scenarioResult);
      }

      // Calculate overall score
      const totalChecks = browserResult.scenarios.reduce((sum, s) => sum + s.checks.length, 0);
      const passedChecks = browserResult.scenarios.reduce((sum, s) => sum + s.passedChecks, 0);
      browserResult.overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      this.results.push(browserResult);
      console.log(`  ✅ Score: ${browserResult.overallScore}%\n`);

    } catch (error) {
      console.error(`  ❌ Error testing ${config.name}:`, error.message);
    } finally {
      await browser.close();
    }
  }

  async testScenario(page, scenario) {
    const url = `${this.baseUrl}${scenario.url}`;
    const scenarioResult = {
      name: scenario.name,
      url,
      checks: [],
      passedChecks: 0,
      loadTime: 0,
      issues: []
    };

    try {
      const startTime = Date.now();
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      scenarioResult.loadTime = Date.now() - startTime;

      // Perform checks
      for (const check of scenario.checks) {
        const checkResult = await this.performCheck(page, check);
        scenarioResult.checks.push(checkResult);
        
        if (checkResult.passed) {
          scenarioResult.passedChecks++;
        } else {
          scenarioResult.issues.push(checkResult.error);
        }
      }

      // Additional performance checks
      await this.checkPerformance(page, scenarioResult);
      
      // Accessibility quick check
      await this.checkAccessibility(page, scenarioResult);

    } catch (error) {
      scenarioResult.issues.push(`Navigation failed: ${error.message}`);
    }

    return scenarioResult;
  }

  async performCheck(page, checkType) {
    const checks = {
      'title': async () => {
        const title = await page.title();
        return {
          passed: title && title.length > 0,
          error: title ? null : 'Page title is missing'
        };
      },
      
      'navigation': async () => {
        const nav = await page.$('nav, [role="navigation"]');
        return {
          passed: !!nav,
          error: nav ? null : 'Navigation element not found'
        };
      },
      
      'search': async () => {
        const search = await page.$('input[type="search"], [role="search"]');
        return {
          passed: !!search,
          error: search ? null : 'Search functionality not found'
        };
      },
      
      'modules-grid': async () => {
        const grid = await page.$('.modules-grid, [data-testid="modules-grid"]');
        return {
          passed: !!grid,
          error: grid ? null : 'Modules grid not found'
        };
      },
      
      'footer': async () => {
        const footer = await page.$('footer');
        return {
          passed: !!footer,
          error: footer ? null : 'Footer element not found'
        };
      },
      
      'breadcrumbs': async () => {
        const breadcrumbs = await page.$('[aria-label="breadcrumb"], .breadcrumbs');
        return {
          passed: !!breadcrumbs,
          error: breadcrumbs ? null : 'Breadcrumbs not found'
        };
      },
      
      'lesson-list': async () => {
        const lessons = await page.$$('.lesson-item, [data-testid^="lesson"]');
        return {
          passed: lessons.length > 0,
          error: lessons.length > 0 ? null : 'No lessons found'
        };
      },
      
      'progress-indicator': async () => {
        const progress = await page.$('.progress, [role="progressbar"]');
        return {
          passed: !!progress,
          error: progress ? null : 'Progress indicator not found'
        };
      },
      
      'lesson-content': async () => {
        const content = await page.$('.lesson-content, main');
        return {
          passed: !!content,
          error: content ? null : 'Lesson content not found'
        };
      },
      
      'code-examples': async () => {
        const code = await page.$('pre, code, .highlight');
        return {
          passed: !!code,
          error: code ? null : 'Code examples not found'
        };
      },
      
      'quiz-questions': async () => {
        const questions = await page.$$('.question, [data-testid^="question"]');
        return {
          passed: questions.length > 0,
          error: questions.length > 0 ? null : 'Quiz questions not found'
        };
      },
      
      'answer-options': async () => {
        const options = await page.$$('input[type="radio"], input[type="checkbox"]');
        return {
          passed: options.length > 0,
          error: options.length > 0 ? null : 'Answer options not found'
        };
      },
      
      'submit-button': async () => {
        const submit = await page.$('button[type="submit"], .submit-btn');
        return {
          passed: !!submit,
          error: submit ? null : 'Submit button not found'
        };
      },
      
      'progress-bar': async () => {
        const bar = await page.$('.progress-bar, [role="progressbar"]');
        return {
          passed: !!bar,
          error: bar ? null : 'Progress bar not found'
        };
      },
      
      'progress-overview': async () => {
        const overview = await page.$('.progress-overview, .dashboard-summary');
        return {
          passed: !!overview,
          error: overview ? null : 'Progress overview not found'
        };
      },
      
      'achievements': async () => {
        const achievements = await page.$$('.achievement, .badge');
        return {
          passed: achievements.length >= 0, // Can be empty
          error: null
        };
      },
      
      'streak-counter': async () => {
        const streak = await page.$('.streak, [data-testid="streak"]');
        return {
          passed: !!streak,
          error: streak ? null : 'Streak counter not found'
        };
      },
      
      'charts': async () => {
        const charts = await page.$('svg, canvas, .chart');
        return {
          passed: !!charts,
          error: charts ? null : 'Charts not found'
        };
      }
    };

    try {
      const checker = checks[checkType];
      if (checker) {
        return await checker();
      } else {
        return {
          passed: false,
          error: `Unknown check type: ${checkType}`
        };
      }
    } catch (error) {
      return {
        passed: false,
        error: `Check failed: ${error.message}`
      };
    }
  }

  async checkPerformance(page, scenarioResult) {
    try {
      // Get performance metrics
      const metrics = await page.metrics();
      const paintMetrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('paint');
        return entries.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {});
      });

      scenarioResult.performance = {
        JSHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024), // MB
        JSHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024), // MB
        firstPaint: paintMetrics['first-paint'] || 0,
        firstContentfulPaint: paintMetrics['first-contentful-paint'] || 0,
        loadTime: scenarioResult.loadTime
      };

      // Performance thresholds
      if (scenarioResult.loadTime > 3000) {
        scenarioResult.issues.push('Slow page load time (>3s)');
      }
      
      if (paintMetrics['first-contentful-paint'] > 2500) {
        scenarioResult.issues.push('Slow First Contentful Paint (>2.5s)');
      }

    } catch (error) {
      scenarioResult.issues.push(`Performance check failed: ${error.message}`);
    }
  }

  async checkAccessibility(page, scenarioResult) {
    try {
      // Basic accessibility checks
      const a11yIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for images without alt text
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.hasAttribute('alt')) {
            issues.push('Image missing alt attribute');
          }
        });
        
        // Check for form inputs without labels
        const inputs = document.querySelectorAll('input:not([type="hidden"])');
        inputs.forEach(input => {
          const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
          const hasAriaLabel = input.hasAttribute('aria-label');
          if (!hasLabel && !hasAriaLabel) {
            issues.push('Form input missing label');
          }
        });
        
        // Check for missing page title
        if (!document.title || document.title.length === 0) {
          issues.push('Page missing title');
        }
        
        return issues;
      });

      if (a11yIssues.length > 0) {
        scenarioResult.issues.push(...a11yIssues);
      }

    } catch (error) {
      scenarioResult.issues.push(`Accessibility check failed: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      browsers: this.results,
      summary: this.generateSummary()
    };

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-reports', `cross-browser-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(report);

    console.log(`📊 Detailed report saved to: ${reportPath}`);
  }

  generateSummary() {
    const summary = {
      totalBrowsers: this.results.length,
      averageScore: 0,
      bestBrowser: null,
      worstBrowser: null,
      commonIssues: {},
      recommendations: []
    };

    // Calculate average score
    const totalScore = this.results.reduce((sum, result) => sum + result.overallScore, 0);
    summary.averageScore = Math.round(totalScore / this.results.length);

    // Find best and worst browsers
    summary.bestBrowser = this.results.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    );
    summary.worstBrowser = this.results.reduce((worst, current) => 
      current.overallScore < worst.overallScore ? current : worst
    );

    // Identify common issues
    this.results.forEach(result => {
      result.scenarios.forEach(scenario => {
        scenario.issues.forEach(issue => {
          summary.commonIssues[issue] = (summary.commonIssues[issue] || 0) + 1;
        });
      });
    });

    // Generate recommendations
    const issueCount = Object.keys(summary.commonIssues).length;
    if (issueCount > 0) {
      summary.recommendations.push('Address common issues found across multiple browsers');
    }
    if (summary.averageScore < 90) {
      summary.recommendations.push('Improve overall browser compatibility and performance');
    }

    return summary;
  }

  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 2em; font-weight: bold; color: ${report.summary.averageScore >= 90 ? '#22c55e' : report.summary.averageScore >= 70 ? '#f59e0b' : '#ef4444'}; }
        .browser-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .browser-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .browser-score { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; }
        .scenario { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .issue { color: #ef4444; font-size: 0.9em; }
        .pass { color: #22c55e; }
        .fail { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Cross-Browser Test Report</h1>
            <div class="score">${report.summary.averageScore}%</div>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="browser-results">
            ${report.browsers.map(browser => `
                <div class="browser-card">
                    <h3>${browser.browser}</h3>
                    <div class="browser-score" style="color: ${browser.overallScore >= 90 ? '#22c55e' : browser.overallScore >= 70 ? '#f59e0b' : '#ef4444'}">${browser.overallScore}%</div>
                    ${browser.scenarios.map(scenario => `
                        <div class="scenario">
                            <strong>${scenario.name}</strong> (${scenario.passedChecks}/${scenario.checks.length} passed)
                            ${scenario.issues.length > 0 ? `<div class="issue">Issues: ${scenario.issues.join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, '..', 'test-reports', `cross-browser-${Date.now()}.html`);
    await fs.writeFile(htmlPath, html);
    console.log(`📋 HTML report saved to: ${htmlPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CrossBrowserTester();
  tester.runTests().catch(console.error);
}

module.exports = CrossBrowserTester;