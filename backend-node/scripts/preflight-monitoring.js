#!/usr/bin/env node

/**
 * Preflight checks for monitoring components
 * Validates that all monitoring components are properly configured
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m'; // No Color

function section(name) {
  console.log(`\n${YELLOW}==> ${name}${NC}`);
}

function fail(message) {
  console.error(`${RED}❌ ${message}${NC}`);
  process.exit(1);
}

function ok(message) {
  console.log(`${GREEN}✅ ${message}${NC}`);
}

function warn(message) {
  console.log(`${YELLOW}⚠️  ${message}${NC}`);
}

// Move to repo root
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

section('Monitoring Component Validation');

// Check if required files exist
const requiredFiles = [
  'src/utils/tracing.js',
  'src/middleware/userJourneyMiddleware.js',
  'src/middleware/sloTrackingMiddleware.js',
  'src/utils/metrics.js',
  'src/middleware/metricsMiddleware.js',
  'alerts.rules',
  'alertmanager.yml',
  'prometheus.yml',
  'grafana-dashboard.json'
];

console.log('Checking required monitoring files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    ok(`${file} exists`);
  } else {
    fail(`${file} is missing`);
  }
}

// Check if Docker Compose includes monitoring services
section('Docker Compose Validation');
console.log('Checking docker-compose.yml for monitoring services...');
try {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  const requiredServices = ['prometheus', 'grafana', 'jaeger', 'alertmanager'];
  
  for (const service of requiredServices) {
    if (dockerCompose.includes(service)) {
      ok(`${service} service found in docker-compose.yml`);
    } else {
      fail(`${service} service missing from docker-compose.yml`);
    }
  }
} catch (error) {
  fail(`Failed to read docker-compose.yml: ${error.message}`);
}

// Check if server.js includes monitoring middleware
section('Server Configuration Validation');
console.log('Checking server.js for monitoring middleware...');
try {
  const serverJs = fs.readFileSync('server.js', 'utf8');
  const requiredMiddleware = [
    'metricsMiddleware',
    'sloTrackingMiddleware',
    'userJourneyMiddleware'
  ];
  
  for (const middleware of requiredMiddleware) {
    if (serverJs.includes(middleware)) {
      ok(`${middleware} found in server.js`);
    } else {
      fail(`${middleware} missing from server.js`);
    }
  }
} catch (error) {
  fail(`Failed to read server.js: ${error.message}`);
}

// Check if progress service uses tracing
section('Service Instrumentation Validation');
console.log('Checking progress service for tracing instrumentation...');
try {
  const progressService = fs.readFileSync('src/services/progressService.js', 'utf8');
  const requiredTracingImports = [
    'traceAsyncFunction',
    'addDatabaseQueryInfo'
  ];
  
  for (const importName of requiredTracingImports) {
    if (progressService.includes(importName)) {
      ok(`${importName} found in progress service`);
    } else {
      fail(`${importName} missing from progress service`);
    }
  }
} catch (error) {
  fail(`Failed to read progress service: ${error.message}`);
}

// Check alert rules
section('Alert Rules Validation');
console.log('Checking alerts.rules for required alert definitions...');
try {
  const alertsRules = fs.readFileSync('alerts.rules', 'utf8');
  const requiredAlerts = [
    'HighErrorRate',
    'HighLatency',
    'ServiceDown',
    'DatabasePerformance',
    'LowSuccessRate'
  ];
  
  for (const alert of requiredAlerts) {
    if (alertsRules.includes(alert)) {
      ok(`${alert} alert rule found`);
    } else {
      fail(`${alert} alert rule missing`);
    }
  }
} catch (error) {
  fail(`Failed to read alerts.rules: ${error.message}`);
}

// Check Grafana dashboard
section('Grafana Dashboard Validation');
console.log('Checking grafana-dashboard.json for required panels...');
try {
  const grafanaDashboard = JSON.parse(fs.readFileSync('grafana-dashboard.json', 'utf8'));
  const panels = grafanaDashboard.dashboard.panels;
  
  // Check for required panel types
  const requiredPanelTitles = [
    'Request Rate',
    'Error Rate',
    'Latency (p95)',
    'Database Query Performance',
    'Success Rate',
    'API Availability SLO',
    'API Latency SLO',
    'Database Query SLO',
    'Error Budget Remaining'
  ];
  
  const foundPanels = panels.map(panel => panel.title);
  
  for (const title of requiredPanelTitles) {
    if (foundPanels.includes(title)) {
      ok(`${title} panel found`);
    } else {
      fail(`${title} panel missing`);
    }
  }
} catch (error) {
  fail(`Failed to read/parse grafana-dashboard.json: ${error.message}`);
}

section('Summary');
ok('All monitoring component preflight checks passed');
console.log('\nNext steps:');
console.log('1. Start monitoring services: docker-compose up -d');
console.log('2. Run the application: npm start');
console.log('3. Access Grafana at http://localhost:3002');
console.log('4. Access Prometheus at http://localhost:9090');
console.log('5. Access Jaeger at http://localhost:16686');
console.log('6. Access Alertmanager at http://localhost:9093');