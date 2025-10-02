/**
 * Content Registry Utilities
 * Provides centralized access to content registry data for routing and navigation
 */

interface Module {
  slug: string;
  title: string;
  description: string;
  tier: string;
  track: string;
  order: number;
  icon: string;
  difficulty: string;
  estimatedHours: number;
  category: string;
  technologies: string[];
  prerequisites: string[];
  thresholds: {
    requiredLessons: number;
    requiredQuestions: number;
  };
  legacySlugs: string[];
  status: string;
  routes: {
    overview: string;
    lessons: string;
    quiz: string;
  };
}

interface Tier {
  level: number;
  title: string;
  description: string;
  focusArea: string;
  color: string;
  learningObjectives: string[];
}

interface ContentRegistry {
  version: string;
  lastUpdated: string;
  tiers: Record<string, Tier>;
  modules: Module[];
  globalSettings: {
    contentThresholds: {
      strictMode: boolean;
      developmentMode: boolean;
      minimumLessonsPerModule: number;
      minimumQuestionsPerModule: number;
      requiredSchemaCompliance: number;
    };
    routingRules: {
      enableLegacyRedirects: boolean;
      generate404Fallbacks: boolean;
      requireContentThresholds: boolean;
    };
    seoSettings: {
      generateSitemap: boolean;
      includeLastModified: boolean;
      excludeContentPending: boolean;
    };
  };
}

class ContentRegistryLoader {
  private static instance: ContentRegistryLoader;
  private registry: ContentRegistry | null = null;

  constructor() {
    // Browser-safe constructor
  }

  static getInstance(): ContentRegistryLoader {
    if (!ContentRegistryLoader.instance) {
      ContentRegistryLoader.instance = new ContentRegistryLoader();
    }
    return ContentRegistryLoader.instance;
  }

  /**
   * Load the content registry from API
   */
  async loadRegistry(): Promise<ContentRegistry> {
    if (this.registry) {
      return this.registry;
    }

    try {
      // For server-side rendering, read the file directly
      // For client-side, use fetch
      if (typeof window === 'undefined') {
        // Server-side: read file directly
        console.log('Server-side registry loading, cwd:', process.cwd());
        
        // Dynamically import fs and path only when needed on server-side
        const fs = require('fs');
        const path = require('path');
        
        // Try to find the registry.json file in different possible locations
        const possiblePaths = [
          path.join(process.cwd(), 'public', 'registry.json'),
          path.join(process.cwd(), '..', '..', 'content', 'registry.json'),
          path.join(__dirname, '..', 'public', 'registry.json'),
        ];
        
        let registryData: any = null;
        let foundPath = '';
        
        for (const registryPath of possiblePaths) {
          try {
            console.log(`Checking path: ${registryPath}`);
            console.log(`File exists: ${fs.existsSync(registryPath)}`);
            if (fs.existsSync(registryPath)) {
              const fileContent = fs.readFileSync(registryPath, 'utf-8');
              registryData = JSON.parse(fileContent);
              foundPath = registryPath;
              break;
            }
          } catch (err) {
            console.error(`Error reading ${registryPath}:`, err);
            // Continue to next path
          }
        }
        
        if (!registryData) {
          // Fallback to fetch even in server-side context
          console.log('Falling back to fetch for registry');
          const response = await fetch('http://localhost:3009/registry.json');
          if (!response.ok) {
            throw new Error(`Failed to fetch registry.json: ${response.status} ${response.statusText}`);
          }
          const registryDataFetch = await response.json();
          this.registry = registryDataFetch as ContentRegistry;
          return this.registry;
        }
        
        console.log(`Loaded registry from: ${foundPath}`);
        this.registry = registryData as ContentRegistry;
        return this.registry;
      } else {
        // Client-side: fetch from public directory
        const response = await fetch('/registry.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch registry.json: ${response.status} ${response.statusText}`);
        }
        const registryData = await response.json();
        this.registry = registryData as ContentRegistry;
        return this.registry;
      }
    } catch (error) {
      console.error('Failed to load content registry:', error);
      throw new Error('Content registry unavailable');
    }
  }

