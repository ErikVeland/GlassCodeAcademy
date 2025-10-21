import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getApiBaseStrict } from '@/lib/urlUtils';
import { getShortSlugFromModuleSlug } from '@/lib/contentRegistry';

function buildMinimalRegistry() {
  return {
    version: '0.0.0',
    lastUpdated: new Date().toISOString(),
    tiers: {
      foundational: {
        level: 1,
        title: 'Foundational',
        description: 'Core fundamentals and basics',
        focusArea: 'Core skills',
        color: '#4B5563',
        learningObjectives: [],
      },
      core: {
        level: 2,
        title: 'Core',
        description: 'Essential modules and competencies',
        focusArea: 'Core skills',
        color: '#2563EB',
        learningObjectives: [],
      },
      specialized: {
        level: 3,
        title: 'Specialized',
        description: 'Advanced topics and frameworks',
        focusArea: 'Advanced',
        color: '#10B981',
        learningObjectives: [],
      },
      quality: {
        level: 4,
        title: 'Quality',
        description: 'Testing, QA, and reliability',
        focusArea: 'Quality',
        color: '#F59E0B',
        learningObjectives: [],
      },
    },
    modules: [],
    globalSettings: {
      contentThresholds: {
        strictMode: false,
        developmentMode: true,
        minimumLessonsPerModule: 0,
        minimumQuestionsPerModule: 0,
        requiredSchemaCompliance: 0,
      },
      routingRules: {
        enableLegacyRedirects: true,
        generate404Fallbacks: true,
        requireContentThresholds: false,
      },
      seoSettings: {
        generateSitemap: true,
        includeLastModified: false,
        excludeContentPending: false,
      },
    },
  };
}

