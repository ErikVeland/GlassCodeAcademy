import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';

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

type RawLesson = Partial<{
  id: number | string;
  slug: string;
  title: string;
  intro: string;
  description: string;
  topic: string;
  category: string;
  tags: string[] | string;
  estimatedMinutes: number;
  objectives: string[] | string;
  codeExample: string;
  codeExplanation: string;
  additionalNotes: string;
  difficulty: string;
}>;

// Merge helper: enrich DB lessons with file-based content when fields are missing
function mergeLessonsByTitle(dbLessons: FrontendLesson[], fileLessons: FrontendLesson[]): FrontendLesson[] {
  const fileMap = new Map<string, FrontendLesson>();
  for (const l of fileLessons) {
    fileMap.set((l.title || '').trim().toLowerCase(), l);
  }
  return dbLessons.map((dl) => {
    const key = (dl.title || '').trim().toLowerCase();
    const fl = fileMap.get(key);
    return {
      ...dl,
      intro: dl.intro && dl.intro.trim() ? dl.intro : (fl?.intro ?? ''),
      objectives: Array.isArray(dl.objectives) && dl.objectives.length > 0 ? dl.objectives : (fl?.objectives ?? []),
      codeExample: dl.codeExample && dl.codeExample.trim() ? dl.codeExample : (fl?.codeExample ?? ''),
      codeExplanation: dl.codeExplanation && dl.codeExplanation.trim() ? dl.codeExplanation : (fl?.codeExplanation ?? ''),
      tags: Array.isArray(dl.tags) && dl.tags.length > 0 ? dl.tags : (fl?.tags ?? []),
      estimatedMinutes: typeof dl.estimatedMinutes === 'number' && dl.estimatedMinutes > 0 ? dl.estimatedMinutes : (fl?.estimatedMinutes ?? 10),
      difficulty: dl.difficulty || fl?.difficulty || 'beginner',
      topic: dl.topic || fl?.topic || '',
    };
  });
}

// Database-based lesson loading function with fallback to local API during dev
async function fetchLessonsFromDatabase(moduleSlug: string): Promise<FrontendLesson[]> {
  try {
    const primaryBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const bases = Array.from(new Set([primaryBase, 'http://127.0.0.1:8080']));

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
        const lessonsResponse = await fetch(`${apiBase}/api/lessons-db?moduleId=${foundModule.id}`, { cache: 'no-store' });
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

    // If nothing worked, return empty array
    return [];
  } catch (error) {
    console.error('Error loading lessons from database:', error);
    return [];
  }
}

// File-based lesson loading fallback
async function fetchLessonsFromFiles(req: NextRequest, moduleSlug: string): Promise<FrontendLesson[]> {
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/content/lessons/${moduleSlug}.json`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`Failed to fetch lessons file for module: ${moduleSlug}`);
      return [];
    }
    const data: unknown = await res.json();
    let rawLessons: RawLesson[] = [];
    if (Array.isArray(data)) {
      rawLessons = data as RawLesson[];
    } else if (data && typeof data === 'object') {
      const obj = data as { lessons?: RawLesson[] };
      if (Array.isArray(obj.lessons)) {
        rawLessons = obj.lessons as RawLesson[];
      }
    }
    // Normalize to FrontendLesson shape
    const lessons: FrontendLesson[] = rawLessons.map((item: RawLesson) => ({
      id: `${item.id ?? item.slug ?? Math.random().toString(36).slice(2)}`,
      title: item.title ?? 'Untitled',
      intro: item.intro ?? item.description ?? '',
      topic: item.topic ?? item.category ?? '',
      tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',').map((t) => t.trim()) : [],
      estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : 10,
      objectives: Array.isArray(item.objectives) ? item.objectives : typeof item.objectives === 'string' ? item.objectives.split('\n') : [],
      codeExample: item.codeExample ?? '',
      codeExplanation: item.codeExplanation ?? '',
      additionalNotes: item.additionalNotes ?? '',
      difficulty: (item.difficulty ? String(item.difficulty).toLowerCase() : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
    }));
    return lessons;
  } catch (error) {
    console.error('Error loading lessons from files:', error);
    return [];
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  // Resolve short slugs to full module slugs using central mapping
  const resolvedSlug = (await contentRegistry.getModuleSlugFromShortSlug(moduleSlug)) || moduleSlug;

  // Load DB lessons and merge with file content when available
  const dbLessons = await fetchLessonsFromDatabase(resolvedSlug);
  let lessons: FrontendLesson[] = dbLessons;

  if (!Array.isArray(dbLessons) || dbLessons.length === 0) {
    const fileLessons = await fetchLessonsFromFiles(req, resolvedSlug);
    lessons = fileLessons;
  } else {
    const fileLessons = await fetchLessonsFromFiles(req, resolvedSlug);
    if (Array.isArray(fileLessons) && fileLessons.length > 0) {
      lessons = mergeLessonsByTitle(dbLessons, fileLessons);
    }
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
      source: (!Array.isArray(dbLessons) || dbLessons.length === 0) ? 'file' : 'merged',
    });
  }

  return NextResponse.json(Array.isArray(lessons) ? lessons : []);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';