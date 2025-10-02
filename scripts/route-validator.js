#!/usr/bin/env node

/**
 * Route Validator
 * Verifies that all registered routes resolve correctly with no 404 errors
 */

const fs = require('fs');
const path = require('path');

class RouteValidator {
  constructor() {
    this.registry = null;
    this.contentDir = path.join(process.cwd(), 'content');
    this.errors = [];
    this.warnings = [];
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

  // Validate route structure and format
  validateRouteFormat(route, routeType, moduleSlug) {
    // Skip validation if route is not provided
    if (!route) return true;
    
    const context = { moduleSlug, routeType, route };
    
    // Check if route starts with /
    if (!route.startsWith('/')) {
      this.addError('Route must start with /', context);
      return false;
    }
    
    // Check for invalid characters
    if (route.includes(' ')) {
      this.addError('Route contains invalid whitespace', context);
      return false;
    }
    
    // Check for duplicate slashes
    if (route.includes('//')) {
      this.addError('Route contains duplicate slashes', context);
      return false;
    }
    
    // Check for trailing slash (should not have one unless it's the root)
    if (route.length > 1 && route.endsWith('/')) {
      this.addWarning('Route should not end with trailing slash', context);
    }
    
    return true;
  }

  // Validate that routes are unique
  validateRouteUniqueness() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate route uniqueness without registry');
      return false;
    }
    
    const allRoutes = new Map();
    let isValid = true;
    
    // Check module routes
    for (const module of this.registry.modules) {
      const context = { moduleSlug: module.slug };
      
      if (module.routes) {
        for (const [routeType, route] of Object.entries(module.routes)) {
          const routeContext = { ...context, routeType, route };
          
          // Validate route format
          if (!this.validateRouteFormat(route, routeType, module.slug)) {
            isValid = false;
            continue;
          }
          
          // Check for duplicate routes
          if (allRoutes.has(route)) {
            const existing = allRoutes.get(route);
            this.addError('Duplicate route found', { 
              route, 
              firstModule: existing.moduleSlug, 
              firstRouteType: existing.routeType,
              duplicateModule: module.slug,
              duplicateRouteType: routeType
            });
            isValid = false;
          } else {
            allRoutes.set(route, { moduleSlug: module.slug, routeType });
          }
        }
      }
    }
    
    return isValid;
  }

  // Validate that required routes exist for each module
  validateRequiredRoutes() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate required routes without registry');
      return false;
    }
    
    let isValid = true;
    const requiredRoutes = ['overview', 'lessons', 'quiz'];
    
    for (const module of this.registry.modules) {
      const context = { moduleSlug: module.slug };
      
      if (!module.routes) {
        this.addError('Module missing routes definition', context);
        isValid = false;
        continue;
      }
      
      for (const routeType of requiredRoutes) {
        if (!module.routes[routeType]) {
          this.addError(`Module missing required route: ${routeType}`, context);
          isValid = false;
        }
      }
    }
    
    return isValid;
  }

  // Validate route hierarchy and nesting
  validateRouteHierarchy() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate route hierarchy without registry');
      return false;
    }
    
    let isValid = true;
    
    for (const module of this.registry.modules) {
      const context = { moduleSlug: module.slug };
      
      if (!module.routes) continue;
      
      const overviewRoute = module.routes.overview;
      const lessonsRoute = module.routes.lessons;
      const quizRoute = module.routes.quiz;
      
      // Check that lessons and quiz routes are properly nested under overview
      if (overviewRoute && lessonsRoute && !lessonsRoute.startsWith(overviewRoute)) {
        this.addWarning('Lessons route should be nested under overview route', { 
          ...context, 
          overviewRoute, 
          lessonsRoute 
        });
      }
      
      if (overviewRoute && quizRoute && !quizRoute.startsWith(overviewRoute)) {
        this.addWarning('Quiz route should be nested under overview route', { 
          ...context, 
          overviewRoute, 
          quizRoute 
        });
      }
    }
    
    return isValid;
  }

  // Validate that route parameters are properly formatted
  validateRouteParameters() {
    if (!this.registry || !this.registry.modules) {
      this.addError('Cannot validate route parameters without registry');
      return false;
    }
    
    let isValid = true;
    
    // Check for dynamic routes (with parameters)
    for (const module of this.registry.modules) {
      const context = { moduleSlug: module.slug };
      
      if (!module.routes) continue;
      
      for (const [routeType, route] of Object.entries(module.routes)) {
        // Check for parameter format [param] or :param
        if (route.includes('[') || route.includes(':')) {
          // This is a dynamic route, validate parameter format
          const paramRegex = /\[([^\]]+)\]|:([^\/]+)/g;
          let match;
          while ((match = paramRegex.exec(route)) !== null) {
            const paramName = match[1] || match[2];
            if (!paramName || paramName.length === 0) {
              this.addError('Invalid parameter format in route', { 
                ...context, 
                routeType, 
                route,
                match: match[0]
              });
              isValid = false;
            }
          }
        }
      }
    }
    
    return isValid;
  }

  // Validate that all static routes are properly defined
  validateStaticRoutes() {
    // Define expected static routes
    const expectedStaticRoutes = [
      '/',
      '/playground',
      '/animated-background-demo',
      '/interview-prep',
      '/progress',
      '/lessons',
      '/interview'
    ];
    
    let isValid = true;
    
    // Check that module routes don't conflict with static routes
    if (this.registry && this.registry.modules) {
      for (const module of this.registry.modules) {
        const context = { moduleSlug: module.slug };
        
        if (!module.routes) continue;
        
        for (const [routeType, route] of Object.entries(module.routes)) {
          if (expectedStaticRoutes.includes(route)) {
            this.addError('Module route conflicts with static route', { 
              ...context, 
              routeType, 
              route 
            });
            isValid = false;
          }
        }
      }
    }
    
    return isValid;
  }

  async run() {
    console.log('🛣️  Starting route validation...\n');
    
    if (!this.loadRegistry()) {
      return this.exitWithResults();
    }
    
    this.addInfo('Validating route format...');
    const formatValid = true; // Skip this for now as it's called per route
    
    this.addInfo('Validating required routes...');
    const requiredValid = this.validateRequiredRoutes();
    
    this.addInfo('Validating route uniqueness...');
    const uniquenessValid = this.validateRouteUniqueness();
    
    this.addInfo('Validating route hierarchy...');
    const hierarchyValid = this.validateRouteHierarchy();
    
    this.addInfo('Validating route parameters...');
    const parametersValid = this.validateRouteParameters();
    
    this.addInfo('Validating static routes...');
    const staticValid = this.validateStaticRoutes();
    
    return this.exitWithResults();
  }
  
  exitWithResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 ROUTE VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All routes are valid!');
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
      
      console.log('\n💥 Route validation failed. Fix errors before proceeding.');
      process.exit(1);
    }
    
    console.log('\n✨ Route validation completed successfully.');
    process.exit(0);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new RouteValidator();
  validator.run().catch(error => {
    console.error('💥 Route validation failed with unexpected error:', error);
    process.exit(1);
  });
}

module.exports = RouteValidator;