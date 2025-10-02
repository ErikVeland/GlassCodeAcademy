#!/usr/bin/env node

/**
 * Link Checker
 * Validates internal and external links in content
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class LinkChecker {
  constructor() {
    this.registry = null;
    this.contentDir = path.join(process.cwd(), 'content');
    this.lessonsDir = path.join(this.contentDir, 'lessons');
    this.quizzesDir = path.join(this.contentDir, 'quizzes');
    this.errors = [];
    this.warnings = [];
    this.checkedUrls = new Map(); // Cache for checked URLs
  }

  addError(message, context = null) {
    this.errors.push({ message, context, type: 'error' });
    console.error(`❌ ERROR: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
  }

  addWarning(message, context = null) {
    this.warnings.push({ message, context, type: 'warning' });
    console.warn(`⚠️  WARNING: ${message}`, context ? `\n   Context: ${JSON.stringify(context)}` : '');
  }

  addInfo(message) {
    console.log(`ℹ️  INFO: ${message}`);
  }

  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      this.addError('Content registry not found', { path: registryPath });
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      this.addInfo(`Loaded content registry with ${this.registry.modules.length} modules`);
      return true;
    } catch (error) {
      this.addError('Failed to parse content registry', { error: error.message });
      return false;
    }
  }

  // Check if URL is external (http/https)
  isExternalUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // Check if URL is internal route
  isInternalRoute(url) {
    return url.startsWith('/') && !this.isExternalUrl(url);
  }

  // Validate internal routes exist in registry
  validateInternalRoute(url) {
    if (!this.registry) return false;

    // Check if it's a module route
    for (const module of this.registry.modules) {
      if (module.routes) {
        for (const [routeType, routePath] of Object.entries(module.routes)) {
          if (url === routePath) {
            return true;
          }
          // Check if it's a sub-route (e.g., /modules/dotnet-fundamentals/lessons/1)
          if (url.startsWith(routePath)) {
            return true;
          }
        }
      }
    }

    // Check static routes
    const staticRoutes = [
      '/', '/playground', '/animated-background-demo', '/interview-prep',
      '/progress', '/lessons', '/interview'
    ];

    return staticRoutes.includes(url) || staticRoutes.some(route => url.startsWith(route + '/'));
  }

  // Check external URL accessibility
  async checkExternalUrl(url) {
    // Return cached result if available
    if (this.checkedUrls.has(url)) {
      return this.checkedUrls.get(url);
    }

    return new Promise((resolve) => {
      const protocol = url.startsWith('https://') ? https : http;
      
      const request = protocol.get(url, { timeout: 10000 }, (response) => {
        const result = {
          status: response.statusCode,
          ok: response.statusCode >= 200 && response.statusCode < 400
        };
        this.checkedUrls.set(url, result);
        resolve(result);
      });

      request.on('error', (error) => {
        const result = {
          status: null,
          ok: false,
          error: error.message
        };
        this.checkedUrls.set(url, result);
        resolve(result);
      });

      request.on('timeout', () => {
        request.destroy();
        const result = {
          status: null,
          ok: false,
          error: 'Timeout'
        };
        this.checkedUrls.set(url, result);
        resolve(result);
      });

      request.setTimeout(10000);
    });
  }

  // Extract URLs from text content
  extractUrls(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Regular expression to match URLs
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
    const matches = text.match(urlRegex) || [];
    
    // Also check for markdown links [text](url)
    const markdownLinks = text.match(/\[.*?\]\((https?:\/\/[^\s/$.?#].[^\s]*)\)/g) || [];
    const markdownUrls = markdownLinks.map(link => {
      const match = link.match(/\((https?:\/\/[^\s/$.?#].[^\s]*)\)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    return [...matches, ...markdownUrls];
  }

  // Check URLs in lesson content
  async checkLessonUrls(lesson, moduleSlug, lessonIndex) {
    const context = { moduleSlug, lessonIndex, lessonId: lesson.id };
    const urls = new Set();

    // Extract URLs from intro
    if (lesson.intro) {
      this.extractUrls(lesson.intro).forEach(url => urls.add(url));
    }

    // Extract URLs from code explanations
    if (lesson.code && lesson.code.explanation) {
      this.extractUrls(lesson.code.explanation).forEach(url => urls.add(url));
    }

    // Extract URLs from pitfalls
    if (lesson.pitfalls && Array.isArray(lesson.pitfalls)) {
      lesson.pitfalls.forEach(pitfall => {
        if (pitfall.solution) {
          this.extractUrls(pitfall.solution).forEach(url => urls.add(url));
        }
      });
    }

    // Extract URLs from exercises
    if (lesson.exercises && Array.isArray(lesson.exercises)) {
      lesson.exercises.forEach(exercise => {
        if (exercise.description) {
          this.extractUrls(exercise.description).forEach(url => urls.add(url));
        }
        if (exercise.checkpoints && Array.isArray(exercise.checkpoints)) {
          exercise.checkpoints.forEach(checkpoint => {
            this.extractUrls(checkpoint).forEach(url => urls.add(url));
          });
        }
      });
    }

    // Check each URL
    for (const url of urls) {
      if (this.isExternalUrl(url)) {
        try {
          const result = await this.checkExternalUrl(url);
          if (!result.ok) {
            this.addWarning(`Broken external link in lesson`, { 
              ...context, 
              url, 
              status: result.status, 
              error: result.error 
            });
          }
        } catch (error) {
          this.addWarning(`Error checking external link in lesson`, { 
            ...context, 
            url, 
            error: error.message 
          });
        }
      } else if (this.isInternalRoute(url)) {
        if (!this.validateInternalRoute(url)) {
          this.addError(`Broken internal link in lesson`, { ...context, url });
        }
      }
    }
  }

  // Check URLs in quiz content
  async checkQuizUrls(quiz, moduleSlug) {
    const context = { moduleSlug };
    const urls = new Set();

    // Extract URLs from questions
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach((question, index) => {
        context.questionIndex = index;
        
        if (question.question) {
          this.extractUrls(question.question).forEach(url => urls.add(url));
        }
        
        if (question.explanation) {
          this.extractUrls(question.explanation).forEach(url => urls.add(url));
        }
        
        if (question.industryContext) {
          this.extractUrls(question.industryContext).forEach(url => urls.add(url));
        }
      });
    }

    // Check each URL
    for (const url of urls) {
      if (this.isExternalUrl(url)) {
        try {
          const result = await this.checkExternalUrl(url);
          if (!result.ok) {
            this.addWarning(`Broken external link in quiz`, { 
              ...context, 
              url, 
              status: result.status, 
              error: result.error 
            });
          }
        } catch (error) {
          this.addWarning(`Error checking external link in quiz`, { 
            ...context, 
            url, 
            error: error.message 
          });
        }
      } else if (this.isInternalRoute(url)) {
        if (!this.validateInternalRoute(url)) {
          this.addError(`Broken internal link in quiz`, { ...context, url });
        }
      }
    }
  }

  // Check all lessons for a module
  async checkModuleLessons(module) {
    const lessonsPath = path.join(this.lessonsDir, `${module.slug}.json`);
    const context = { moduleSlug: module.slug, lessonsPath };

    if (!fs.existsSync(lessonsPath)) {
      this.addWarning(`Missing lessons file for module`, context);
      return;
    }

    try {
      const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
      const lessons = JSON.parse(lessonsContent);

      if (!Array.isArray(lessons)) {
        this.addError(`Lessons file must contain an array`, context);
        return;
      }

      for (let i = 0; i < lessons.length; i++) {
        await this.checkLessonUrls(lessons[i], module.slug, i);
      }
    } catch (error) {
      this.addError(`Failed to parse lessons file`, { ...context, error: error.message });
    }
  }

  // Check quiz for a module
  async checkModuleQuiz(module) {
    const quizPath = path.join(this.quizzesDir, `${module.slug}.json`);
    const context = { moduleSlug: module.slug, quizPath };

    if (!fs.existsSync(quizPath)) {
      this.addWarning(`Missing quiz file for module`, context);
      return;
    }

    try {
      const quizContent = fs.readFileSync(quizPath, 'utf8');
      const quiz = JSON.parse(quizContent);
      await this.checkQuizUrls(quiz, module.slug);
    } catch (error) {
      this.addError(`Failed to parse quiz file`, { ...context, error: error.message });
    }
  }

  // Check all content for link issues
  async checkAllContent() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot check content without registry');
      return false;
    }

    this.addInfo('Checking links in all content...');

    for (const module of this.registry.modules) {
      await this.checkModuleLessons(module);
      await this.checkModuleQuiz(module);
    }

    return true;
  }

  async run() {
    console.log('🔗 Starting link checker...\n');

    if (!this.loadRegistry()) {
      return this.exitWithResults();
    }

    await this.checkAllContent();

    return this.exitWithResults();
  }

  exitWithResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 LINK CHECKER RESULTS');
    console.log('='.repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All links are valid!');
      process.exit(0);
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings found:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`);
        if (warning.context) {
          console.log(`      Context: ${JSON.stringify(warning.context)}`);
        }
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ ${this.errors.length} errors found:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message}`);
        if (error.context) {
          console.log(`      Context: ${JSON.stringify(error.context)}`);
        }
      });
      
      console.log('\n💥 Link checking failed. Fix errors before proceeding.');
      process.exit(1);
    }

    console.log('\n✨ Link checking completed successfully.');
    process.exit(0);
  }
}

// CLI execution
if (require.main === module) {
  const checker = new LinkChecker();
  checker.run().catch(error => {
    console.error('💥 Link checking failed with unexpected error:', error);
    process.exit(1);
  });
}

module.exports = LinkChecker;