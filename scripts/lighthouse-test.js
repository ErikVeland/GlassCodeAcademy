#!/usr/bin/env node

/**
 * Lighthouse Testing Script
 * Runs Lighthouse audits for performance, accessibility, best practices, and SEO
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// URLs to test
const TEST_URLS = [
  { name: 'Homepage', url: '/' },
  { name: 'Module Page', url: '/modules/react-fundamentals' },
  { name: 'Lesson Page', url: '/modules/react-fundamentals/lessons/react-basics' },
  { name: 'Quiz Page', url: '/modules/react-fundamentals/quiz' },
  { name: 'Progress Dashboard', url: '/dashboard' }
];

// Lighthouse configuration
const LH_OPTIONS = {
  logLevel: 'info',
  output: 'html',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  port: 9222,
  // Emulate mobile device for mobile testing
  screenEmulation: {
    mobile: true,
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    disabled: false,
  }
};

class LighthouseTester {
  constructor() {
    this.results = [];
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  }

  async runTests() {
    console.log('🚀 Starting Lighthouse testing...\n');
    
    // Launch Chrome
    const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
    LH_OPTIONS.port = chrome.port;

    try {
      for (const testUrl of TEST_URLS) {
        console.log(`Testing: ${testUrl.name} (${testUrl.url})`);
        await this.testUrl(testUrl);
      }
      
      await this.generateReport();
      console.log('\n✅ Lighthouse testing completed!');
    } finally {
      await chrome.kill();
    }
  }

  async testUrl(testUrl) {
    const url = `${this.baseUrl}${testUrl.url}`;
    const runnerResult = await lighthouse(url, LH_OPTIONS);
    
    const result = {
      name: testUrl.name,
      url: url,
      lhr: runnerResult.lhr,
      report: runnerResult.report,
      categories: {
        performance: runnerResult.lhr.categories.performance.score * 100,
        accessibility: runnerResult.lhr.categories.accessibility.score * 100,
        'best-practices': runnerResult.lhr.categories['best-practices'].score * 100,
        seo: runnerResult.lhr.categories.seo.score * 100
      }
    };

    this.results.push(result);
    
    // Save individual report
    const reportDir = path.join(__dirname, '..', 'test-reports', 'lighthouse');
    await fs.mkdir(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, `${testUrl.name.replace(/\s+/g, '-').toLowerCase()}.html`);
    await fs.writeFile(reportPath, runnerResult.report);
    console.log(`  📊 Report saved to: ${reportPath}`);
    
    // Log scores
    console.log(`  Performance: ${result.categories.performance.toFixed(0)}/100`);
    console.log(`  Accessibility: ${result.categories.accessibility.toFixed(0)}/100`);
    console.log(`  Best Practices: ${result.categories['best-practices'].toFixed(0)}/100`);
    console.log(`  SEO: ${result.categories.seo.toFixed(0)}/100\n`);
  }

  async generateReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results.map(result => ({
        name: result.name,
        url: result.url,
        categories: result.categories
      })),
      averages: {
        performance: 0,
        accessibility: 0,
        'best-practices': 0,
        seo: 0
      }
    };

    // Calculate averages
    const sums = { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 };
    this.results.forEach(result => {
      sums.performance += result.categories.performance;
      sums.accessibility += result.categories.accessibility;
      sums['best-practices'] += result.categories['best-practices'];
      sums.seo += result.categories.seo;
    });

    const count = this.results.length;
    summary.averages = {
      performance: sums.performance / count,
      accessibility: sums.accessibility / count,
      'best-practices': sums['best-practices'] / count,
      seo: sums.seo / count
    };

    // Save summary report
    const reportPath = path.join(__dirname, '..', 'test-reports', 'lighthouse-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary report saved to: ${reportPath}`);

    // Generate HTML summary
    await this.generateHtmlSummary(summary);
  }

  async generateHtmlSummary(summary) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .score-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; }
        .score-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .good { color: #22c55e; }
        .needs-improvement { color: #f59e0b; }
        .poor { color: #ef4444; }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        .results-table th, .results-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .results-table th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Lighthouse Test Summary</h1>
            <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
        </div>
        
        <h2>Average Scores</h2>
        <div class="scores-grid">
            <div class="score-card">
                <h3>Performance</h3>
                <div class="score-value ${this.getScoreClass(summary.averages.performance)}">${summary.averages.performance.toFixed(0)}</div>
                <p>Target: 90+</p>
            </div>
            <div class="score-card">
                <h3>Accessibility</h3>
                <div class="score-value ${this.getScoreClass(summary.averages.accessibility)}">${summary.averages.accessibility.toFixed(0)}</div>
                <p>Target: 95+</p>
            </div>
            <div class="score-card">
                <h3>Best Practices</h3>
                <div class="score-value ${this.getScoreClass(summary.averages['best-practices'])}">${summary.averages['best-practices'].toFixed(0)}</div>
                <p>Target: 90+</p>
            </div>
            <div class="score-card">
                <h3>SEO</h3>
                <div class="score-value ${this.getScoreClass(summary.averages.seo)}">${summary.averages.seo.toFixed(0)}</div>
                <p>Target: 90+</p>
            </div>
        </div>
        
        <h2>Detailed Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Performance</th>
                    <th>Accessibility</th>
                    <th>Best Practices</th>
                    <th>SEO</th>
                </tr>
            </thead>
            <tbody>
                ${summary.results.map(result => `
                    <tr>
                        <td>${result.name}</td>
                        <td class="${this.getScoreClass(result.categories.performance)}">${result.categories.performance.toFixed(0)}</td>
                        <td class="${this.getScoreClass(result.categories.accessibility)}">${result.categories.accessibility.toFixed(0)}</td>
                        <td class="${this.getScoreClass(result.categories['best-practices'])}">${result.categories['best-practices'].toFixed(0)}</td>
                        <td class="${this.getScoreClass(result.categories.seo)}">${result.categories.seo.toFixed(0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, '..', 'test-reports', 'lighthouse-summary.html');
    await fs.writeFile(htmlPath, html);
    console.log(`📋 HTML summary saved to: ${htmlPath}`);
  }

  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new LighthouseTester();
  tester.runTests().catch(console.error);
}

module.exports = LighthouseTester;