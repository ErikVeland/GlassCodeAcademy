import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getApiBaseStrict } from "@/lib/urlUtils";
import { getShortSlugFromModuleSlug } from "@/lib/contentRegistry";

// Icon mapping by canonical module slug
const iconBySlug: Record<string, string> = {
  "programming-fundamentals": "💻",
  "web-fundamentals": "🌐",
  "version-control": "🔧",
  "dotnet-fundamentals": "⚙️",
  "react-fundamentals": "⚛️",
  "database-systems": "🗄️",
  "typescript-fundamentals": "📘",
  "node-fundamentals": "🟢",
  "laravel-fundamentals": "🧰",
  "nextjs-advanced": "⏭️",
  "graphql-advanced": "🔺",
  "sass-advanced": "🎀",
  "tailwind-advanced": "🌀",
  "vue-advanced": "🍃",
  "testing-fundamentals": "🧪",
  "e2e-testing": "🧪",
  "performance-optimization": "⚡",
  "security-fundamentals": "🔒",
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
    // Prefer the public registry.json first, as it contains up-to-date thresholds
    // and metadata for the frontend. Fall back to content/registry.json when needed.
    const candidates = [
      path.join(projectRoot, "public", "registry.json"),
      path.join(projectRoot, "content", "registry.json"),
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, "utf-8");
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
  // Resolve backend base candidates (env first, then local dev)
  const candidateBases: string[] = [];
  try {
    candidateBases.push(getApiBaseStrict());
  } catch {
    /* ignore */
  }
  candidateBases.push("http://127.0.0.1:8081");

  // Try fetching from candidates until one succeeds for both modules and tiers
  let modulesRes: Response | null = null;
  let tiersRes: Response | null = null;
  for (const base of candidateBases) {
    try {
      const mRes = await fetch(`${base}/api/modules`, { cache: "no-store" });
      const tRes = await fetch(`${base}/api/tiers`, { cache: "no-store" });
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
    throw new Error("Failed to fetch modules/tiers from backend");
  }

  const modulesEnvelope: unknown = await modulesRes.json();
  const modulesData =
    modulesEnvelope &&
    typeof modulesEnvelope === "object" &&
    Array.isArray((modulesEnvelope as { data?: unknown }).data)
      ? ((modulesEnvelope as { data?: unknown[] }).data as unknown[])
      : Array.isArray(modulesEnvelope)
        ? (modulesEnvelope as unknown[])
        : [];
  const dbModules: DbModule[] = modulesData as DbModule[];

  const tiersEnvelope: unknown = await tiersRes.json();
  const tiersData =
    tiersEnvelope &&
    typeof tiersEnvelope === "object" &&
    (tiersEnvelope as { data?: unknown }).data &&
    typeof (tiersEnvelope as { data?: unknown }).data === "object"
      ? ((tiersEnvelope as { data?: Record<string, Tier> }).data as Record<
          string,
          Tier
        >)
      : (tiersEnvelope as Record<string, Tier> | object);
  const dbTiers: Record<string, Tier> = tiersData as Record<string, Tier>;

  if (!Array.isArray(dbModules) || dbModules.length === 0) {
    return {
      version: "db",
      lastUpdated: new Date().toISOString(),
      tiers: dbTiers,
      modules: [],
      globalSettings: {},
    };
  }

  // Map DB modules and compute routes
  const modules: RegistryModuleLight[] = await Promise.all(
    dbModules.map(async (m) => {
      const moduleSlug: string = m.slug || "";
      const title: string = m.title || moduleSlug;
      const description: string = m.description || "";
      const order: number = m.order;

      const shortSlug =
        (await getShortSlugFromModuleSlug(moduleSlug)) ||
        (moduleSlug.includes("-") ? moduleSlug.split("-")[0] : moduleSlug);
      const routes: ModuleRoutes = {
        overview: `/${shortSlug}`,
        lessons: `/${shortSlug}/lessons`,
        quiz: `/${shortSlug}/quiz`,
      };

      const icon = iconBySlug[moduleSlug] || "📚";

      return {
        slug: moduleSlug,
        title,
        description,
        order,
        routes,
        icon,
      } as RegistryModuleLight;
    }),
  );

  // Enrich modules from static registry (tier, technologies, difficulty, icon, etc.)
  const staticRegistry = loadStaticRegistry();
  const staticModulesBySlug: Record<string, StaticRegistryModule> =
    Array.isArray(staticRegistry?.modules)
      ? staticRegistry!.modules.reduce(
          (acc, mod) => {
            acc[String(mod.slug)] = mod;
            return acc;
          },
          {} as Record<string, StaticRegistryModule>,
        )
      : {};

  // Normalize modules to guarantee client-safe fields while preserving static metadata when available
  const normalizedModules = modules.map((m) => {
    const slug = String(m.slug);
    const staticMeta = staticModulesBySlug[slug];
    const tier =
      staticMeta &&
      typeof staticMeta.tier === "string" &&
      staticMeta.tier.trim() !== ""
        ? staticMeta.tier
        : "core";
    const technologies =
      staticMeta && Array.isArray(staticMeta.technologies)
        ? staticMeta.technologies
        : [];
    const difficulty =
      staticMeta &&
      typeof staticMeta.difficulty === "string" &&
      staticMeta.difficulty.trim() !== ""
        ? staticMeta.difficulty
        : "Beginner";
    const icon =
      typeof (m as { icon?: string }).icon === "string" &&
      (m as { icon?: string }).icon &&
      (m as { icon?: string }).icon !== "📚"
        ? (m as { icon?: string }).icon!
        : staticMeta &&
            typeof staticMeta.icon === "string" &&
            staticMeta.icon.trim() !== ""
          ? staticMeta.icon
          : iconBySlug[slug] || "📚";

    // Preserve title/description/order/routes from DB mapping, layer in static fields
    return {
      ...m,
      tier,
      technologies,
      difficulty,
      icon,
      track: staticMeta?.track,
      estimatedHours: staticMeta?.estimatedHours,
      category: staticMeta?.category,
      prerequisites: staticMeta?.prerequisites,
      thresholds: staticMeta?.thresholds,
      legacySlugs: staticMeta?.legacySlugs,
      status: staticMeta?.status,
      metadata: staticMeta?.metadata,
    } as RegistryModuleLight;
  });

  return {
    version: "db",
    lastUpdated: new Date().toISOString(),
    tiers: dbTiers,
    modules: normalizedModules,
    globalSettings: {},
  };
}
// eslint-enable removed: no corresponding disable remains

async function synthesizeRegistryFromStaticOnly() {
  const staticRegistry = loadStaticRegistry();
  if (!staticRegistry) {
    throw new Error("Static registry not found");
  }

  const staticModules = Array.isArray(staticRegistry.modules)
    ? staticRegistry.modules
    : [];
  const normalizedModules: RegistryModuleLight[] = await Promise.all(
    staticModules.map(async (m) => {
      const slug = (m.slug || "").toString();
      const shortSlug =
        (await getShortSlugFromModuleSlug(slug)) ||
        (slug.includes("-") ? slug.split("-")[0] : slug);
      const routes: ModuleRoutes = {
        overview: `/${shortSlug}`,
        lessons: `/${shortSlug}/lessons`,
        quiz: `/${shortSlug}/quiz`,
      };
      const icon =
        typeof m.icon === "string" && m.icon.trim() !== "" && m.icon !== "📚"
          ? m.icon
          : iconBySlug[slug] || "📚";
      const technologies = Array.isArray(m.technologies) ? m.technologies : [];
      const difficulty =
        typeof m.difficulty === "string" && m.difficulty.trim() !== ""
          ? m.difficulty
          : "Beginner";
      const tier =
        typeof m.tier === "string" && m.tier.trim() !== "" ? m.tier : "core";
      return {
        ...m,
        routes,
        icon,
        technologies,
        difficulty,
        tier,
      } as RegistryModuleLight;
    }),
  );

  // Filter out any unwanted/demo modules
  const filteredModules = normalizedModules.filter(
    (m) => m.slug !== "html-basics",
  );

  return {
    version: staticRegistry.version || "file",
    lastUpdated: staticRegistry.lastUpdated || new Date().toISOString(),
    tiers: staticRegistry.tiers || {},
    modules: filteredModules,
    globalSettings: staticRegistry.globalSettings || {},
  };
}

export async function GET() {
  // Attempt DB synthesis, but avoid logging errors on expected dev setups
  const registryFromDb = await synthesizeRegistryFromDatabase().catch(
    () => null,
  );
  if (registryFromDb) {
    return NextResponse.json(registryFromDb);
  }

  // Graceful fallback to static registry without emitting errors in normal dev flows
  try {
    const fallback = await synthesizeRegistryFromStaticOnly();
    return NextResponse.json(fallback);
  } catch (fileErr) {
    // Only log when static fallback genuinely fails (unexpected)
    console.error("Registry static fallback failed:", fileErr);
    return NextResponse.json(
      { error: "Unable to load registry" },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const revalidate = 60; // cache registry for 60 seconds to reduce backend pressure
export const dynamic = "force-static";
