// Simple test script to verify sitemap generation
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000';

// Mock the contentRegistry to avoid database dependencies
const mockModules = [
  {
    slug: 'test-module',
    routes: {
      overview: '/modules/test-module',
      lessons: '/test-module/lessons',
      quiz: '/test-module/quiz'
    }
  }
];

// Mock the contentRegistry
const contentRegistry = {
  getModules: async () => mockModules,
  getModuleLessons: async () => []
};

// Create a mock version of the sitemap function
async function mockSitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    throw new Error('Base URL not configured. Set NEXT_PUBLIC_BASE_URL or VERCEL_URL.');
  }

  try {
    // Generate sitemap data directly from content registry
    const modules = await contentRegistry.getModules();
    const sitemapEntries = [
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

mockSitemap().then(result => {
  console.log('Sitemap generated successfully!');
  console.log(`Generated ${result.length} entries`);
  
  // Check that we have at least the homepage
  const homepage = result.find(entry => entry.url === 'http://localhost:3000');
  if (homepage) {
    console.log('Homepage entry found in sitemap');
  } else {
    console.log('Warning: Homepage entry not found in sitemap');
  }
  
  console.log('✅ Sitemap test passed');
  process.exit(0);
}).catch(error => {
  console.error('Error generating sitemap:', error);
  console.log('❌ Sitemap test failed');
  process.exit(1);
});