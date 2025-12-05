import type { MetadataRoute } from 'next';
import { allProjects } from '@/lib/projects';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://glasscode.academy';
  const locales = ['en', 'nb', 'nn'];

  const staticPaths = ['/', '/work', '/services', '/process', '/about', '/contact'];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({ url: `${base}/${locale}${path}`, lastModified: new Date(), changeFrequency: 'monthly', priority: path === '/' ? 1 : 0.7 });
    }

    for (const p of allProjects) {
      entries.push({ url: `${base}/${locale}/work/${p.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 });
    }
  }

  return entries;
}
