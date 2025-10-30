import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';

// Safely read required lessons from static registry without relying on network/contentRegistry
async function getRequiredLessonsFromRegistry(moduleSlug: string): Promise<number> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, 'public', 'registry.json'),
      path.join(cwd, '..', '..', 'content', 'registry.json'),
    ];
    for (const p of candidates) {
      try {
        const raw = await fs.promises.readFile(p, 'utf-8');
        const parsedUnknown: unknown = JSON.parse(raw);
        if (Array.isArray(parsedUnknown)) {
          type RegistryModuleThresholds = { requiredLessons?: number; minLessons?: number };
          type RegistryModuleSummary = { slug: string; thresholds?: RegistryModuleThresholds };
          const arr = parsedUnknown as unknown[];
          const modules = arr.filter((m): m is RegistryModuleSummary => {
            if (typeof m !== 'object' || m === null) return false;
            const obj = m as { slug?: unknown; thresholds?: unknown };
            const slugValid = typeof obj.slug === 'string';
            const thresholdsValid =
              obj.thresholds === undefined ||
              (typeof obj.thresholds === 'object' && obj.thresholds !== null);
            return slugValid && thresholdsValid;
          });
          const found = modules.find((m) => m.slug === moduleSlug);
          const thresholds = found?.thresholds;
          const required = (thresholds?.requiredLessons ?? thresholds?.minLessons ?? 0);
          return typeof required === 'number' ? required : 0;
        }
      } catch {
        // try next candidate
        continue;
      }
    }
  } catch {
    // ignore fs errors
  }
  return 0;
}


type FrontendLesson = {
  id: string;
  title: string;
  intro: string;
  topic: string;
  tags: string[];
  estimatedMinutes: number;
  objectives: string[];
  codeExample: string;
  codeExplanation: string;
  additionalNotes: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};

// Database-based lesson loading function with fallback to local API during dev
async function fetchLessonsFromDatabase(moduleSlug: string): Promise<FrontendLesson[]> {
  try {
    const apiBase = getApiBaseStrict();
    const bases = [apiBase];

    for (const apiBase of bases) {
      try {
        // First, get the module ID from the backend
        const modulesResponse = await fetch(`${apiBase}/api/modules`, { cache: 'no-store' });
        if (!modulesResponse.ok) {
          console.error(`[lessons] Failed modules fetch from ${apiBase}`);
          continue;
        }
        const modules = await modulesResponse.json();
        const foundModule = modules.find((m: { id: number; slug: string }) => m.slug === moduleSlug);
        if (!foundModule) {
          console.log(`[lessons] Module not found for slug: ${moduleSlug} on ${apiBase}`);
          continue;
        }

        // Fetch lessons for this module
        const lessonsResponse = await fetch(`${apiBase}/api/modules/${foundModule.id}/lessons`, { cache: 'no-store' });
        if (!lessonsResponse.ok) {
          console.error(`[lessons] Failed lessons fetch for ${moduleSlug} from ${apiBase}`);
          continue;
        }
        const lessons = await lessonsResponse.json();
        console.log(`[lessons] Loaded ${Array.isArray(lessons) ? lessons.length : 0} lessons from ${apiBase} for ${moduleSlug}`);

        if (Array.isArray(lessons) && lessons.length > 0) {
          // Transform the database lessons to match the expected frontend format
          const transformed: FrontendLesson[] = lessons.map((lesson: {
            id: number;
            title: string;
            content?: string;
            metadata?: string;
          }) => {
            // Parse content JSON if it exists
            let intro = '';
            let objectives: string[] = [];
            let codeExample = '';
            let codeExplanation = '';
            let tags: string[] = [];
            let estimatedMinutes = 10;
            let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
            let topic = '';

            if (lesson.content) {
              try {
                const contentObj = JSON.parse(lesson.content);
                intro = contentObj.intro || '';
                objectives = Array.isArray(contentObj.objectives) ? contentObj.objectives : [];
                if (contentObj.code) {
                  if (typeof contentObj.code === 'string') {
                    codeExample = contentObj.code;
                  } else if (typeof contentObj.code === 'object') {
                    codeExample = contentObj.code.example || '';
                    codeExplanation = contentObj.code.explanation || '';
                  }
                }
                topic = contentObj.topic || '';
              } catch (e) {
                console.error('Error parsing lesson content:', e);
              }
            }

            if (lesson.metadata) {
              try {
                const metadataObj = JSON.parse(lesson.metadata);
                tags = Array.isArray(metadataObj.tags) ? metadataObj.tags : [];
                estimatedMinutes = typeof metadataObj.estimatedMinutes === 'number' ? metadataObj.estimatedMinutes : 10;
                difficulty = (metadataObj.difficulty ? String(metadataObj.difficulty).toLowerCase() : 'beginner') as 'beginner' | 'intermediate' | 'advanced';
              } catch (e) {
                console.error('Error parsing lesson metadata:', e);
              }
            }

            return {
              id: `${lesson.id}`,
              title: lesson.title,
              intro,
              topic,
              tags,
              estimatedMinutes,
              objectives,
              codeExample,
              codeExplanation,
              additionalNotes: '',
              difficulty,
            };
          });
          return transformed;
        }
      } catch (innerErr) {
        console.error(`[lessons] Error using ${apiBase}:`, innerErr);
        continue;
      }
    }

    // If nothing worked, return empty array and let caller fallback to file
    return [];
  } catch (error) {
    console.error('Error loading lessons from database:', error);
    return [];
  }
}