interface DbModule {
  slug?: string;
  moduleSlug?: string;
  title?: string;
  name?: string;
  description?: string;
  tier?: string;
  track?: string;
  order?: number;
  icon?: string;
  difficulty?: string;
  estimatedHours?: number;
  category?: string;
  technologies?: string[];
  prerequisites?: string[];
  requiredLessons?: number;
  requiredQuestions?: number;
  thresholds?: { requiredLessons?: number; requiredQuestions?: number };
  legacySlugs?: string[];
  status?: string;
  passingScore?: number;
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

interface RegistryResponse {
  version: string;
  lastUpdated: string;
  tiers: Record<string, unknown>;
  modules: RegistryModuleLight[];
  globalSettings: Record<string, unknown>;
}

async function synthesizeRegistryFromDatabase() {
  try {
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8080'; } })();
    const res = await fetch(`${apiBase}/api/modules`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch modules from backend: ${res.status}`);
    const raw: unknown = await res.json();
    const dbModules: DbModule[] = Array.isArray(raw) ? (raw as DbModule[]) : [];

    const modules = await Promise.all(dbModules.map(async (m) => {
      const moduleSlug: string = (m.slug || m.moduleSlug || '').toString();
      const title: string = (m.title || m.name || moduleSlug).toString();
      const description: string = (m.description || '').toString();
      const tier: string = (m.tier || 'foundational').toString();
      const track: string = (m.track || 'Frontend').toString();
      const order: number = typeof m.order === 'number' ? m.order : 1;
      const icon: string = (m.icon || '📘').toString();
      const difficulty: string = (m.difficulty || 'Beginner').toString();
      const estimatedHours: number = typeof m.estimatedHours === 'number' ? m.estimatedHours : 5;
      const category: string = (m.category || '').toString();
      const technologies: string[] = Array.isArray(m.technologies) ? m.technologies : [];
      const prerequisites: string[] = Array.isArray(m.prerequisites) ? m.prerequisites : [];
      const thresholds = {
        requiredLessons: typeof m.requiredLessons === 'number' ? m.requiredLessons : (m.thresholds?.requiredLessons ?? 0),
        requiredQuestions: typeof m.requiredQuestions === 'number' ? m.requiredQuestions : (m.thresholds?.requiredQuestions ?? 0),
      };
      const legacySlugs: string[] = Array.isArray(m.legacySlugs) ? m.legacySlugs : [];
      const status: string = (m.status || 'active').toString();

      const shortSlug = (await getShortSlugFromModuleSlug(moduleSlug)) || (moduleSlug.includes('-') ? moduleSlug.split('-')[0] : moduleSlug);

      const routes = {
        overview: `/${shortSlug}`,
        lessons: `/${shortSlug}/lessons`,
        quiz: `/${shortSlug}/quiz`,
      };

      const metadata = {
        thresholds: {
          minLessons: thresholds.requiredLessons || undefined,
          minQuizQuestions: thresholds.requiredQuestions || undefined,
          passingScore: typeof m.passingScore === 'number' ? m.passingScore : undefined,
        },
      };

      return {
        slug: moduleSlug,
        title,
        description,
        tier,
        track,
        order,
        icon,
        difficulty,
        estimatedHours,
        category,
        technologies,
        prerequisites,
        thresholds,
        legacySlugs,
        status,
        routes,
        metadata,
      };
    }));

    return {
      version: 'db-synthesized',
      lastUpdated: new Date().toISOString(),
      tiers: buildMinimalRegistry().tiers,
      modules,
      globalSettings: buildMinimalRegistry().globalSettings,
    };
  } catch (err) {
    console.error('Failed to synthesize registry from database:', err);
    return buildMinimalRegistry();
  }
}

// Normalize module routes from file registry to shortSlug-based paths
async function normalizeFileRegistryRoutes(registry: RegistryResponse): Promise<RegistryResponse> {
  const modules: RegistryModuleLight[] = Array.isArray(registry?.modules) ? registry.modules : [];
  const normalizedModules: RegistryModuleLight[] = await Promise.all(modules.map(async (m: RegistryModuleLight) => {
    const slug = (m?.slug || '').toString();
    const shortSlug = (await getShortSlugFromModuleSlug(slug)) || (slug.includes('-') ? slug.split('-')[0] : slug);
    const routes: ModuleRoutes = {
      overview: `/${shortSlug}`,
      lessons: `/${shortSlug}/lessons`,
      quiz: `/${shortSlug}/quiz`,
    };
    return {
      ...m,
      routes,
    };
  }));
  return { ...registry, modules: normalizedModules };
}

// Load local file registry and normalize routes for consistency
async function loadLocalRegistryNormalized(): Promise<RegistryResponse> {
  const registryPath = path.join(process.cwd(), '..', '..', 'content', 'registry.json');
  if (!fs.existsSync(registryPath)) {
    return buildMinimalRegistry() as RegistryResponse;
  }
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  const parsed: RegistryResponse = JSON.parse(registryContent) as RegistryResponse;
  return normalizeFileRegistryRoutes(parsed);
}

export async function GET() {
  try {
    const dbMode = (process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db';

    if (dbMode) {
      const dbRegistry = await synthesizeRegistryFromDatabase();
      const hasModules = Array.isArray(dbRegistry.modules) && dbRegistry.modules.length > 0;
      const hasProgrammingFundamentals = hasModules && dbRegistry.modules.some((m) => m.slug === 'programming-fundamentals');

      // If DB registry is missing essential modules, merge with local file registry
      if (!hasModules || !hasProgrammingFundamentals) {
        const fileRegistry = await loadLocalRegistryNormalized();
        const mergedModules = [
          ...dbRegistry.modules,
          ...fileRegistry.modules.filter((fm: RegistryModuleLight) => !dbRegistry.modules.some((dm: { slug: string }) => dm.slug === fm.slug)),
        ];
        const merged = { ...dbRegistry, modules: mergedModules };
        return NextResponse.json(merged, {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        });
      }

      return NextResponse.json(dbRegistry, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // File mode: return normalized local registry
    const registry = await loadLocalRegistryNormalized();
    return NextResponse.json(registry, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load content registry:', error);
    // Return minimal registry on error to prevent 500s
    return NextResponse.json(buildMinimalRegistry(), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';