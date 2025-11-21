#!/usr/bin/env node

const http = require('http');

// Configuration
const PORT = process.env.PORT || 8081;
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

// Health check function
function checkHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.status === 'healthy') {
              resolve('Health check passed');
            } else {
              reject(
                new Error('Health check failed: Unexpected response format')
              );
            }
          } catch (parseError) {
            reject(
              new Error(
                `Health check failed: Invalid JSON response - ${parseError.message}`
              )
            );
          }
        } else {
          reject(new Error(`Health check failed: HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Health check failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check failed: Request timeout'));
    });

    req.end();
  });
}

// Run health check
async function runHealthCheck() {
  try {
    console.log('Running health check...');
    const result = await checkHealth();
    console.log(result);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

// Execute health check
runHealthCheck();
