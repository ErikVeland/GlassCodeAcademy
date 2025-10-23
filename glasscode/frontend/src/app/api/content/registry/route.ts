import { NextResponse } from 'next/server';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';


interface DbModule {
  id: number;
  slug: string;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  courseId: number;
}


interface Tier {
  level: number;
  title: string;
  description: string;
  focusArea: string;
  color: string;
  learningObjectives: string[];
}

interface ModuleRoutes {
  overview: string;
  lessons: string;
  quiz: string;
}

interface RegistryModuleLight {
  slug: string;
  routes?: ModuleRoutes;
  // Allow additional fields but keep type-safe
  [key: string]: unknown;
}



async function synthesizeRegistryFromDatabase() {
  // Resolve backend base candidates (env first, then local dev)
  const candidateBases: string[] = [];
  try { candidateBases.push(getApiBaseStrict()); } catch { /* ignore */ }
  candidateBases.push('http://127.0.0.1:8080');

  // Try fetching from candidates until one succeeds for both modules and tiers
  let modulesRes: Response | null = null;
  let tiersRes: Response | null = null;
  for (const base of candidateBases) {
    try {
      const mRes = await fetch(`${base}/api/modules`, { cache: 'no-store' });
      const tRes = await fetch(`${base}/api/tiers`, { cache: 'no-store' });
      if (mRes.ok && tRes.ok) {
        modulesRes = mRes;
        tiersRes = tRes;
        break;
      }
    } catch {
      // try next candidate
    }
  }

  if (!modulesRes || !tiersRes) {
    throw new Error('Failed to fetch modules/tiers from backend candidates');
  }

  const raw: unknown = await modulesRes.json();
  const dbModules: DbModule[] = Array.isArray(raw) ? (raw as DbModule[]) : [];

  const tiersRaw = await tiersRes.json();
  const dbTiers: Record<string, Tier> = (tiersRaw && typeof tiersRaw === 'object') ? (tiersRaw as Record<string, Tier>) : {};

  // Map DB modules and compute routes (derived, not synthetic content)
  const modules: RegistryModuleLight[] = await Promise.all(dbModules.map(async (m) => {
    const moduleSlug: string = m.slug || '';
    const title: string = m.title || moduleSlug;
    const description: string = m.description || '';
    const order: number = m.order;

    const shortSlug = (await getShortSlugFromModuleSlug(moduleSlug)) || (moduleSlug.includes('-') ? moduleSlug.split('-')[0] : moduleSlug);
    const routes: ModuleRoutes = {
      overview: `/${shortSlug}`,
      lessons: `/${shortSlug}/lessons`,
      quiz: `/${shortSlug}/quiz`,
    };

    return {
      slug: moduleSlug,
      title,
      description,
      order,
      routes,
    };
  }));

  return {
    version: 'db',
    lastUpdated: new Date().toISOString(),
    tiers: dbTiers,
    modules,
    globalSettings: {},
  };
}

// Normalize module routes from file registry to shortSlug-based paths

// Load local file registry and normalize routes for consistency

export async function GET() {
  try {
    const dbRegistry = await synthesizeRegistryFromDatabase();
    return NextResponse.json(dbRegistry, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to load content registry (DB-only):', error);
    return NextResponse.json(
      { error: 'Registry unavailable', reason: 'Database fetch failed' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';