import { MetadataRoute } from 'next';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Lesson } from '@/lib/contentRegistry';
import { getPublicOriginStrict } from '@/lib/urlUtils';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = (() => { try { return getPublicOriginStrict().replace(/\/+$/, ''); } catch { return 'http://localhost:3000'; } })();
    const enableSSG = process.env.ENABLE_BUILD_SSG === 'true';
    const enableLessonSitemap = process.env.ENABLE_LESSON_SITEMAP === 'true';
    const isDb = (process.env.GC_CONTENT_MODE || '').toLowerCase() === 'db';

    // Generate sitemap data directly from content registry
    const modules = await contentRegistry.getModules();
    const activeModules = modules.filter((m) => m.status === 'active');

    const sitemapEntries: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
    
    // Add module pages (overview, lessons list, quiz) for active modules
    for (const mod of activeModules) {
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.overview}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.lessons}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.quiz}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      // Add individual lesson detail pages, gated and limited to match SSG strategy
      if (enableLessonSitemap && enableSSG && !isDb) {
        try {
          let lessons: Lesson[] = await contentRegistry.getModuleLessons(mod.slug);

          // Fallback to filesystem public content JSON during build/server
          if (!lessons || lessons.length === 0) {
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
              // ignore fallback errors
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