import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

interface StaticRegistryModule {
  slug: string;
  title: string;
  description: string;
  tier: string;
  track: string;
  order: number;
  icon?: string;
  difficulty?: string;
  estimatedHours?: number;
  category?: string;
  technologies?: string[];
  prerequisites?: string[];
  thresholds?: {
    requiredLessons?: number;
    requiredQuestions?: number;
  };
  legacySlugs?: string[];
  status?: string;
  metadata?: Record<string, unknown>;
  routes?: ModuleRoutes;
}

interface StaticRegistry {
  version: string;
  lastUpdated: string;
  tiers: Record<string, Tier>;
  modules: StaticRegistryModule[];
  globalSettings?: Record<string, unknown>;
}

function loadStaticRegistry(): StaticRegistry | null {
  try {
    const projectRoot = process.cwd();
    const registryPath = path.join(projectRoot, 'content', 'registry.json');
    if (!fs.existsSync(registryPath)) return null;
    const raw = fs.readFileSync(registryPath, 'utf-8');
    const json = JSON.parse(raw) as StaticRegistry;
    if (!json || !Array.isArray(json.modules)) return null;
    return json;
  } catch {
    return null;
  }
}

async function synthesizeRegistryFromDatabase() {
  const staticRegistry = loadStaticRegistry();
  const staticModulesBySlug = new Map<string, StaticRegistryModule>();
  const staticModules = staticRegistry?.modules || [];
  staticModules.forEach(m => staticModulesBySlug.set(m.slug, m));

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

  // If backend is unreachable, fallback entirely to static registry
  if (!modulesRes || !tiersRes) {
    if (staticRegistry) {
      const normalizedModules: RegistryModuleLight[] = await Promise.all(staticModules.map(async (m) => {
        const slug = (m.slug || '').toString();
        const shortSlug = (await getShortSlugFromModuleSlug(slug)) || (slug.includes('-') ? slug.split('-')[0] : slug);
        const routes: ModuleRoutes = {
          overview: `/${shortSlug}`,
          lessons: `/${shortSlug}/lessons`,
          quiz: `/${shortSlug}/quiz`,
        };
        return { ...m, routes } as RegistryModuleLight;
      }));

      return {
        version: staticRegistry.version || 'file',
        lastUpdated: staticRegistry.lastUpdated || new Date().toISOString(),
        tiers: staticRegistry.tiers || {},
        modules: normalizedModules,
        globalSettings: staticRegistry.globalSettings || {},
      };
    }
    throw new Error('Failed to fetch modules/tiers from backend candidates');
  }

  const raw: unknown = await modulesRes.json();
  const dbModules: DbModule[] = Array.isArray(raw) ? (raw as DbModule[]) : [];

  const tiersRaw = await tiersRes.json();
  const dbTiers: Record<string, Tier> = (tiersRaw && typeof tiersRaw === 'object') ? (tiersRaw as Record<string, Tier>) : {};

  // If DB returns no modules, fallback to static modules entirely
  if (!Array.isArray(dbModules) || dbModules.length === 0) {
    if (staticRegistry) {
      const normalizedModules: RegistryModuleLight[] = await Promise.all(staticModules.map(async (m) => {
        const slug = (m.slug || '').toString();
        const shortSlug = (await getShortSlugFromModuleSlug(slug)) || (slug.includes('-') ? slug.split('-')[0] : slug);
        const routes: ModuleRoutes = {
          overview: `/${shortSlug}`,
          lessons: `/${shortSlug}/lessons`,
          quiz: `/${shortSlug}/quiz`,
        };
        return { ...m, routes } as RegistryModuleLight;
      }));

      return {
        version: staticRegistry.version || 'file',
        lastUpdated: staticRegistry.lastUpdated || new Date().toISOString(),
        tiers: Object.keys(dbTiers).length ? dbTiers : (staticRegistry.tiers || {}),
        modules: normalizedModules,
        globalSettings: staticRegistry.globalSettings || {},
      };
    }
    // No static fallback available
    return {
      version: 'db',
      lastUpdated: new Date().toISOString(),
      tiers: dbTiers,
      modules: [],
      globalSettings: {},
    };
  }

  // Map DB modules and compute routes, augmenting with static fields when available
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

    const fallback = staticModulesBySlug.get(moduleSlug) || null;

    // If no direct slug match, try legacy slug match from static
    let merged: RegistryModuleLight = {
      slug: moduleSlug,
      title,
      description,
      order,
      routes,
    };

    if (!fallback && staticModules.length > 0) {
      const byLegacy = staticModules.find(sm => Array.isArray(sm.legacySlugs) && sm.legacySlugs.includes(moduleSlug));
      if (byLegacy) {
        merged = { ...byLegacy, ...merged };
      }
    }

    if (fallback) {
      merged = { ...fallback, ...merged };
    }

    return merged;
  }));

  return {
    version: 'db',
    lastUpdated: new Date().toISOString(),
    tiers: Object.keys(dbTiers).length ? dbTiers : (staticRegistry?.tiers || {}),
    modules,
    globalSettings: staticRegistry?.globalSettings || {},
  };
}

export async function GET() {
  try {
    const dbRegistry = await synthesizeRegistryFromDatabase();
    return NextResponse.json(dbRegistry, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to load content registry (DB+file):', error);
    return NextResponse.json(
      { error: 'Registry unavailable', reason: 'Database and file fallback failed' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';