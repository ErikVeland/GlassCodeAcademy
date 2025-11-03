const fs = require('fs');

function summarize() {
  const inputPath = 'jest-results.json';
  const outputPath = 'jest-summary.txt';
  try {
    const raw = fs.readFileSync(inputPath, 'utf8');
    const json = JSON.parse(raw);
    const total = json.numTotalTests ?? (json.testResults || []).reduce((a, tr) => a + tr.assertionResults.length, 0);
    const passed = json.numPassedTests ?? (json.testResults || []).reduce((a, tr) => a + tr.assertionResults.filter(ar => ar.status === 'passed').length, 0);
    const failed = json.numFailedTests ?? (json.testResults || []).reduce((a, tr) => a + tr.assertionResults.filter(ar => ar.status === 'failed').length, 0);

    const lines = [`Total: ${total}`, `Passed: ${passed}`, `Failed: ${failed}`];
    for (const tr of (json.testResults || [])) {
      for (const ar of tr.assertionResults) {
        if (ar.status === 'failed') {
          lines.push(`FAIL: ${ar.fullName} [${tr.name}]`);
          if (ar.failureMessages && ar.failureMessages.length) {
            lines.push(ar.failureMessages[0].split('\n').slice(0, 6).join('\n'));
          }
        }
      }
    }
    fs.writeFileSync(outputPath, lines.join('\n'));
    console.log(lines.join('\n'));
  } catch (e) {
    console.error('Parse error:', e.message);
  }
}

summarize();