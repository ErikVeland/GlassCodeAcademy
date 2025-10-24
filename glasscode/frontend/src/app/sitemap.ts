import { MetadataRoute } from 'next';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Lesson, Module } from '@/lib/contentRegistry';
import { getPublicOriginStrict } from '@/lib/urlUtils';

export const revalidate = 3600;

// Simple timeout helper to avoid long waits during build
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = getPublicOriginStrict().replace(/\/+$/, '');

    const enableSSG = process.env.ENABLE_BUILD_SSG === 'true';
    const enableLessonSitemap = process.env.ENABLE_LESSON_SITEMAP === 'true';
    const isDb = process.env.GC_CONTENT_MODE === 'db';

    // Fetch modules (use registry; fall back to filesystem quickly if needed)
    let modules: Module[] = await contentRegistry.getModules();
    if (!modules || modules.length === 0) {
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const tryPaths = [
          path.join(process.cwd(), 'public', 'registry.json'),
          path.join(process.cwd(), '..', '..', 'content', 'registry.json'),
        ];
        for (const p of tryPaths) {
          try {
            const raw = await fs.readFile(p, 'utf-8');
            const data: unknown = JSON.parse(raw);
            const parsedModules = (data as { modules?: unknown }).modules;
            if (Array.isArray(parsedModules) && parsedModules.length > 0) {
              modules = parsedModules as Module[];
              break;
            }
          } catch {
            // try next path
          }
        }
      } catch {
        // ignore fallback errors
      }
    }

    const activeModules = (modules || []).filter((m) => m && m.status !== 'inactive');

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Base entries
    sitemapEntries.push(
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/modules`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    );

    for (const mod of activeModules) {
      if (!mod?.routes) continue;
      sitemapEntries.push(
        {
          url: `${baseUrl}${mod.routes.overview}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        },
        {
          url: `${baseUrl}${mod.routes.lessons}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        },
        {
          url: `${baseUrl}${mod.routes.quiz}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        },
      );

      // Add individual lesson detail pages, gated and limited to match SSG strategy
      if (enableLessonSitemap && enableSSG && !isDb) {
        try {
          let lessons: Lesson[] = [];

          // Prefer filesystem public content JSON during build/server for speed
          try {
            const fs = await import('node:fs/promises');
            const path = await import('node:path');
            const tryPaths = [
              path.join(process.cwd(), '..', '..', 'content', 'lessons', `${mod.slug}.json`),
              path.join(process.cwd(), 'public', 'content', 'lessons', `${mod.slug}.json`),
            ];
            for (const p of tryPaths) {
              try {
                const raw = await fs.readFile(p, 'utf-8');
                const data: unknown = JSON.parse(raw);
                if (Array.isArray(data) && data.length > 0) {
                  lessons = data as Lesson[];
                  break;
                }
              } catch {
                // try next path
              }
            }
          } catch {
            // ignore filesystem fallback errors
          }

          // If filesystem didn’t yield results, try network with a short timeout
          if (!lessons || lessons.length === 0) {
            try {
              lessons = await withTimeout(contentRegistry.getModuleLessons(mod.slug), 4000);
            } catch {
              // ignore network timeout/errors
            }
          }

          if (lessons && lessons.length > 0) {
            const count = Math.min(3, lessons.length); // align with SSG first 3 lessons
            for (let i = 0; i < count; i++) {
              const o = lessons[i]?.order;
              const order: number = typeof o === 'number' ? o : (i + 1);
              sitemapEntries.push({
                url: `${baseUrl}${mod.routes.lessons}/${order}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
              });
            }
          }
        } catch {
          // If lesson fetching fails, skip per-lesson entries for this module
        }
      }
    }
    
    return sitemapEntries;
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    const baseUrl = (() => { try { return getPublicOriginStrict().replace(/\/+$/, ''); } catch { return 'http://localhost:3000'; } })();
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}