import fs from 'fs';
import path from 'path';
import HomePage from './HomePageClient';
import type { Tier } from '@/lib/contentRegistry';

// Short slug mapping (kept in sync with middleware.ts)
const moduleSlugToShortSlug: Record<string, string> = {
  'programming-fundamentals': 'programming',
  'web-fundamentals': 'web',
  'version-control': 'version',
  'dotnet-fundamentals': 'dotnet',
  'react-fundamentals': 'react',
  'database-systems': 'database',
  'typescript-fundamentals': 'typescript',
  'node-fundamentals': 'node',
  'laravel-fundamentals': 'laravel',
  'nextjs-advanced': 'nextjs',
  'graphql-advanced': 'graphql',
  'sass-advanced': 'sass',
  'tailwind-advanced': 'tailwind',
  'vue-advanced': 'vue',
  'testing-fundamentals': 'testing',
  'e2e-testing': 'e2e',
  'performance-optimization': 'performance',
  'security-fundamentals': 'security',
};

function getShortSlug(moduleSlug: string): string {
  return (
    moduleSlugToShortSlug[moduleSlug] ||
    (moduleSlug.includes('-') ? moduleSlug.split('-')[0] : moduleSlug)
  );
}

// Icon mapping by module slug
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

interface RawModule {
  slug: string;
  title: string;
  description: string;
  tier: string;
  track?: string;
  order: number;
  icon?: string;
  difficulty?: string;
  estimatedHours?: number;
  category?: string;
  technologies?: string[];
  prerequisites?: string[];
  routes?: { overview: string; lessons: string; quiz: string };
  [key: string]: unknown;
}

interface RawRegistry {
  version?: string;
  lastUpdated?: string;
  tiers?: Record<string, Tier>;
  modules?: RawModule[];
  globalSettings?: Record<string, unknown>;
}

/**
 * Read the static registry JSON at build / request time and normalise
 * routes to use short slugs so the client component can render immediately
 * without an extra fetch round-trip.
 */
function loadRegistryData() {
  const candidates = [
    path.join(process.cwd(), 'public', 'registry.json'),
    path.join(process.cwd(), 'content', 'registry.json'),
  ];

  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw: RawRegistry = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (!raw || !Array.isArray(raw.modules)) continue;

      const tiers = (raw.tiers ?? {}) as Record<string, Tier>;

      const modules = raw.modules.map((m) => {
        const shortSlug = getShortSlug(m.slug);
        return {
          ...m,
          icon: m.icon || iconBySlug[m.slug] || '📚',
          difficulty: m.difficulty || 'Beginner',
          technologies: Array.isArray(m.technologies) ? m.technologies : [],
          tier: typeof m.tier === 'string' && m.tier in tiers ? m.tier : 'core',
          routes: {
            overview: `/${shortSlug}`,
            lessons: `/${shortSlug}/lessons`,
            quiz: `/${shortSlug}/quiz`,
          },
        };
      });

      // Organize by tier
      const tierData: Record<
        string,
        { tier: Tier; modules: (typeof modules)[number][] }
      > = {};
      for (const [key, tier] of Object.entries(tiers)) {
        tierData[key] = {
          tier,
          modules: modules
            .filter((m) => m.tier === key)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        };
      }

      return { tiers: tierData, allModules: modules };
    } catch {
      // try next candidate
    }
  }

  return null;
}

/**
 * Server Component – pre-renders the homepage with real module data so
 * crawlers receive meaningful HTML. The client component hydrates on top
 * for interactivity (filters, progress tracking, achievements).
 */
export default async function Page() {
  const registryData = loadRegistryData();
  return <HomePage initialRegistryData={registryData} />;
}

// ISR: re-generate at most every 60 seconds when registry changes
export const revalidate = 60;
