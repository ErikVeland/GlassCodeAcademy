import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';

// Basic schemas to assert expected shapes from JSON content files
const ModuleSchema = z.object({
  slug: z.string(),
  title: z.string().optional(),
  legacySlugs: z.array(z.string()).optional(),
});

const RegistrySchema = z.object({
  modules: z.array(ModuleSchema),
});

export type Registry = z.infer<typeof RegistrySchema>;
export type Module = z.infer<typeof ModuleSchema>;

// Caching layers
const cache = {
  registry: null as Registry | null,
  registryTimestamp: 0,
  lessons: new Map<string, any>(),
  lessonsTimestamps: new Map<string, number>(),
  quizzes: new Map<string, any>(),
  quizzesTimestamps: new Map<string, number>(),
  lessonIndex: null as Map<string, string> | null,
  lessonIndexTimestamp: 0,
};

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const CONTENT_DIR_CACHE = new Map<string, string>();

function resolveContentDir(): string {
  // Check cache first
  const cwd = process.cwd();
  if (CONTENT_DIR_CACHE.has(cwd)) {
    return CONTENT_DIR_CACHE.get(cwd)!;
  }

  // Try common locations relative to apps/api
  const candidates = [
    path.resolve(cwd, '../..', 'content'),
    path.resolve(cwd, '..', 'content'),
    path.resolve(cwd, 'content'),
  ];

  for (const candidate of candidates) {
    try {
      // Check if directory exists
      const stat = fs.statSync(candidate);
      if (stat.isDirectory()) {
        CONTENT_DIR_CACHE.set(cwd, candidate);
        return candidate;
      }
    } catch {
      // Directory doesn't exist, continue to next candidate
      continue;
    }
  }

  // Fallback to default
  const defaultPath = path.resolve(cwd, '../..', 'content');
  CONTENT_DIR_CACHE.set(cwd, defaultPath);
  return defaultPath;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function loadRegistry(): Promise<Registry> {
  const now = Date.now();

  // Check if cache is valid
  if (cache.registry && now - cache.registryTimestamp < CACHE_TTL) {
    return cache.registry;
  }

  try {
    const registryPath = path.join(resolveContentDir(), 'registry.json');
    const data = await readJson<unknown>(registryPath);
    const parsed = RegistrySchema.safeParse(data);

    if (!parsed.success) {
      throw new Error(`Invalid registry.json format: ${parsed.error.message}`);
    }

    // Update cache
    cache.registry = parsed.data;
    cache.registryTimestamp = now;

    return parsed.data;
  } catch (error) {
    // If cache exists but is expired, return cached version
    if (cache.registry) {
      console.warn('Returning cached registry due to error:', error);
      return cache.registry;
    }
    throw error;
  }
}

export async function getAllModules(): Promise<Module[]> {
  const registry = await loadRegistry();
  return registry.modules;
}

export async function findModuleBySlugOrLegacy(
  value: string
): Promise<Module | null> {
  const modules = await getAllModules();
  const direct = modules.find((m) => m.slug === value);
  if (direct) return direct;
  const legacy = modules.find((m) => (m.legacySlugs || []).includes(value));
  return legacy || null;
}

export async function getLessonsByModuleSlug(moduleSlug: string): Promise<any> {
  const now = Date.now();

  // Check if cache is valid
  const cached = cache.lessons.get(moduleSlug);
  const timestamp = cache.lessonsTimestamps.get(moduleSlug);

  if (cached && timestamp && now - timestamp < CACHE_TTL) {
    return cached;
  }

  try {
    const lessonsPath = path.join(
      resolveContentDir(),
      'lessons',
      `${moduleSlug}.json`
    );
    const data = await readJson<any>(lessonsPath);

    // Update cache
    cache.lessons.set(moduleSlug, data);
    cache.lessonsTimestamps.set(moduleSlug, now);

    return data;
  } catch (error) {
    // If cache exists but is expired, return cached version
    if (cached) {
      console.warn(
        `Returning cached lessons for ${moduleSlug} due to error:`,
        error
      );
      return cached;
    }
    throw error;
  }
}

export async function getQuizzesByModuleSlug(moduleSlug: string): Promise<any> {
  const now = Date.now();

  // Check if cache is valid
  const cached = cache.quizzes.get(moduleSlug);
  const timestamp = cache.quizzesTimestamps.get(moduleSlug);

  if (cached && timestamp && now - timestamp < CACHE_TTL) {
    return cached;
  }

  try {
    const quizzesPath = path.join(
      resolveContentDir(),
      'quizzes',
      `${moduleSlug}.json`
    );
    const data = await readJson<any>(quizzesPath);

    // Update cache
    cache.quizzes.set(moduleSlug, data);
    cache.quizzesTimestamps.set(moduleSlug, now);

    return data;
  } catch (error) {
    // If cache exists but is expired, return cached version
    if (cached) {
      console.warn(
        `Returning cached quizzes for ${moduleSlug} due to error:`,
        error
      );
      return cached;
    }
    throw error;
  }
}

// Cache for lessonId -> moduleSlug to avoid repeated directory scans
async function buildLessonIndex(): Promise<Map<string, string>> {
  const now = Date.now();

  // Check if cache is valid
  if (cache.lessonIndex && now - cache.lessonIndexTimestamp < CACHE_TTL) {
    return cache.lessonIndex;
  }

  try {
    const index = new Map<string, string>();
    const contentDir = resolveContentDir();
    const lessonsDir = path.join(contentDir, 'lessons');
    const files = await fs.readdir(lessonsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const full = path.join(lessonsDir, file);
      try {
        const lessonsJson = await readJson<any>(full);
        const lessons = Array.isArray(lessonsJson)
          ? lessonsJson
          : lessonsJson?.lessons || [];
        const moduleSlug = file.replace(/\.json$/, '');

        for (const l of lessons) {
          if (l && l.id !== undefined) {
            index.set(String(l.id), l.moduleSlug || moduleSlug);
          }
        }
      } catch (error) {
        // Skip unreadable or invalid files
        console.warn(`Failed to process lesson file ${file}:`, error);
      }
    }

    // Update cache
    cache.lessonIndex = index;
    cache.lessonIndexTimestamp = now;

    return index;
  } catch (error) {
    // If cache exists but is expired, return cached version
    if (cache.lessonIndex) {
      console.warn('Returning cached lesson index due to error:', error);
      return cache.lessonIndex;
    }
    throw error;
  }
}

export async function getQuizzesByLessonId(
  lessonId: number | string
): Promise<any | null> {
  const key = String(lessonId);
  const index = await buildLessonIndex();
  const moduleSlug = index.get(key);

  if (!moduleSlug) {
    return null;
  }

  return await getQuizzesByModuleSlug(moduleSlug);
}

export function contentBasePath(): string {
  return resolveContentDir();
}

// Utility function to clear cache (useful for testing or when content changes)
export function clearContentCache(): void {
  cache.registry = null;
  cache.registryTimestamp = 0;
  cache.lessons.clear();
  cache.lessonsTimestamps.clear();
  cache.quizzes.clear();
  cache.quizzesTimestamps.clear();
  cache.lessonIndex = null;
  cache.lessonIndexTimestamp = 0;
  CONTENT_DIR_CACHE.clear();
}

// Utility function to get cache statistics
export function getCacheStats(): {
  registryCached: boolean;
  lessonsCached: number;
  quizzesCached: number;
  lessonIndexCached: boolean;
  cacheSize: number;
} {
  return {
    registryCached: cache.registry !== null,
    lessonsCached: cache.lessons.size,
    quizzesCached: cache.quizzes.size,
    lessonIndexCached: cache.lessonIndex !== null,
    cacheSize:
      cache.lessons.size +
      cache.quizzes.size +
      (cache.registry ? 1 : 0) +
      (cache.lessonIndex ? 1 : 0),
  };
}
