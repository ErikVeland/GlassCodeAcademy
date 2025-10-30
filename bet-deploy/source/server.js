import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests to Neds API
app.use('/api', createProxyMiddleware({
  target: 'https://api.neds.com.au',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix
  }
}));

// Serve index.html for all non-API routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log('Server running at http://localhost:' + port);
});