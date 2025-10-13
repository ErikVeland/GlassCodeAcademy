import { MetadataRoute } from 'next';
import { contentRegistry } from '@/lib/contentRegistry';
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
    for (const module of modules) {
      sitemapEntries.push({
        url: `${baseUrl}${module.routes.overview}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      
      // Add lessons page
      sitemapEntries.push({
        url: `${baseUrl}${module.routes.lessons}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
      
      // Add quiz page
      sitemapEntries.push({
        url: `${baseUrl}${module.routes.quiz}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
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