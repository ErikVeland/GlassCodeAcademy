#!/usr/bin/env node

/**
 * Responsive Design Testing Script
 * Tests responsive design across all device categories
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Device configurations for testing
const DEVICE_CONFIGS = [
  {
    name: 'Mobile (Small)',
    width: 320,
    height: 568,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Mobile (Large)',
    width: 414,
    height: 896,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Tablet',
    width: 768,
    height: 1024,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Desktop (Small)',
    width: 1024,
    height: 768,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Desktop (Large)',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
];

// Test URLs
const TEST_URLS = [
  { name: 'Homepage', url: '/' },
  { name: 'Module Page', url: '/modules/react-fundamentals' },
  { name: 'Lesson Page', url: '/modules/react-fundamentals/lessons/react-basics' },
  { name: 'Quiz Page', url: '/modules/react-fundamentals/quiz' },
  { name: 'Progress Dashboard', url: '/dashboard' }
];

class ResponsiveTester {
  constructor() {
    this.results = [];
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  }

  async runTests() {
    console.log('🚀 Starting responsive design testing...\n');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (const device of DEVICE_CONFIGS) {
        console.log(`Testing on ${device.name} (${device.width}x${device.height})`);
        await this.testDevice(browser, device);
      }
      
      await this.generateReport();
      console.log('\n✅ Responsive design testing completed!');
    } finally {
      await browser.close();
    }
  }

  async testDevice(browser, deviceConfig) {
    const page = await browser.newPage();
    
    // Set device configuration
    await page.setUserAgent(deviceConfig.userAgent);
    await page.setViewport({
      width: deviceConfig.width,
      height: deviceConfig.height,
      isMobile: deviceConfig.width < 768
    });

    const deviceResult = {
      device: deviceConfig.name,
      viewport: `${deviceConfig.width}x${deviceConfig.height}`,
      tests: [],
      issues: []
    };

    for (const testUrl of TEST_URLS) {
      console.log(`  📄 Testing: ${testUrl.name}`);
      const testResult = await this.testPage(page, testUrl, deviceConfig);
      deviceResult.tests.push(testResult);
      
      if (testResult.issues.length > 0) {
        deviceResult.issues.push(...testResult.issues.map(issue => 
          `${testUrl.name}: ${issue}`
        ));
      }
    }

    this.results.push(deviceResult);
    await page.close();
  }

  async testPage(page, testUrl, deviceConfig) {
    const url = `${this.baseUrl}${testUrl.url}`;
    const testResult = {
      page: testUrl.name,
      url: url,
      issues: [],
      measurements: {}
    };

    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Test responsive layout
      await this.testLayout(page, testResult, deviceConfig);
      
      // Test interactive elements
      await this.testInteractiveElements(page, testResult, deviceConfig);
      
      // Test navigation
      await this.testNavigation(page, testResult, deviceConfig);
      
      // Test content readability
      await this.testContentReadability(page, testResult, deviceConfig);

    } catch (error) {
      testResult.issues.push(`Navigation failed: ${error.message}`);
    }

    return testResult;
  }

  async testLayout(page, testResult, deviceConfig) {
    try {
      // Check for horizontal scrolling on mobile
      if (deviceConfig.width < 768) {
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        
        if (scrollWidth > clientWidth) {
          testResult.issues.push('Horizontal scrolling detected on mobile');
        }
      }

      // Check for proper container sizing
      const containerCheck = await page.evaluate(() => {
        const containers = document.querySelectorAll('.container, .max-w-*');
        let issues = [];
        
        containers.forEach(container => {
          const rect = container.getBoundingClientRect();
          if (rect.width > window.innerWidth) {
            issues.push('Container wider than viewport');
          }
        });
        
        return issues;
      });
      
      testResult.issues.push(...containerCheck);

    } catch (error) {
      testResult.issues.push(`Layout test failed: ${error.message}`);
    }
  }

  async testInteractiveElements(page, testResult, deviceConfig) {
    try {
      // Check button and link sizing for touch targets
      const touchTargetIssues = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('button, a, input, select');
        let issues = [];
        
        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const minWidth = 44;
          const minHeight = 44;
          
          if (rect.width < minWidth || rect.height < minHeight) {
            issues.push(`Touch target too small: ${element.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
          }
        });
        
        return issues;
      });
      
      testResult.issues.push(...touchTargetIssues);

    } catch (error) {
      testResult.issues.push(`Interactive elements test failed: ${error.message}`);
    }
  }

  async testNavigation(page, testResult, deviceConfig) {
    try {
      // Check if navigation is accessible and usable
      const navIssues = await page.evaluate(() => {
        const nav = document.querySelector('nav, [role="navigation"]');
        let issues = [];
        
        if (!nav) {
          issues.push('Navigation element not found');
          return issues;
        }
        
        // Check if navigation is visible
        const navStyle = window.getComputedStyle(nav);
        if (navStyle.display === 'none' || navStyle.visibility === 'hidden') {
          issues.push('Navigation is hidden');
        }
        
        return issues;
      });
      
      testResult.issues.push(...navIssues);

    } catch (error) {
      testResult.issues.push(`Navigation test failed: ${error.message}`);
    }
  }

  async testContentReadability(page, testResult, deviceConfig) {
    try {
      // Check font sizes
      const fontSizeIssues = await page.evaluate(() => {
        const body = document.querySelector('body');
        const bodyStyle = window.getComputedStyle(body);
        const fontSize = parseInt(bodyStyle.fontSize);
        
        let issues = [];
        if (fontSize < 14 && window.innerWidth < 768) {
          issues.push(`Body font size too small for mobile: ${fontSize}px`);
        }
        
        return issues;
      });
      
      testResult.issues.push(...fontSizeIssues);

    } catch (error) {
      testResult.issues.push(`Content readability test failed: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      devices: this.results,
      summary: this.generateSummary()
    };

    const reportDir = path.join(__dirname, '..', 'test-reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'responsive-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${reportPath}`);
    
    // Generate HTML report
    await this.generateHtmlReport(report);
  }

  generateSummary() {
    const summary = {
      totalDevices: this.results.length,
      totalTests: 0,
      passedTests: 0,
      totalIssues: 0,
      deviceIssues: {}
    };

    this.results.forEach(device => {
      summary.totalTests += device.tests.length;
      summary.totalIssues += device.issues.length;
      summary.deviceIssues[device.device] = device.issues.length;
      
      device.tests.forEach(test => {
        if (test.issues.length === 0) {
          summary.passedTests++;
        }
      });
    });

    return summary;
  }

  async generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Design Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; }
        .summary-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .good { color: #22c55e; }
        .warning { color: #f59e0b; }
        .bad { color: #ef4444; }
        .device-results { margin-bottom: 30px; }
        .device-header { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .device-name { font-size: 1.2em; font-weight: bold; }
        .device-viewport { color: #6b7280; }
        .test-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .test-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .test-name { font-weight: bold; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fee2e2; color: #991b1b; }
        .issues { margin-top: 10px; }
        .issue { margin-bottom: 5px; padding: 5px; background: #fffbeb; border-left: 3px solid #f59e0b; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Responsive Design Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div>Devices Tested</div>
                <div class="summary-value">${report.summary.totalDevices}</div>
            </div>
            <div class="summary-card">
                <div>Total Tests</div>
                <div class="summary-value">${report.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <div>Passed Tests</div>
                <div class="summary-value good">${report.summary.passedTests}</div>
            </div>
            <div class="summary-card">
                <div>Total Issues</div>
                <div class="summary-value ${report.summary.totalIssues > 0 ? 'bad' : 'good'}">${report.summary.totalIssues}</div>
            </div>
        </div>
        
        ${report.devices.map(device => `
            <div class="device-results">
                <div class="device-header">
                    <div class="device-name">${device.device}</div>
                    <div class="device-viewport">${device.viewport}</div>
                    <div>Issues: ${device.issues.length}</div>
                </div>
                
                <div class="test-results">
                    ${device.tests.map(test => `
                        <div class="test-card">
                            <div class="test-header">
                                <div class="test-name">${test.page}</div>
                                <div class="test-status ${test.issues.length === 0 ? 'status-pass' : 'status-fail'}">
                                    ${test.issues.length === 0 ? 'PASS' : 'FAIL'}
                                </div>
                            </div>
                            ${test.issues.length > 0 ? `
                                <div class="issues">
                                    ${test.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, '..', 'test-reports', 'responsive-test-report.html');
    await fs.writeFile(htmlPath, html);
    console.log(`📋 HTML report saved to: ${htmlPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ResponsiveTester();
  tester.runTests().catch(console.error);
}

module.exports = ResponsiveTester;