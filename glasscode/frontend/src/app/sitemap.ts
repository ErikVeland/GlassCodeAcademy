import { MetadataRoute } from 'next';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Lesson } from '@/lib/contentRegistry';
import { getPublicOriginStrict } from '@/lib/urlUtils';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = (() => { try { return getPublicOriginStrict().replace(/\/+$/, ''); } catch { return 'http://localhost:3000'; } })();
    // Generate sitemap data directly from content registry
    const modules = await contentRegistry.getModules();
    const sitemapEntries: MetadataRoute.Sitemap = [
      // Homepage
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
    
    // Add module pages
    for (const mod of modules) {
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.overview}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      
      // Add lessons overview page
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.lessons}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
      
      // Add quiz page
      sitemapEntries.push({
        url: `${baseUrl}${mod.routes.quiz}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      // Add individual lesson detail pages (optional, disabled by default for build stability)
      if (process.env.ENABLE_LESSON_SITEMAP === 'true') {
        try {
          // Prefer using the registry helper to fetch lessons
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
            for (const [i, lesson] of lessons.entries()) {
              const order: number = typeof lesson.order === 'number' ? lesson.order : (i + 1);
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