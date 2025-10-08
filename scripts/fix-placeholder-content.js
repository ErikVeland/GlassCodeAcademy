#!/usr/bin/env node

/**
 * Script to automatically fix placeholder content in lesson files
 * Replaces TODO comments and placeholder implementations with real examples
 */

const fs = require('fs');
const path = require('path');

// Module-specific real examples
const moduleExamples = {
  'performance-optimization': {
    title: 'Performance Optimization Techniques',
    example: "// Real Performance Optimization Example\n// Web Performance API for measuring Core Web Vitals\n\n// Measure First Contentful Paint (FCP)\nconst observer = new PerformanceObserver((list) => {\n  for (const entry of list.getEntries()) {\n    if (entry.name === 'first-contentful-paint') {\n      console.log('FCP:', entry.startTime);\n      \n      // Send to analytics\n      if ('sendBeacon' in navigator) {\n        navigator.sendBeacon('/analytics', JSON.stringify({\n          metric: 'FCP',\n          value: entry.startTime,\n          timestamp: Date.now()\n        }));\n      }\n    }\n  }\n});\n\nobserver.observe({ entryTypes: ['paint'] });\n\n// Optimize bundle loading with dynamic imports\nasync function loadExpensiveFeature() {\n  const { expensiveFeature } = await import('./expensive-feature.js');\n  return expensiveFeature();\n}\n\n// Implement requestIdleCallback for non-critical work\nfunction scheduleNonCriticalWork() {\n  if ('requestIdleCallback' in window) {\n    requestIdleCallback(() => {\n      // Perform analytics, logging, or other non-critical tasks\n      console.log('Running non-critical work during idle time');\n    }, { timeout: 2000 });\n  } else {\n    // Fallback for older browsers\n    setTimeout(() => {\n      console.log('Running non-critical work with setTimeout fallback');\n    }, 1);\n  }\n}\n\n// Virtualize long lists for better rendering performance\nclass VirtualList {\n  constructor(container, items, itemHeight) {\n    this.container = container;\n    this.items = items;\n    this.itemHeight = itemHeight;\n    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;\n    this.startIndex = 0;\n    \n    this.render();\n    this.addScrollListener();\n  }\n  \n  addScrollListener() {\n    this.container.addEventListener('scroll', () => {\n      const newStartIndex = Math.floor(this.container.scrollTop / this.itemHeight);\n      if (newStartIndex !== this.startIndex) {\n        this.startIndex = newStartIndex;\n        this.render();\n      }\n    });\n  }\n  \n  render() {\n    const fragment = document.createDocumentFragment();\n    const endIndex = Math.min(this.startIndex + this.visibleItems, this.items.length);\n    \n    for (let i = this.startIndex; i < endIndex; i++) {\n      const itemElement = document.createElement('div');\n      itemElement.style.height = `${this.itemHeight}px`;\n      itemElement.textContent = this.items[i];\n      fragment.appendChild(itemElement);\n    }\n    \n    this.container.innerHTML = '';\n    this.container.appendChild(fragment);\n  }\n}\n\n// Usage\nconst container = document.getElementById('virtual-list-container');\nconst items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);\nnew VirtualList(container, items, 50);",
    explanation: "This example demonstrates key performance optimization techniques including Core Web Vitals measurement with the Performance API, dynamic imports for code splitting, requestIdleCallback for scheduling non-critical work during browser idle time, and virtual scrolling for efficiently rendering large lists. These techniques help improve loading performance, runtime responsiveness, and overall user experience."
  }
};

// Get all lesson files
const lessonsDir = path.join(__dirname, '..', 'content', 'lessons');
const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith('.json'));

console.log('Found ' + lessonFiles.length + ' lesson files to process...');

// Process each lesson file
lessonFiles.forEach(file => {
  const filePath = path.join(lessonsDir, file);
  console.log('Processing ' + file + '...');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let lessons = JSON.parse(fileContent);
    
    // Check if it's an array of lessons or a single lesson object
    const isArrayOfLessons = Array.isArray(lessons);
    const lessonsToProcess = isArrayOfLessons ? lessons : [lessons];
    
    let modified = false;
    
    // Process each lesson
    lessonsToProcess.forEach(lesson => {
      // Check for placeholder content
      if (lesson.code && lesson.code.example) {
        // Check if it contains TODO or placeholder comments
        if (lesson.code.example.includes('// TODO:') || 
            lesson.code.example.includes('// Placeholder implementation') ||
            lesson.code.example.includes("console.log('Performance Optimization example');")) {
          
          const moduleSlug = lesson.moduleSlug;
          
          // Replace with real example if available
          if (moduleExamples[moduleSlug]) {
            lesson.code.example = moduleExamples[moduleSlug].example;
            lesson.code.explanation = moduleExamples[moduleSlug].explanation;
            lesson.title = moduleExamples[moduleSlug].title;
            modified = true;
            console.log('  Replaced placeholder content in lesson ' + lesson.id);
          } else {
            console.log('  No replacement available for ' + lesson.id + ', keeping original');
          }
        }
      }
      
      // Fix generic objectives and intros
      if (lesson.objectives && lesson.objectives.length > 0) {
        // Check if objectives are generic placeholders
        const firstObjective = lesson.objectives[0];
        if (firstObjective.includes('Apply advanced') || firstObjective.includes('Implement basic')) {
          // Replace with more specific objectives based on lesson title
          if (lesson.title.includes('Performance')) {
            lesson.objectives = [
              "Measure and analyze Core Web Vitals using Performance API",
              "Implement code splitting with dynamic imports for better loading performance",
              "Optimize runtime performance with virtual scrolling and requestIdleCallback"
            ];
            modified = true;
            console.log('  Updated objectives for lesson ' + lesson.id);
          }
        }
      }
      
      // Fix generic intros
      if (lesson.intro && lesson.intro.includes('Welcome to')) {
        // Check if it's a generic intro
        if (lesson.intro.includes('essential concepts and practical applications that form the foundation')) {
          if (lesson.title.includes('Performance')) {
            lesson.intro = "Performance optimization is critical for creating fast, responsive web applications that provide excellent user experiences. In this lesson, you'll learn how to measure key performance metrics using the Web Performance API, implement code splitting with dynamic imports, and optimize runtime performance with techniques like virtual scrolling and idle callback scheduling.\n\nCore Web Vitals have become essential metrics for measuring user experience quality, directly impacting SEO rankings and user engagement. You'll discover how to measure First Contentful Paint (FCP), Largest Contentful Paint (LCP), and Cumulative Layout Shift (CLS) to understand your application's performance characteristics.\n\nCode splitting allows you to load only the necessary JavaScript for the current view, reducing initial bundle sizes and improving loading times. You'll learn how to implement dynamic imports and route-based code splitting in modern JavaScript applications.\n\nRuntime performance optimization techniques like virtual scrolling help maintain smooth interactions even with large datasets, while requestIdleCallback enables you to perform non-critical work during browser idle periods without impacting user experience.\n\nBy the end of this lesson, you'll be able to identify performance bottlenecks, implement targeted optimizations, and measure the impact of your improvements to ensure optimal user experiences.";
            modified = true;
            console.log('  Updated intro for lesson ' + lesson.id);
          }
        }
      }
    });
    
    // Write back to file if modified
    if (modified) {
      const output = isArrayOfLessons ? lessonsToProcess : lessonsToProcess[0];
      fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
      console.log('  ✓ Updated ' + file);
    } else {
      console.log('  No changes needed for ' + file);
    }
  } catch (error) {
    console.error('  ❌ Error processing ' + file + ': ' + error.message);
  }
});

console.log('Placeholder content fixing complete!');