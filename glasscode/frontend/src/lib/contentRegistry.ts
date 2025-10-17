/**
 * Content Registry Utilities
 * Provides centralized access to content registry data for routing and navigation
 */


import { normalizeQuestion } from './textNormalization';

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
  metadata?: {
    thresholds?: {
      minLessons?: number;
      minQuizQuestions?: number;
      passingScore?: number;
    };
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

// Specific types for lessons and quizzes to avoid `any`
interface Lesson {
  id?: number;
  order?: number;
  title: string;
  intro?: string;
  topic?: string;
  tags?: string[];
  estimatedMinutes?: number;
  objectives?: string[];
  code?: {
    example?: string;
    explanation?: string;
  };
  pitfalls?: Array<{
    mistake?: string;
    solution?: string;
    severity?: 'high' | 'medium' | 'low';
  }>;
  exercises?: Array<{
    title?: string;
    description?: string;
    checkpoints?: string[];
  }>;
}

interface ProgrammingQuestion {
  id?: number;
  topic?: string;
  type?: string;
  question: string;
  choices?: string[];
  correctAnswer?: number;
  // For open-ended questions, provide a list of accepted answers
  // Answers are matched in a case-insensitive, trimmed manner
  acceptedAnswers?: string[];
  explanation?: string;
  // If true, keep choices in fixed order and do not shuffle
  fixedChoiceOrder?: boolean;
  // Optional choice label style; when 'letters', render A/B/C/D prefixes
  choiceLabels?: 'letters' | 'none';
}

interface Quiz {
  questions: ProgrammingQuestion[];
}

interface LessonGroup {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
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
        const fs = await import('fs');
        const path = await import('path');
        
        // Try to find the registry.json file in different possible locations
        const possiblePaths = [
          path.join(process.cwd(), 'public', 'registry.json'),
          path.join(process.cwd(), '..', '..', 'content', 'registry.json'),
          path.join(__dirname, '..', 'public', 'registry.json'),
        ];
        
        let registryData: unknown = null;
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
          } catch (_err) {
            console.error(`Error reading ${registryPath}:`, _err);
            // Continue to next path
          }
        }
        
        if (!registryData) {
          // Fallback to fetch even in server-side context
          console.log('Falling back to fetch for registry');
          const response = await fetch(`/api/content/registry`, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          if (!response.ok) {
            console.warn(`Registry fetch failed ${response.status} ${response.statusText}, using minimal fallback`);
            const minimal: ContentRegistry = {
              version: '0.0.0',
              lastUpdated: new Date().toISOString(),
              tiers: {
                foundational: { level: 1, title: 'Foundational', description: '', focusArea: 'Core', color: '#4B5563', learningObjectives: [] },
                core: { level: 2, title: 'Core', description: '', focusArea: 'Core', color: '#2563EB', learningObjectives: [] },
                specialized: { level: 3, title: 'Specialized', description: '', focusArea: 'Advanced', color: '#10B981', learningObjectives: [] },
                quality: { level: 4, title: 'Quality', description: '', focusArea: 'Quality', color: '#F59E0B', learningObjectives: [] },
              },
              modules: [],
              globalSettings: {
                contentThresholds: { strictMode: false, developmentMode: true, minimumLessonsPerModule: 0, minimumQuestionsPerModule: 0, requiredSchemaCompliance: 0 },
                routingRules: { enableLegacyRedirects: true, generate404Fallbacks: true, requireContentThresholds: false },
                seoSettings: { generateSitemap: true, includeLastModified: false, excludeContentPending: false },
              },
            };
            this.registry = minimal;
            return this.registry;
          }
          const registryDataFetch: unknown = await response.json();
          this.registry = registryDataFetch as ContentRegistry;
          return this.registry;
        }
        
        console.log(`Loaded registry from: ${foundPath}`);
        this.registry = registryData as ContentRegistry;
        return this.registry;
      } else {
        // Client-side: fetch from public directory
        const response = await fetch('/registry.json', {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch registry.json: ${response.status} ${response.statusText}`);
        }
        const registryData: unknown = await response.json();
        this.registry = registryData as ContentRegistry;
        return this.registry;
      }
    } catch (error: unknown) {
      console.error('Failed to load content registry:', error);
      // Safe minimal fallback to avoid breaking pages
      const minimal: ContentRegistry = {
        version: '0.0.0',
        lastUpdated: new Date().toISOString(),
        tiers: {
          foundational: { level: 1, title: 'Foundational', description: '', focusArea: 'Core', color: '#4B5563', learningObjectives: [] },
          core: { level: 2, title: 'Core', description: '', focusArea: 'Core', color: '#2563EB', learningObjectives: [] },
          specialized: { level: 3, title: 'Specialized', description: '', focusArea: 'Advanced', color: '#10B981', learningObjectives: [] },
          quality: { level: 4, title: 'Quality', description: '', focusArea: 'Quality', color: '#F59E0B', learningObjectives: [] },
        },
        modules: [],
        globalSettings: {
          contentThresholds: { strictMode: false, developmentMode: true, minimumLessonsPerModule: 0, minimumQuestionsPerModule: 0, requiredSchemaCompliance: 0 },
          routingRules: { enableLegacyRedirects: true, generate404Fallbacks: true, requireContentThresholds: false },
          seoSettings: { generateSitemap: true, includeLastModified: false, excludeContentPending: false },
        },
      };
      this.registry = minimal;
      return this.registry;
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
   * Get module by slug (supports both moduleSlug and shortSlug)
   */
  async getModule(slug: string): Promise<Module | null> {
    const modules = await this.getModules();
    
    // First try to find by exact slug match (moduleSlug)
    let foundModule = modules.find(m => m.slug === slug);
    
    // If not found, try to convert shortSlug to moduleSlug and search again
    if (!foundModule) {
      const moduleSlug = await this.getModuleSlugFromShortSlug(slug);
      if (moduleSlug) {
        foundModule = modules.find(m => m.slug === moduleSlug);
      }
    }
    
    return foundModule || null;
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
    return modules.find(mod => 
      mod.legacySlugs.includes(legacySlug)
    ) || null;
  }

  /**
   * Find module by a route path (overview/lessons/quiz)
   */
  async findModuleByRoutePath(routePath: string): Promise<Module | null> {
    const modules = await this.getModules();
    return modules.find(mod => (
      mod.routes?.overview === routePath ||
      mod.routes?.lessons === routePath ||
      mod.routes?.quiz === routePath
    )) || null;
  }

  /**
   * Get all valid routes for static generation
   */
  async getAllRoutes(): Promise<string[]> {
    const modules = await this.getModules();
    const routes: string[] = [];

    for (const mod of modules) {
      // Add module overview route
      routes.push(mod.routes.overview);
      
      // Add lesson routes (if content exists)
      if (mod.status === 'active') {
        routes.push(mod.routes.lessons);
        routes.push(mod.routes.quiz);
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
  async getModuleLessons(moduleSlug: string): Promise<Lesson[]> {
    // For server-side operations, read files directly instead of making HTTP requests
    if (typeof window === 'undefined') {
      try {
        // Dynamically import fs and path only when needed on server-side
        const fs = await import('fs');
        const path = await import('path');
        
        // Try to find the lesson file in different possible locations
        const possiblePaths = [
          // First try the public directory path (where files actually are)
          path.join(process.cwd(), 'public', 'content', 'lessons', `${moduleSlug}.json`),
          // Try the correct path relative to the project root
          path.join(process.cwd(), '..', '..', 'content', 'lessons', `${moduleSlug}.json`),
          // Try from the glasscode/frontend directory going up to project root
          path.join(process.cwd(), '..', '..', '..', 'content', 'lessons', `${moduleSlug}.json`),
          // Try direct path from current working directory
          path.join(process.cwd(), 'content', 'lessons', `${moduleSlug}.json`),
          // Legacy paths for compatibility
          path.join(__dirname, '..', '..', '..', '..', 'content', 'lessons', `${moduleSlug}.json`),
          // Production path (only if NEXT_PUBLIC_BASE_URL indicates production)
          ...(process.env.NEXT_PUBLIC_BASE_URL?.includes('glasscode.academy') ? 
            [path.join('/srv/academy', 'content', 'lessons', `${moduleSlug}.json`)] : []),
        ];
        
        let lessonsPath = '';
        for (const possiblePath of possiblePaths) {
          try {
            if (fs.existsSync(possiblePath)) {
              lessonsPath = possiblePath;
              break;
            }
          } catch {
            // Continue to next path
          }
        }
        
        if (lessonsPath) {
          const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
          const lessonsData: unknown = JSON.parse(lessonsContent);
          const lessons = Array.isArray(lessonsData) ? (lessonsData as Lesson[]) : [];
          return lessons.map((l, i) => ({ ...l, order: i + 1 }));
        }
      } catch (error: unknown) {
        console.error(`Failed to load lessons for ${moduleSlug} (server-side):`, error);
      }
    } else {
      // For client-side, use API route
      try {
        const response = await fetch(`/api/content/lessons/${moduleSlug}`);
        if (response.ok) {
          const data: unknown = await response.json();
          const lessons = Array.isArray(data) ? (data as Lesson[]) : [];
          return lessons.map((l, i) => ({ ...l, order: i + 1 }));
        } else {
          console.error(`API request failed for ${moduleSlug} lessons:`, response.status, response.statusText);
        }
      } catch (error: unknown) {
        console.error(`Failed to load lessons for ${moduleSlug} via API:`, error);
      }
    }
    
    // Fallback: return minimal lessons for programming-fundamentals to prevent empty UI
    if (moduleSlug === 'programming-fundamentals') {
      const minimalLessons: Lesson[] = [
        { id: 1, title: 'Variables and Data Types', topic: 'basics' },
        { id: 2, title: 'Control Structures', topic: 'basics' },
        { id: 3, title: 'Functions', topic: 'basics' },
        { id: 4, title: 'Arrays and Objects', topic: 'data-structures' },
        { id: 5, title: 'Object-Oriented Programming', topic: 'data-structures' },
        { id: 6, title: 'Error Handling', topic: 'error-handling' },
        { id: 7, title: 'File Operations', topic: 'error-handling' },
        { id: 8, title: 'Recursion', topic: 'algorithms' },
        { id: 9, title: 'Sorting Algorithms', topic: 'algorithms' },
        { id: 10, title: 'Memory Management', topic: 'advanced' },
        { id: 11, title: 'Best Practices', topic: 'advanced' },
        { id: 12, title: 'Project Organization', topic: 'advanced' }
      ];
      return minimalLessons.map((l, i) => ({ ...l, order: i + 1 }));
    }
    
    // Return empty array for other modules
    return [];
  }

  /**
   * Get quiz for a specific module
   */
  async getModuleQuiz(moduleSlug: string): Promise<Quiz | null> {
    // Load all module quizzes from local content only
    
    // For server-side operations, read files directly instead of making HTTP requests
    if (typeof window === 'undefined') {
      try {
        // Dynamically import fs and path only when needed on server-side
        const fs = await import('fs');
        const path = await import('path');
        
        // Try to find the quiz file in different possible locations
        const possiblePaths = [
          path.join(process.cwd(), '..', '..', 'content', 'quizzes', `${moduleSlug}.json`),
          path.join(process.cwd(), 'content', 'quizzes', `${moduleSlug}.json`),
          path.join(__dirname, '..', '..', '..', '..', 'content', 'quizzes', `${moduleSlug}.json`),
          // Production path (only if NEXT_PUBLIC_BASE_URL indicates production)
          ...(process.env.NEXT_PUBLIC_BASE_URL?.includes('glasscode.academy') ? 
            [path.join('/srv/academy', 'content', 'quizzes', `${moduleSlug}.json`)] : []),
        ];
        
        let quizPath = '';
        for (const possiblePath of possiblePaths) {
          try {
            if (fs.existsSync(possiblePath)) {
              quizPath = possiblePath;
              break;
            }
          } catch {
            // Continue to next path
          }
        }
        
        if (!quizPath) {
          console.error(`Quiz file not found for module: ${moduleSlug}`);
          return null;
        }
        
        const quizContent = fs.readFileSync(quizPath, 'utf8');
        const quizData: unknown = JSON.parse(quizContent);
        const quiz = quizData && typeof quizData === 'object' ? (quizData as Quiz) : null;
        if (!quiz) return null;
        const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map(q => normalizeQuestion(q)) : [];
        return { ...quiz, questions: normalizedQuestions };
      } catch (error: unknown) {
        console.error(`Failed to load quiz for ${moduleSlug} (server-side):`, error);
        return null;
      }
    }
    
    // For client-side, use HTTP requests
    try {
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`/api/content/quizzes/${moduleSlug}`, {
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error(`Received HTML instead of JSON for quizzes/${moduleSlug}`);
        return null;
      }
      
      if (!response.ok) {
        console.error(`HTTP error ${response.status} for quizzes/${moduleSlug}`);
        // Client-side static fallback: try public content
        try {
          const staticRes = await fetch(`/content/quizzes/${moduleSlug}.json`, {
            signal: controller.signal,
          });
          if (staticRes.ok) {
            const staticData: unknown = await staticRes.json();
            if (staticData && typeof staticData === 'object') {
              const quiz = staticData as Quiz;
              const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map(q => normalizeQuestion(q)) : [];
              return { ...quiz, questions: normalizedQuestions };
            }
          }
        } catch (staticErr) {
          console.error(`Static quiz fallback failed for ${moduleSlug}:`, staticErr);
        }
        return null;
      }
      
      const data: unknown = await response.json();
      if (!(data && typeof data === 'object')) return null;
      const quiz = data as Quiz;
      const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map(q => normalizeQuestion(q)) : [];
      return { ...quiz, questions: normalizedQuestions };
    } catch (error: unknown) {
      console.error(`Failed to load quiz for ${moduleSlug}:`, error);
      // Return null as fallback to prevent build failures
      return null;
    }
  }

  /**
   * Get programming fundamentals lessons via API
   */
  async getProgrammingLessons(): Promise<Lesson[]> {
    // Use the same API route as getModuleLessons for consistency
    return this.getModuleLessons('programming-fundamentals');
  }

  /**
   * Get programming fundamentals questions via GraphQL
   */
  async getProgrammingQuestions(): Promise<ProgrammingQuestion[]> {
    // Load programming fundamentals questions from local quiz content
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        const possiblePaths = [
          path.join(process.cwd(), '..', '..', 'content', 'quizzes', `programming-fundamentals.json`),
          path.join(process.cwd(), 'content', 'quizzes', `programming-fundamentals.json`),
          path.join(__dirname, '..', '..', '..', '..', 'content', 'quizzes', `programming-fundamentals.json`),
          // Production path (only if NEXT_PUBLIC_BASE_URL indicates production)
          ...(process.env.NEXT_PUBLIC_BASE_URL?.includes('glasscode.academy') ? 
            [path.join('/srv/academy', 'content', 'quizzes', `programming-fundamentals.json`)] : []),
        ];
        for (const quizPath of possiblePaths) {
          try {
            if (fs.existsSync(quizPath)) {
              const fileContent = fs.readFileSync(quizPath, 'utf8');
              const quizData: unknown = JSON.parse(fileContent);
              const questions = (quizData && typeof quizData === 'object' && (quizData as Quiz).questions) ? (quizData as Quiz).questions : [];
              return questions.map(q => normalizeQuestion(q));
            }
          } catch {
            // Continue to next path
          }
        }
        return [];
      } else {
        const response = await fetch(`/api/content/quizzes/programming-fundamentals`);
        if (!response.ok) return [];
        const data: unknown = await response.json();
        const questions = (data && typeof data === 'object' && (data as Quiz).questions) ? (data as Quiz).questions : [];
        return questions.map(q => normalizeQuestion(q));
      }
    } catch (error: unknown) {
      console.error('Failed to load programming fundamentals questions from local content:', error);
      return [];
    }
  }

  /**
   * Get moduleSlug from shortSlug (for backward compatibility)
   */
  async getModuleSlugFromShortSlug(shortSlug: string): Promise<string | null> {
    // Define the mapping from shortSlug to moduleSlug
    const shortSlugToModuleSlug: Record<string, string> = {
      'programming': 'programming-fundamentals',
      'web': 'web-fundamentals', 
      'version': 'version-control',
      'dotnet': 'dotnet-fundamentals',
      'react': 'react-fundamentals',
      'database': 'database-systems',
      'typescript': 'typescript-fundamentals',
      'node': 'node-fundamentals',
      'laravel': 'laravel-fundamentals',
      'nextjs': 'nextjs-advanced',
      'graphql': 'graphql-advanced',
      'sass': 'sass-advanced',
      'tailwind': 'tailwind-advanced',
      'vue': 'vue-advanced',
      'testing': 'testing-fundamentals',
      'e2e': 'e2e-testing',
      'performance': 'performance-optimization',
      'security': 'security-fundamentals'
    };
    
    return shortSlugToModuleSlug[shortSlug] || null;
  }

  /**
   * Get shortSlug from moduleSlug (for migration purposes)
   */
  async getShortSlugFromModuleSlug(moduleSlug: string): Promise<string | null> {
    // Define the mapping from moduleSlug to shortSlug
    const moduleSlugToShortSlug: Record<string, string> = {
      'programming-fundamentals': 'programming',
      'web-fundamentals': 'web',
      'version-control': 'version',
      'dotnet-fundamentals': 'dotnet',
      'react-fundamentals': 'react',
      'database-systems': 'database',
      'typescript-fundamentals': 'typescript',
      'node-fundamentals': 'node',
      'laravel-fundamentals': 'laravel',
      'nextjs-advanced': 'nextjs',
      'graphql-advanced': 'graphql',
      'sass-advanced': 'sass',
      'tailwind-advanced': 'tailwind',
      'vue-advanced': 'vue',
      'testing-fundamentals': 'testing',
      'e2e-testing': 'e2e',
      'performance-optimization': 'performance',
      'security-fundamentals': 'security'
    };
    
    return moduleSlugToShortSlug[moduleSlug] || null;
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
      const [lessons, quiz, mod] = await Promise.all([
        this.getModuleLessons(moduleSlug),
        this.getModuleQuiz(moduleSlug),
        this.getModule(moduleSlug)
      ]);
      
      if (!mod) {
        return { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
      }
      
      const lessonsMeetThreshold = lessons.length >= (mod.thresholds?.requiredLessons || 0);
      const quizMeetsThreshold = !!quiz && ((quiz?.questions?.length ?? 0) >= (mod.thresholds?.requiredQuestions || 0));
      
      return {
        lessons: lessonsMeetThreshold,
        lessonsValid: lessonsMeetThreshold,
        quiz: quizMeetsThreshold,
        quizValid: quizMeetsThreshold,
        overall: lessonsMeetThreshold && quizMeetsThreshold
      };
    } catch (error) {
      console.error(`Failed to check thresholds for ${moduleSlug}:`, error);
      // Return safe defaults to prevent build failures
      return { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
    }
  }
}

// Export singleton instance
export const contentRegistry = ContentRegistryLoader.getInstance();

// Export utility functions for lesson grouping
export function getLessonGroups(moduleSlug: string, lessons: Lesson[]): LessonGroup[] {
  if (moduleSlug === 'programming-fundamentals') {
    // Group programming fundamentals lessons into logical categories
    return [
      {
        id: 'basic-concepts',
        title: 'Basic Programming Concepts',
        description: 'Learn fundamental programming concepts including variables, control structures, and functions',
        lessons: lessons.slice(0, 3), // Lessons 1-3
        order: 1
      },
      {
        id: 'data-structures',
        title: 'Data Structures',
        description: 'Explore arrays, objects, and object-oriented programming concepts',
        lessons: lessons.slice(3, 5), // Lessons 4-5
        order: 2
      },
      {
        id: 'error-handling',
        title: 'Error Handling & File Operations',
        description: 'Master error handling techniques and file input/output operations',
        lessons: lessons.slice(5, 7), // Lessons 6-7
        order: 3
      },
      {
        id: 'algorithms',
        title: 'Algorithms & Recursion',
        description: 'Develop algorithmic thinking and understand recursive problem solving',
        lessons: lessons.slice(7, 9), // Lessons 8-9
        order: 4
      },
      {
        id: 'advanced-topics',
        title: 'Advanced Topics',
        description: 'Deep dive into memory management, best practices, and project organization',
        lessons: lessons.slice(9, 12), // Lessons 10-12
        order: 5
      }
    ];
  }

  // Attempt to group by 'topic' or legacy originalTopic if available
  const topics = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const legacyTopic = (lesson as unknown as { legacy?: { originalTopic?: string } }).legacy?.originalTopic;
    const topic = (lesson.topic || legacyTopic) as string | undefined;
    if (topic && topic.trim().length > 0) {
      const list = topics.get(topic) || [];
      list.push(lesson);
      topics.set(topic, list);
    }
  }

  if (topics.size > 0) {
    const groups: LessonGroup[] = Array.from(topics.entries()).map(([title, groupLessons], idx) => ({
      id: `group-${idx + 1}`,
      title,
      description: '',
      lessons: groupLessons,
      order: idx + 1
    }));

    // Sort groups by the smallest lesson order within each group when available
    groups.sort((a, b) => {
      const aOrder = Math.min(...a.lessons.map((l) => (l.order ?? Number.MAX_SAFE_INTEGER)));
      const bOrder = Math.min(...b.lessons.map((l) => (l.order ?? Number.MAX_SAFE_INTEGER)));
      return aOrder - bOrder;
    });

    // Reassign sequential order values post-sort
    groups.forEach((g, i) => { g.order = i + 1; });
    return groups;
  }

  // Fallback: one group per lesson
  return lessons.map((lesson, index) => ({
    id: `group-${index + 1}`,
    title: lesson.title,
    description: lesson.intro ? lesson.intro.split('\n')[0] : '',
    lessons: [lesson],
    order: index + 1
  }));
}

export function getLessonGroupForLesson(moduleSlug: string, lessons: Lesson[], lessonOrder: number): { group: LessonGroup; groupIndex: number } | null {
  const groups = getLessonGroups(moduleSlug, lessons);
  const lessonIndex = lessonOrder - 1;
  const lesson = lessons[lessonIndex];
  
  if (!lesson) return null;
  
  for (const group of groups) {
    // Match by identity to avoid relying on potentially missing/unsynchronized order values
    if (group.lessons.some((l) => l === lesson)) {
      return {
        group,
        groupIndex: groups.indexOf(group)
      };
    }
  }
  
  return null;
}

export function getNextLessonGroup(moduleSlug: string, lessons: Lesson[], lessonOrder: number): LessonGroup | null {
  const groups = getLessonGroups(moduleSlug, lessons);
  const currentGroupInfo = getLessonGroupForLesson(moduleSlug, lessons, lessonOrder);
  
  if (!currentGroupInfo) return null;
  
  const nextGroupIndex = currentGroupInfo.groupIndex + 1;
  return nextGroupIndex < groups.length ? groups[nextGroupIndex] : null;
}

// Export types
export type { Module, Tier, ContentRegistry, Lesson, ProgrammingQuestion, Quiz };