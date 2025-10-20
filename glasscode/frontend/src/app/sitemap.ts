import { MetadataRoute } from 'next';
import { contentRegistry } from '@/lib/contentRegistry';
import type { Lesson } from '@/lib/contentRegistry';
import { getPublicOriginStrict } from '@/lib/urlUtils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicOriginStrict();

  try {
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

      // Add individual lesson detail pages
      try {
        // Prefer using the registry helper to fetch lessons
        let lessons: Lesson[] = await contentRegistry.getModuleLessons(mod.slug);

        // Fallback to public content JSON if registry API is unavailable
        if (!lessons || lessons.length === 0) {
          try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/content/lessons/${mod.slug}.json`, { cache: 'no-store' });
            if (res.ok) {
              const data: unknown = await res.json();
              lessons = Array.isArray(data) ? (data as Lesson[]) : [];
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
    
    return sitemapEntries;
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    
    // Fallback sitemap with just the homepage
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