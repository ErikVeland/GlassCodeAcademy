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

function resolveContentDir(): string {
  // Try common locations relative to apps/api
  const candidates = [
    path.resolve(process.cwd(), '../..', 'content'),
    path.resolve(process.cwd(), '..', 'content'),
    path.resolve(process.cwd(), 'content'),
  ];
  for (const candidate of candidates) {
    // We won’t stat synchronously; just return the first candidate.
    // Consumers will get a proper ENOENT if it doesn’t exist.
    if (candidate) return candidate;
  }
  return path.resolve(process.cwd(), '../..', 'content');
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function loadRegistry(): Promise<Registry> {
  const registryPath = path.join(resolveContentDir(), 'registry.json');
  const data = await readJson<unknown>(registryPath);
  const parsed = RegistrySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid registry.json format: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function getAllModules(): Promise<Module[]> {
  const registry = await loadRegistry();
  return registry.modules;
}

export async function findModuleBySlugOrLegacy(value: string): Promise<Module | null> {
  const modules = await getAllModules();
  const direct = modules.find((m) => m.slug === value);
  if (direct) return direct;
  const legacy = modules.find((m) => (m.legacySlugs || []).includes(value));
  return legacy || null;
}

export async function getLessonsByModuleSlug(moduleSlug: string): Promise<any> {
  const lessonsPath = path.join(resolveContentDir(), 'lessons', `${moduleSlug}.json`);
  return await readJson<any>(lessonsPath);
}

export async function getQuizzesByModuleSlug(moduleSlug: string): Promise<any> {
  const quizzesPath = path.join(resolveContentDir(), 'quizzes', `${moduleSlug}.json`);
  return await readJson<any>(quizzesPath);
}

// Cache for lessonId -> moduleSlug to avoid repeated directory scans
let lessonIndexCache: Map<string, string> | null = null;

async function buildLessonIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const contentDir = resolveContentDir();
  const lessonsDir = path.join(contentDir, 'lessons');
  const files = await fs.readdir(lessonsDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  for (const file of jsonFiles) {
    const full = path.join(lessonsDir, file);
    try {
      const lessonsJson = await readJson<any>(full);
      const lessons = Array.isArray(lessonsJson) ? lessonsJson : lessonsJson?.lessons || [];
      const moduleSlug = file.replace(/\.json$/, '');
      for (const l of lessons) {
        if (l && l.id !== undefined) {
          index.set(String(l.id), l.moduleSlug || moduleSlug);
        }
      }
    } catch {
      // Skip unreadable or invalid files
    }
  }
  lessonIndexCache = index;
  return index;
}

export async function getQuizzesByLessonId(lessonId: number | string): Promise<any | null> {
  const key = String(lessonId);
  const index = lessonIndexCache || (await buildLessonIndex());
  const moduleSlug = index.get(key);
  if (!moduleSlug) {
    return null;
  }
  return await getQuizzesByModuleSlug(moduleSlug);
}

export function contentBasePath(): string {
  return resolveContentDir();
}