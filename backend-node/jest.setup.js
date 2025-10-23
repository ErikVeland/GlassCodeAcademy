const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

(function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '.env.test'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../.env.test'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../.env.test')
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
})();