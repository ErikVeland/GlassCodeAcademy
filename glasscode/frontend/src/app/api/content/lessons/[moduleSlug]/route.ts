import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { contentRegistry } from '@/lib/contentRegistry';
import { debugLog } from '@/lib/httpUtils';

// Removed static registry threshold and file fallbacks to enforce database-only content


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

// Database-only lesson loading function
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
        const modulesEnvelope: unknown = await modulesResponse.json();
        const modulesData: unknown[] = (modulesEnvelope && typeof modulesEnvelope === 'object' && Array.isArray((modulesEnvelope as { data?: unknown }).data))
          ? ((modulesEnvelope as { data?: unknown[] }).data as unknown[])
          : (Array.isArray(modulesEnvelope) ? (modulesEnvelope as unknown[]) : []);
        const foundModule = modulesData.find((m: unknown) => {
          const rec = m as { id?: unknown; slug?: unknown };
          return typeof rec?.slug === 'string' && rec.slug === moduleSlug;
        }) as { id: number; slug: string } | undefined;
        if (!foundModule) {
          debugLog(`[lessons] Module not found for slug: ${moduleSlug} on ${apiBase}`);
          continue;
        }

        // Fetch lessons for this module
        const lessonsResponse = await fetch(`${apiBase}/api/modules/${foundModule.id}/lessons`, { cache: 'no-store' });
        if (!lessonsResponse.ok) {
          console.error(`[lessons] Failed lessons fetch for ${moduleSlug} from ${apiBase}`);
          continue;
        }
        const lessonsEnvelope: unknown = await lessonsResponse.json();
        const lessonsData: unknown[] = (lessonsEnvelope && typeof lessonsEnvelope === 'object' && Array.isArray((lessonsEnvelope as { data?: unknown }).data))
          ? ((lessonsEnvelope as { data?: unknown[] }).data as unknown[])
          : (Array.isArray(lessonsEnvelope) ? (lessonsEnvelope as unknown[]) : []);
        debugLog(`[lessons] Loaded ${Array.isArray(lessonsData) ? lessonsData.length : 0} lessons from ${apiBase} for ${moduleSlug}`);

        if (Array.isArray(lessonsData) && lessonsData.length > 0) {
          // Transform the database lessons to match the expected frontend format
          const typedLessons = lessonsData as Array<{
            id: number;
            title: string;
            content?: string;
            metadata?: string;
          }>;
          const transformed: FrontendLesson[] = typedLessons.map((lesson) => {
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

// Removed file fallback implementation

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleSlug: string }> }) {
  try {
    const { moduleSlug } = await params;
    // Resolve short slugs to full module slugs using central mapping
    const resolvedSlug = await contentRegistry.getModuleSlugFromShortSlug(moduleSlug);
    if (!resolvedSlug) {
      console.warn(`[lessons] Unknown or unsupported module slug: ${moduleSlug}`);
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Load lessons strictly from DB
    const lessons = await fetchLessonsFromDatabase(resolvedSlug);

    // Optional debug output in non-production
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug');
    if (debug && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        debug: true,
        inputSlug: moduleSlug,
        resolvedSlug,
        lessonsCount: Array.isArray(lessons) ? lessons.length : 0,
        source: 'db',
      });
    }

    return NextResponse.json(Array.isArray(lessons) ? lessons : []);
  } catch (err) {
    console.error('[lessons] GET handler error:', err);
    // Return error without falling back to file content
    return NextResponse.json({ error: 'Failed to load lessons from backend' }, { status: 502 });
  }
}

export const runtime = 'nodejs';
export const revalidate = 60; // cache lessons for short TTL
export const dynamic = 'force-static';