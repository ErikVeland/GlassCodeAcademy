#!/usr/bin/env node

/**
 * SEO Sitemap Generator
 * Generates XML sitemap from content registry for better search engine indexing
 */

const fs = require('fs');
const path = require('path');

class SitemapGenerator {
  constructor() {
    this.registry = null;
    this.contentDir = path.join(process.cwd(), 'content');
    this.outputPath = path.join(process.cwd(), 'dot-net-quiz', 'frontend', 'public', 'sitemap.xml');
    this.baseUrl = process.env.SITE_URL || 'https://fullstack-academy.com';
  }

  loadRegistry() {
    const registryPath = path.join(this.contentDir, 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      console.error('❌ Content registry not found');
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      this.registry = JSON.parse(registryContent);
      console.log(`✅ Loaded content registry with ${this.registry.modules.length} modules`);
      return true;
    } catch (error) {
      console.error('❌ Failed to parse content registry:', error.message);
      return false;
    }
  }

  async generateSitemapData() {
    const sitemap = [];
    const settings = this.registry.globalSettings;

    // Add homepage
    sitemap.push({
      url: '/',
      lastModified: new Date().toISOString(),
      priority: '1.0',
      changeFrequency: 'daily'
    });

    // Add static pages
    const staticPages = [
      { url: '/playground', priority: '0.8', changeFrequency: 'weekly' },
      { url: '/animated-background-demo', priority: '0.6', changeFrequency: 'monthly' },
      { url: '/interview-prep', priority: '0.8', changeFrequency: 'weekly' }
    ];

    staticPages.forEach(page => {
      sitemap.push({
        url: page.url,
        lastModified: new Date().toISOString(),
        priority: page.priority,
        changeFrequency: page.changeFrequency
      });
    });

    // Add module pages
    for (const module of this.registry.modules) {
      // Skip content-pending modules if configured
      if (settings.seoSettings.excludeContentPending && module.status === 'content-pending') {
        continue;
      }

      // Module overview page
      sitemap.push({
        url: module.routes.overview,
        lastModified: new Date().toISOString(),
        priority: '0.8',
        changeFrequency: 'weekly'
      });

      // Add lessons and quiz if active
      if (module.status === 'active') {
        // Lessons overview
        sitemap.push({
          url: module.routes.lessons,
          lastModified: new Date().toISOString(),
          priority: '0.7',
          changeFrequency: 'weekly'
        });

        // Individual lessons
        const lessons = await this.getModuleLessons(module.slug);
        if (lessons && lessons.length > 0) {
          lessons.forEach((lesson, index) => {
            sitemap.push({
              url: `${module.routes.lessons}/${lesson.order || index + 1}`,
              lastModified: lesson.lastUpdated || new Date().toISOString(),
              priority: '0.6',
              changeFrequency: 'monthly'
            });
          });
        }

        // Quiz/Assessment
        sitemap.push({
          url: module.routes.quiz,
          lastModified: new Date().toISOString(),
          priority: '0.6',
          changeFrequency: 'monthly'
        });
      }
    }

    return sitemap;
  }

  async getModuleLessons(moduleSlug) {
    try {
      const lessonsPath = path.join(this.contentDir, 'lessons', `${moduleSlug}.json`);
      if (fs.existsSync(lessonsPath)) {
        const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
        return JSON.parse(lessonsContent);
      }
      return null;
    } catch (error) {
      console.error(`Failed to load lessons for ${moduleSlug}:`, error);
      return null;
    }
  }

  generateXmlSitemap(sitemapData) {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const footer = `</urlset>`;

    const urls = sitemapData.map(entry => {
      const url = `${this.baseUrl}${entry.url}`;
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    }).join('\n');

    return `${header}\n${urls}\n${footer}`;
  }

  async generateSitemap() {
    console.log('🚀 Generating SEO sitemap...\n');

    if (!this.loadRegistry()) {
      return false;
    }

    console.log('📊 Generating sitemap data...');
    const sitemapData = await this.generateSitemapData();

    console.log('🗺️ Creating XML sitemap...');
    const xmlSitemap = this.generateXmlSitemap(sitemapData);

    // Ensure output directory exists
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write sitemap to file
    fs.writeFileSync(this.outputPath, xmlSitemap);

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`   📊 Total URLs: ${sitemapData.length}`);
    console.log(`   📁 Output: ${this.outputPath}`);
    console.log(`   🌐 Base URL: ${this.baseUrl}`);

    // Also generate robots.txt
    this.generateRobotsTxt();

    return true;
  }

  generateRobotsTxt() {
    const robotsPath = path.join(path.dirname(this.outputPath), 'robots.txt');
    const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow development/admin paths
Disallow: /api/
Disallow: /_next/
Disallow: /debug/
Disallow: /test/`;

    fs.writeFileSync(robotsPath, robotsContent);
    console.log(`   🤖 Generated robots.txt: ${robotsPath}`);
  }

  async generateRssFeed() {
    console.log('📡 Generating RSS feed...');
    
    const modules = this.registry.modules.filter(module => module.status === 'active');
    const rssItems = modules.map(module => {
      return `    <item>
      <title>${module.title}</title>
      <link>${this.baseUrl}${module.routes.overview}</link>
      <description>${module.description}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid>${this.baseUrl}${module.routes.overview}</guid>
    </item>`;
    }).join('\n');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Fullstack Learning Platform</title>
    <description>Master fullstack development with structured learning paths</description>
    <link>${this.baseUrl}</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-US</language>
${rssItems}
  </channel>
</rss>`;

    const rssPath = path.join(path.dirname(this.outputPath), 'feed.xml');
    fs.writeFileSync(rssPath, rssFeed);
    console.log(`   📡 Generated RSS feed: ${rssPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const generator = new SitemapGenerator();
  
  generator.generateSitemap()
    .then(() => generator.generateRssFeed())
    .catch(error => {
      console.error('💥 Sitemap generation failed:', error);
      process.exit(1);
    });
}

module.exports = SitemapGenerator;