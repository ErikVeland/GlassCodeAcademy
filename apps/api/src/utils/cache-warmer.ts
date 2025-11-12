import {
  getAllModules,
  getLessonsByModuleSlug,
  getQuizzesByModuleSlug,
} from './optimized-content';

/**
 * Cache warming utility to pre-load frequently accessed content
 * This helps improve response times for popular modules by ensuring
 * their data is already in cache when first requested
 */

// List of modules that should be prioritized for cache warming
// These are typically the most popular or frequently accessed modules
const PRIORITY_MODULES = [
  'programming-fundamentals',
  'web-fundamentals',
  'react-fundamentals',
  'node-fundamentals',
  'database-systems',
];

// List of all modules to be cached during warm-up
let allModules: string[] = [];

/**
 * Warm up the cache by pre-loading registry and priority module data
 */
export async function warmUpCache(): Promise<void> {
  try {
    console.log('Starting cache warm-up process...');

    // Load registry first
    const modules = await getAllModules();
    allModules = modules.map((m) => m.slug);

    console.log(`Found ${allModules.length} modules to cache`);

    // Warm up priority modules first
    console.log('Warming up priority modules...');
    for (const slug of PRIORITY_MODULES) {
      if (allModules.includes(slug)) {
        await warmUpModule(slug);
      }
    }

    // Warm up all remaining modules
    console.log('Warming up remaining modules...');
    for (const slug of allModules) {
      if (!PRIORITY_MODULES.includes(slug)) {
        await warmUpModule(slug);
      }
    }

    console.log('Cache warm-up completed successfully');
  } catch (error) {
    console.error('Error during cache warm-up:', error);
  }
}

/**
 * Warm up a specific module by loading its lessons and quizzes
 * @param moduleSlug The slug of the module to warm up
 */
async function warmUpModule(moduleSlug: string): Promise<void> {
  try {
    // Load lessons for the module
    await getLessonsByModuleSlug(moduleSlug);

    // Load quizzes for the module
    await getQuizzesByModuleSlug(moduleSlug);

    console.log(`Warmed up cache for module: ${moduleSlug}`);
  } catch (error) {
    console.warn(`Failed to warm up cache for module ${moduleSlug}:`, error);
  }
}

/**
 * Schedule periodic cache warming
 * This ensures cache stays fresh and populated
 * @param intervalMinutes How often to run cache warming in minutes
 */
export function scheduleCacheWarming(intervalMinutes: number = 30): void {
  // Run immediately on startup
  warmUpCache();

  // Schedule periodic warming
  setInterval(
    () => {
      warmUpCache();
    },
    intervalMinutes * 60 * 1000
  ); // Convert minutes to milliseconds

  console.log(`Cache warming scheduled every ${intervalMinutes} minutes`);
}

/**
 * Get list of all modules being cached
 */
export function getCachedModules(): string[] {
  return [...allModules];
}

/**
 * Get priority modules list
 */
export function getPriorityModules(): string[] {
  return [...PRIORITY_MODULES];
}
