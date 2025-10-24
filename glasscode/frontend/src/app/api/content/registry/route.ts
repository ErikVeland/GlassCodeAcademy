import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';

// Icon mapping by canonical module slug
const iconBySlug: Record<string, string> = {
  'programming-fundamentals': '💻',
  'web-fundamentals': '🌐',
  'version-control': '🔧',
  'dotnet-fundamentals': '⚙️',
  'react-fundamentals': '⚛️',
  'database-systems': '🗄️',
  'typescript-fundamentals': '📘',
  'node-fundamentals': '🟢',
  'laravel-fundamentals': '🧰',
  'nextjs-advanced': '⏭️',
  'graphql-advanced': '🔺',
  'sass-advanced': '🎀',
  'tailwind-advanced': '🌀',
  'vue-advanced': '🍃',
  'testing-fundamentals': '🧪',
  'e2e-testing': '🧪',
  'performance-optimization': '⚡',
  'security-fundamentals': '🔒',
};

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
    const candidates = [
      path.join(projectRoot, 'content', 'registry.json'),
      path.join(projectRoot, 'public', 'registry.json'),
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const json = JSON.parse(raw) as StaticRegistry;
          if (json && Array.isArray(json.modules)) {
            return json;
          }
        }
      } catch {
        // continue to next candidate
      }
    }

    return null;
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
        const icon = (typeof m.icon === 'string' && m.icon.trim() !== '' && m.icon !== '📚') ? m.icon : (iconBySlug[slug] || '📚');
        return { ...m, routes, icon } as RegistryModuleLight;
      }));

      // Filter out dummy/broken modules not meant for production
      const filteredModules = normalizedModules.filter(m => m.slug !== 'html-basics');

      return {
        version: staticRegistry.version || 'file',
        lastUpdated: staticRegistry.lastUpdated || new Date().toISOString(),
        tiers: staticRegistry.tiers || {},
        modules: filteredModules,
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
        const icon = (typeof m.icon === 'string' && m.icon.trim() !== '' && m.icon !== '📚') ? m.icon : (iconBySlug[slug] || '📚');
        return { ...m, routes, icon } as RegistryModuleLight;
      }));

      // Filter out dummy/broken modules not meant for production
      const filteredModules = normalizedModules.filter(m => m.slug !== 'html-basics');

      return {
        version: staticRegistry.version || 'file',
        lastUpdated: staticRegistry.lastUpdated || new Date().toISOString(),
        tiers: Object.keys(dbTiers).length ? dbTiers : (staticRegistry.tiers || {}),
        modules: filteredModules,
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
        merged = { ...byLegacy, ...merged } as RegistryModuleLight;
      }
    }

    if (fallback) {
      merged = { ...fallback, ...merged } as RegistryModuleLight;
    }

    type WithIcon = RegistryModuleLight & { icon?: string };
    const mergedWithIcon: WithIcon = merged as WithIcon;
    const icon = (typeof mergedWithIcon.icon === 'string' && mergedWithIcon.icon.trim() !== '' && mergedWithIcon.icon !== '📚')
      ? mergedWithIcon.icon
      : (iconBySlug[moduleSlug] || '📚');
    merged = { ...mergedWithIcon, icon } as RegistryModuleLight;

    return merged;
  }));

  // Filter out dummy/broken modules not meant for production
  const filteredModules = modules.filter(m => m.slug !== 'html-basics');

  return {
    version: 'db',
    lastUpdated: new Date().toISOString(),
    tiers: Object.keys(dbTiers).length ? dbTiers : (staticRegistry?.tiers || {}),
    modules: filteredModules,
    globalSettings: staticRegistry?.globalSettings || {},
  };
}

export async function GET() {
  try {
    const dbRegistry = await synthesizeRegistryFromDatabase();
    return NextResponse.json(dbRegistry);
  } catch (err) {
    console.error('Registry GET failed:', err);
    const staticFallback = loadStaticRegistry();
    if (staticFallback) {
      return NextResponse.json(staticFallback);
    }
    return NextResponse.json({ error: 'Unable to load registry' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';