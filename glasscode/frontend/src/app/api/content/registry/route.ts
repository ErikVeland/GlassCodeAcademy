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

interface FileModule {
  slug: string;
  title: string;
  description: string;
  tier: string;
  track: string;
  order: number;
  icon: string;
  difficulty: string;
  estimatedHours: number;
  category: string;
  technologies: string[];
  prerequisites: string[];
  thresholds: {
    requiredLessons: number;
    requiredQuestions: number;
  };
  legacySlugs: string[];
  status: string;
  metadata?: {
    thresholds?: {
      passingScore?: number;
    };
  };
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

interface RegistryResponse {
  version: string;
  lastUpdated: string;
  tiers: Record<string, Tier>;
  modules: RegistryModuleLight[];
  globalSettings: Record<string, unknown>;
}

interface FileRegistry {
  version: string;
  lastUpdated: string;
  tiers: Record<string, Tier>;
  modules: FileModule[];
  globalSettings: Record<string, unknown>;
}

async function synthesizeRegistryFromDatabase() {
  try {
    const apiBase = (() => { try { return getApiBaseStrict(); } catch { return 'http://127.0.0.1:8081'; } })();
    const res = await fetch(`${apiBase}/api/modules`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch modules from backend: ${res.status}`);
    const raw: unknown = await res.json();
    const dbModules: DbModule[] = Array.isArray(raw) ? (raw as DbModule[]) : [];

    // Load the registry.json file to get the full module information including tier data
    const registryPath = path.join(process.cwd(), '..', '..', 'content', 'registry.json');
    let fileRegistryModules: FileModule[] = [];
    let fileRegistryTiers: Record<string, Tier> = buildMinimalRegistry().tiers;
    if (fs.existsSync(registryPath)) {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      const parsedRegistry: FileRegistry = JSON.parse(registryContent);
      fileRegistryModules = Array.isArray(parsedRegistry.modules) ? parsedRegistry.modules : [];
      if (parsedRegistry.tiers) {
        fileRegistryTiers = parsedRegistry.tiers;
      }
    }

    const modules = await Promise.all(dbModules.map(async (m) => {
      // Find the corresponding module in the registry.json file
      const fileModule = fileRegistryModules.find((fm) => fm.slug === m.slug);
      
      if (fileModule) {
        // Use the file module data which contains tier, track, etc.
        const moduleSlug: string = fileModule.slug || '';
        const title: string = fileModule.title || m.title || moduleSlug;
        const description: string = fileModule.description || m.description || '';
        const tier: string = fileModule.tier || 'foundational';
        const track: string = fileModule.track || 'Frontend';
        const order: number = typeof fileModule.order === 'number' ? fileModule.order : m.order;
        const icon: string = fileModule.icon || '📘';
        const difficulty: string = fileModule.difficulty || 'Beginner';
        const estimatedHours: number = typeof fileModule.estimatedHours === 'number' ? fileModule.estimatedHours : 5;
        const category: string = fileModule.category || '';
        const technologies: string[] = Array.isArray(fileModule.technologies) ? fileModule.technologies : [];
        const prerequisites: string[] = Array.isArray(fileModule.prerequisites) ? fileModule.prerequisites : [];
        const thresholds = {
          requiredLessons: typeof fileModule.thresholds?.requiredLessons === 'number' ? fileModule.thresholds.requiredLessons : 0,
          requiredQuestions: typeof fileModule.thresholds?.requiredQuestions === 'number' ? fileModule.thresholds.requiredQuestions : 0,
        };
        const legacySlugs: string[] = Array.isArray(fileModule.legacySlugs) ? fileModule.legacySlugs : [];
        const status: string = fileModule.status || 'active';

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
            passingScore: typeof fileModule.metadata?.thresholds?.passingScore === 'number' ? fileModule.metadata.thresholds.passingScore : undefined,
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
      } else {
        // Fallback to basic module data from database
        const moduleSlug: string = m.slug || '';
        const title: string = m.title || moduleSlug;
        const description: string = m.description || '';
        const tier: string = 'foundational'; // Default tier
        const track: string = 'Frontend'; // Default track
        const order: number = m.order;
        const icon: string = '📘'; // Default icon
        const difficulty: string = 'Beginner'; // Default difficulty
        const estimatedHours: number = 5; // Default hours
        const category: string = ''; // Default category
        const technologies: string[] = []; // Default technologies
        const prerequisites: string[] = []; // Default prerequisites
        const thresholds = {
          requiredLessons: 0,
          requiredQuestions: 0,
        };
        const legacySlugs: string[] = []; // Default legacy slugs
        const status: string = 'active'; // Default status

        const shortSlug = (await getShortSlugFromModuleSlug(moduleSlug)) || (moduleSlug.includes('-') ? moduleSlug.split('-')[0] : moduleSlug);

        const routes = {
          overview: `/${shortSlug}`,
          lessons: `/${shortSlug}/lessons`,
          quiz: `/${shortSlug}/quiz`,
        };

        const metadata = {
          thresholds: {
            minLessons: undefined,
            minQuizQuestions: undefined,
            passingScore: undefined,
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
      }
    }));

    // Also include modules from registry.json that might not be in the database yet
    const additionalModules = fileRegistryModules
      .filter((fm) => !dbModules.some((dm: DbModule) => dm.slug === fm.slug))
      .map((fm) => {
        const moduleSlug: string = fm.slug || '';
        const title: string = fm.title || moduleSlug;
        const description: string = fm.description || '';
        const tier: string = fm.tier || 'foundational';
        const track: string = fm.track || 'Frontend';
        const order: number = typeof fm.order === 'number' ? fm.order : 1;
        const icon: string = fm.icon || '📘';
        const difficulty: string = fm.difficulty || 'Beginner';
        const estimatedHours: number = typeof fm.estimatedHours === 'number' ? fm.estimatedHours : 5;
        const category: string = fm.category || '';
        const technologies: string[] = Array.isArray(fm.technologies) ? fm.technologies : [];
        const prerequisites: string[] = Array.isArray(fm.prerequisites) ? fm.prerequisites : [];
        const thresholds = {
          requiredLessons: typeof fm.thresholds?.requiredLessons === 'number' ? fm.thresholds.requiredLessons : 0,
          requiredQuestions: typeof fm.thresholds?.requiredQuestions === 'number' ? fm.thresholds.requiredQuestions : 0,
        };
        const legacySlugs: string[] = Array.isArray(fm.legacySlugs) ? fm.legacySlugs : [];
        const status: string = fm.status || 'active';

        const shortSlug = (getShortSlugFromModuleSlug(moduleSlug)) || (moduleSlug.includes('-') ? moduleSlug.split('-')[0] : moduleSlug);

        const routes = {
          overview: `/${shortSlug}`,
          lessons: `/${shortSlug}/lessons`,
          quiz: `/${shortSlug}/quiz`,
        };

        const metadata = {
          thresholds: {
            minLessons: thresholds.requiredLessons || undefined,
            minQuizQuestions: thresholds.requiredQuestions || undefined,
            passingScore: typeof fm.metadata?.thresholds?.passingScore === 'number' ? fm.metadata.thresholds.passingScore : undefined,
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
      });

    const allModules = [...modules, ...additionalModules];

    return {
      version: 'db-synthesized',
      lastUpdated: new Date().toISOString(),
      tiers: fileRegistryTiers,
      modules: allModules,
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
    const shortSlug = slug.includes('-') ? slug.split('-')[0] : slug;
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
  const rootRegistryPath = path.join(process.cwd(), '..', '..', 'content', 'registry.json');
  let parsed: RegistryResponse | null = null;

  // Try root content registry first
  try {
    if (fs.existsSync(rootRegistryPath)) {
      const raw = fs.readFileSync(rootRegistryPath, 'utf8');
      const candidate = JSON.parse(raw) as RegistryResponse;
      if (Array.isArray(candidate.modules) && candidate.modules.length > 0) {
        parsed = candidate;
      }
    }
  } catch (e) {
    console.warn('[registry] Failed reading root content/registry.json:', e);
  }

  // Fallback to public/registry.json if root content registry is missing or empty
  if (!parsed) {
    try {
      const publicRegistryPath = path.join(process.cwd(), 'public', 'registry.json');
      if (fs.existsSync(publicRegistryPath)) {
        const raw = fs.readFileSync(publicRegistryPath, 'utf8');
        const candidate = JSON.parse(raw) as RegistryResponse;
        if (candidate && typeof candidate === 'object') {
          parsed = candidate;
        }
      }
    } catch (e) {
      console.warn('[registry] Failed reading public/registry.json:', e);
    }
  }

  if (!parsed) {
    return buildMinimalRegistry() as RegistryResponse;
  }

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