#!/usr/bin/env node

/**
 * Validate API routes for Next.js 15 compatibility
 * Specifically checks for proper parameter handling in dynamic routes
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const NC = '\x1b[0m';

function log(message, color = NC) {
  console.log(`${color}${message}${NC}`);
}

function findApiRoutes(dir) {
  const routes = [];
  
  function scanDirectory(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item === 'route.ts' || item === 'route.js') {
          routes.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(dir);
  return routes;
}

function validateApiRoute(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check if this is a dynamic route (contains [...] in path)
    const isDynamicRoute = filePath.includes('[') && filePath.includes(']');
    
    if (isDynamicRoute) {
      // Check for GET function with parameters
      const getExportMatch = content.match(/export\s+async\s+function\s+GET\s*\([^)]*\)/);
      
      if (getExportMatch) {
        const getFunctionSignature = getExportMatch[0];
        
        // Check for old Next.js parameter pattern
        if (getFunctionSignature.includes('{ params }') && !getFunctionSignature.includes('Promise<')) {
          issues.push({
            type: 'parameter_type',
            message: `Potential Next.js 15 parameter type issue in GET function`,
            suggestion: `Parameters should be typed as Promise<{ paramName: string }> in Next.js 15`
          });
        }
        
        // Check if params is being awaited in the function body
        if (content.includes('{ params }') && !content.includes('await params')) {
          issues.push({
            type: 'parameter_await',
            message: `Parameters should be awaited in Next.js 15`,
            suggestion: `Use 'const { paramName } = await params;' instead of direct destructuring`
          });
        }
      }
      
      // Check for other HTTP methods with similar issues
      const httpMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      for (const method of httpMethods) {
        const methodMatch = content.match(new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)`));
        if (methodMatch && methodMatch[0].includes('{ params }') && !methodMatch[0].includes('Promise<')) {
          issues.push({
            type: 'parameter_type',
            message: `Potential Next.js 15 parameter type issue in ${method} function`,
            suggestion: `Parameters should be typed as Promise<{ paramName: string }> in Next.js 15`
          });
        }
      }
    }
    
    return { filePath: relativePath, issues };
  } catch (error) {
    return { 
      filePath: path.relative(process.cwd(), filePath), 
      issues: [{ 
        type: 'read_error', 
        message: `Failed to read file: ${error.message}` 
      }] 
    };
  }
}

function main() {
  log('🔍 Validating API routes for Next.js 15 compatibility...', YELLOW);
  
  const frontendDir = path.join(process.cwd(), 'glasscode', 'frontend', 'src', 'app');
  
  if (!fs.existsSync(frontendDir)) {
    log('Frontend app directory not found, skipping API route validation', YELLOW);
    return 0;
  }
  
  const apiRoutes = findApiRoutes(frontendDir);
  
  if (apiRoutes.length === 0) {
    log('No API routes found', GREEN);
    return 0;
  }
  
  log(`Found ${apiRoutes.length} API route(s) to validate`, NC);
  
  let totalIssues = 0;
  
  for (const routePath of apiRoutes) {
    const result = validateApiRoute(routePath);
    
    if (result.issues.length > 0) {
      log(`\n❌ Issues found in ${result.filePath}:`, RED);
      for (const issue of result.issues) {
        log(`  • ${issue.message}`, RED);
        if (issue.suggestion) {
          log(`    💡 ${issue.suggestion}`, YELLOW);
        }
      }
      totalIssues += result.issues.length;
    } else {
      log(`✅ ${result.filePath}`, GREEN);
    }
  }
  
  if (totalIssues > 0) {
    log(`\n❌ Found ${totalIssues} issue(s) in API routes`, RED);
    log('These issues could cause build failures in production', RED);
    return 1;
  } else {
    log('\n✅ All API routes passed validation', GREEN);
    return 0;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { validateApiRoute, findApiRoutes };