  /**
   * Get all modules
   */
  async getModules(): Promise<Module[]> {
    const registry = await this.loadRegistry();
    return registry.modules;
  }

  /**
   * Get module by slug
   */
  async getModule(slug: string): Promise<Module | null> {
    const modules = await this.getModules();
    return modules.find(module => module.slug === slug) || null;
  }

  /**
   * Get modules by tier
   */
  async getModulesByTier(tierKey: string): Promise<Module[]> {
    const modules = await this.getModules();
    return modules
      .filter(module => module.tier === tierKey)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get modules by track (Frontend/Backend)
   */
  async getModulesByTrack(track: string): Promise<Module[]> {
    const modules = await this.getModules();
    return modules
      .filter(module => module.track === track)
      .sort((a, b) => {
        // Sort by tier level first, then by order within tier
        const aTier = this.getTierLevel(a.tier);
        const bTier = this.getTierLevel(b.tier);
        
        if (aTier !== bTier) {
          return aTier - bTier;
        }
        return a.order - b.order;
      });
  }

  /**
   * Get all tiers
   */
  async getTiers(): Promise<Record<string, Tier>> {
    const registry = await this.loadRegistry();
    return registry.tiers;
  }

  /**
   * Get tier by key
   */
  async getTier(tierKey: string): Promise<Tier | null> {
    const tiers = await this.getTiers();
    return tiers[tierKey] || null;
  }

  /**
   * Find module by legacy slug
   */
  async findModuleByLegacySlug(legacySlug: string): Promise<Module | null> {
    const modules = await this.getModules();
    return modules.find(module => 
      module.legacySlugs.includes(legacySlug)
    ) || null;
  }

  /**
   * Get all valid routes for static generation
   */
  async getAllRoutes(): Promise<string[]> {
    const modules = await this.getModules();
    const routes: string[] = [];

    for (const module of modules) {
      // Add module overview route
      routes.push(module.routes.overview);
      
      // Add lesson routes (if content exists)
      if (module.status === 'active') {
        routes.push(module.routes.lessons);
        routes.push(module.routes.quiz);
      }
    }

    return routes;
  }
  /**
   * Helper to get tier level number
   */
  private getTierLevel(tierKey: string): number {
    const tierLevels: Record<string, number> = {
      'foundational': 1,
      'core': 2,
      'specialized': 3,
      'quality': 4
    };
    return tierLevels[tierKey] || 0;
  }

  /**
   * Get lessons for a specific module
   */
  async getModuleLessons(moduleSlug: string): Promise<any[]> {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
        : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/content/lessons/${moduleSlug}`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to load lessons for ${moduleSlug}:`, error);
      return [];
    }
  }

  /**
   * Get quiz for a specific module
   */
  async getModuleQuiz(moduleSlug: string): Promise<any | null> {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
        : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/content/quizzes/${moduleSlug}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to load quiz for ${moduleSlug}:`, error);
      return null;
    }
  }

  /**
   * Check if module content meets minimum thresholds
   */
  async checkModuleThresholds(moduleSlug: string): Promise<{
    lessons: boolean;
    lessonsValid: boolean;
    quiz: boolean;
    quizValid: boolean;
    overall: boolean;
  }> {
    try {
      const [lessons, quiz, module] = await Promise.all([
        this.getModuleLessons(moduleSlug),
        this.getModuleQuiz(moduleSlug),
        this.getModule(moduleSlug)
      ]);
      
      if (!module) {
        return { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
      }
      
      const lessonsMeetThreshold = lessons.length >= (module.thresholds?.requiredLessons || 0);
      const quizMeetsThreshold = quiz && quiz.questions?.length >= (module.thresholds?.requiredQuestions || 0);
      
      return {
        lessons: lessonsMeetThreshold,
        lessonsValid: lessonsMeetThreshold,
        quiz: quizMeetsThreshold,
        quizValid: quizMeetsThreshold,
        overall: lessonsMeetThreshold && quizMeetsThreshold
      };
    } catch (error) {
      console.error(`Failed to check thresholds for ${moduleSlug}:`, error);
      return { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
    }
  }
}

// Export singleton instance
export const contentRegistry = ContentRegistryLoader.getInstance();

// Export types
export type { Module, Tier, ContentRegistry };