const toString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const toNumber = (v: unknown, fallback = 0): number => (typeof v === 'number' ? v : fallback);
const toArrayOfStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

async function fetchLessonsFromFile(moduleSlug: string): Promise<FrontendLesson[]> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    // Try root content path first
    const rootFilePath = path.join(process.cwd(), '..', '..', 'content', 'lessons', `${moduleSlug}.json`);
    let raw: string | null = null;
    try {
      raw = await fs.promises.readFile(rootFilePath, 'utf-8');
    } catch {
      raw = null;
    }

    // Fallback to public content path if root unavailable
    if (!raw) {
      const publicFilePath = path.join(process.cwd(), 'public', 'content', 'lessons', `${moduleSlug}.json`);
      try {
        raw = await fs.promises.readFile(publicFilePath, 'utf-8');
      } catch {
        raw = null;
      }
    }

    if (!raw) {
      console.warn(`[lessons] No file content found for ${moduleSlug} in root or public`);
      return [];
    }

    const json = JSON.parse(raw) as unknown;
    const items = Array.isArray(json) ? json : [];

    const lessons: FrontendLesson[] = items.map((item: unknown) => {
      const obj = item as Record<string, unknown>;
      const difficultyRaw = toString(obj.difficulty, 'beginner').toLowerCase();
      const difficulty = (difficultyRaw === 'advanced' || difficultyRaw === 'intermediate' || difficultyRaw === 'beginner') ? difficultyRaw : 'beginner';
      const codeObj = obj.code as Record<string, unknown> | string | undefined;
      const codeExample = typeof codeObj === 'string' ? codeObj : toString(codeObj?.example, '');
      const codeExplanation = typeof codeObj === 'string' ? '' : toString(codeObj?.explanation, '');

      return {
        id: String(obj.id ?? ''),
        title: toString(obj.title, ''),
        intro: toString(obj.intro, ''),
        topic: toString(obj.topic, ''),
        tags: toArrayOfStrings(obj.tags),
        estimatedMinutes: toNumber(obj.estimatedMinutes, 10),
        objectives: toArrayOfStrings(obj.objectives),
        codeExample,
        codeExplanation,
        additionalNotes: '',
        difficulty,
      } as FrontendLesson;
    });

    console.log(`[lessons] Loaded ${lessons.length} lessons from file for ${moduleSlug}`);
    return lessons;
  } catch (err) {
    console.error(`[lessons] File fallback failed for ${moduleSlug}:`, err);
    return [];
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug } = await params;
    // Resolve short slugs to full module slugs using central mapping
    const resolvedSlug = await contentRegistry.getModuleSlugFromShortSlug(moduleSlug);
    if (!resolvedSlug) {
      console.warn(`[lessons] Unknown or unsupported module slug: ${moduleSlug}`);
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Load lessons from DB; if empty, fallback to file content
    let sourceUsed: 'db' | 'file' | 'none' = 'none';
    let lessons = await fetchLessonsFromDatabase(resolvedSlug);
    if (Array.isArray(lessons) && lessons.length > 0) {
      sourceUsed = 'db';
    }

    // Always attempt file fallback and prefer whichever source has more entries
    const fileLessons = await fetchLessonsFromFile(resolvedSlug);
    if (Array.isArray(fileLessons) && fileLessons.length > (Array.isArray(lessons) ? lessons.length : 0)) {
      lessons = fileLessons;
      sourceUsed = 'file';
    }

    // If still fewer than registry thresholds, keep lessons as-is but log for visibility
    const requiredLessons = await getRequiredLessonsFromRegistry(resolvedSlug);
    if ((Array.isArray(lessons) ? lessons.length : 0) < requiredLessons) {
      console.warn(`[lessons] Content count (${Array.isArray(lessons) ? lessons.length : 0}) is below requiredLessons (${requiredLessons}) for ${resolvedSlug}`);
    }

    // Optional debug output in non-production
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug');
    if (debug && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        debug: true,
        inputSlug: moduleSlug,
        resolvedSlug,
        lessonsCount: Array.isArray(lessons) ? lessons.length : 0,
        source: sourceUsed,
      });
    }

    return NextResponse.json(Array.isArray(lessons) ? lessons : []);
  } catch (err) {
    console.error('[lessons] GET handler error:', err);
    // Always return JSON to avoid generic 500 page in development
    return NextResponse.json([], { status: 200 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';