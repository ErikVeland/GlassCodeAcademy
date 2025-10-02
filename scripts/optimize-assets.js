#!/usr/bin/env node

/**
 * Asset Optimization Script
 * Optimizes images and other static assets for better performance
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Directories to optimize
const ASSET_DIRS = [
  'dot-net-quiz/frontend/public',
  'dot-net-quiz/frontend/src/assets'
];

class AssetOptimizer {
  constructor() {
    this.optimizedFiles = [];
    this.errors = [];
  }

  async run() {
    console.log('🚀 Starting asset optimization...\n');
    
    for (const dir of ASSET_DIRS) {
      const fullPath = path.join(__dirname, '..', dir);
      try {
        await this.optimizeDirectory(fullPath);
      } catch (error) {
        console.error(`Error optimizing directory ${dir}:`, error.message);
        this.errors.push(`Directory ${dir}: ${error.message}`);
      }
    }
    
    await this.generateReport();
    console.log('\n✅ Asset optimization completed!');
  }

  async optimizeDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          // Recursively optimize subdirectories
          await this.optimizeDirectory(filePath);
        } else if (stat.isFile()) {
          await this.optimizeFile(filePath);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async optimizeFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Optimize images
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      await this.optimizeImage(filePath);
    }
    
    // Optimize SVG files
    if (ext === '.svg') {
      await this.optimizeSvg(filePath);
    }
  }

  async optimizeImage(filePath) {
    try {
      // Check if image optimization tools are available
      await execAsync('which imagemin');
      
      const outputPath = filePath;
      const command = `imagemin ${filePath} --out-dir=${path.dirname(filePath)}`;
      
      await execAsync(command);
      this.optimizedFiles.push({ file: filePath, type: 'image' });
      console.log(`  ✅ Optimized image: ${path.basename(filePath)}`);
    } catch (error) {
      // If imagemin is not available, just log and continue
      console.log(`  ℹ️  Skipping image optimization for ${path.basename(filePath)} (imagemin not available)`);
    }
  }

  async optimizeSvg(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Simple SVG optimization - remove unnecessary whitespace and comments
      let optimized = content.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
      optimized = optimized.replace(/\s+/g, ' '); // Collapse whitespace
      optimized = optimized.replace(/>\s+</g, '><'); // Remove whitespace between tags
      optimized = optimized.trim();
      
      if (optimized !== content) {
        await fs.writeFile(filePath, optimized);
        this.optimizedFiles.push({ file: filePath, type: 'svg' });
        console.log(`  ✅ Optimized SVG: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`  ❌ Error optimizing SVG ${path.basename(filePath)}:`, error.message);
      this.errors.push(`SVG ${path.basename(filePath)}: ${error.message}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      optimizedFiles: this.optimizedFiles,
      errors: this.errors,
      summary: {
        totalOptimized: this.optimizedFiles.length,
        totalErrors: this.errors.length
      }
    };

    const reportPath = path.join(__dirname, '..', 'test-reports', 'asset-optimization-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Optimization report saved to: ${reportPath}`);
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new AssetOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = AssetOptimizer;