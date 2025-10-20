/**
 * Content Registry Utilities
 * Provides centralized access to content registry data for routing and navigation
 */


import { normalizeQuestion } from './textNormalization';
import { getPublicOriginStrict } from './urlUtils';

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
  private registryPromise: Promise<ContentRegistry> | null = null;

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
   * Load the content registry from API with caching
   */
  async loadRegistry(): Promise<ContentRegistry> {
    // Return cached registry if available
    if (this.registry) {
      return this.registry;
    }

    // Return existing promise if loading is in progress
    if (this.registryPromise) {
      return this.registryPromise;
    }

    // Create new promise for loading
    this.registryPromise = this.loadRegistryInternal().then(registry => {
      this.registry = registry;
      this.registryPromise = null;
      return registry;
    }).catch(error => {
      this.registryPromise = null;
      throw error;
    });

    return this.registryPromise;
  }

  /**
   * Internal method to load registry
   */
  private async loadRegistryInternal(): Promise<ContentRegistry> {
    try {
      const isBrowser = typeof window !== 'undefined';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const base = isBrowser ? '' : (() => { try { return getPublicOriginStrict().replace(/\/+$/, ''); } catch { return ''; } })();
      const candidates = isBrowser
        ? ['/registry.json', '/api/content/registry']
        : (base ? [`${base}/registry.json`, `${base}/api/content/registry`] : ['/registry.json', '/api/content/registry']);

      for (const url of candidates) {
        try {
          const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
          if (res.ok) {
            clearTimeout(timeoutId);
            const data: unknown = await res.json();
            return data as ContentRegistry;
          }
        } catch {
          // Try next candidate
        }
      }
      clearTimeout(timeoutId);
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
      return minimal;
    } catch {
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
      return minimal;
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
    console.log(`getModule(${slug}): total modules loaded:`, modules.length);
    
    // First try to find by exact slug match (moduleSlug)
    let foundModule = modules.find(m => m.slug === slug);
    console.log(`getModule(${slug}): found by exact slug:`, foundModule?.slug);
    
    // If not found, try to convert shortSlug to moduleSlug and search again
    if (!foundModule) {
      const moduleSlug = await this.getModuleSlugFromShortSlug(slug);
      console.log(`getModule(${slug}): converted to moduleSlug:`, moduleSlug);
      if (moduleSlug) {
        foundModule = modules.find(m => m.slug === moduleSlug);
        console.log(`getModule(${slug}): found by moduleSlug:`, foundModule?.slug);
      }
    }
    
    if (foundModule) {
      console.log(`getModule(${slug}): returning module with metadata:`, foundModule.metadata);
      console.log(`getModule(${slug}): returning module with thresholds:`, foundModule.thresholds);
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
    // Prefer relative path in the browser to avoid origin/env mismatches
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/content/lessons/${moduleSlug}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data: unknown = await res.json();
      const lessonsArr: Lesson[] = Array.isArray(data)
        ? (data as Lesson[])
        : (Array.isArray((data as { lessons?: Lesson[] })?.lessons) ? ((data as { lessons?: Lesson[] }).lessons as Lesson[]) : []);
      return lessonsArr.map((l, i) => (typeof l.order === 'number' ? l : { ...l, order: i + 1 }));
    }
    // Server-side: first try hitting our API route via public origin
    const origin = (() => { try { return getPublicOriginStrict(); } catch { return ''; } })();
    if (origin) {
      try {
        const res = await fetch(`${origin.replace(/\/+$/, '')}/api/content/lessons/${moduleSlug}`, { cache: 'no-store' });
        if (res.ok) {
          const data: unknown = await res.json();
          const lessonsArr: Lesson[] = Array.isArray(data)
            ? (data as Lesson[])
            : (Array.isArray((data as { lessons?: Lesson[] })?.lessons) ? ((data as { lessons?: Lesson[] }).lessons as Lesson[]) : []);
          return lessonsArr.map((l, i) => (typeof l.order === 'number' ? l : { ...l, order: i + 1 }));
        }
      } catch {}
    }
    // Remove server-side file fallbacks to avoid bundling Node built-ins
    return [];
  }

  /**
   * Get quiz for a specific module
   */
  async getModuleQuiz(moduleSlug: string): Promise<Quiz | null> {
    try {
      const shortSlug = await this.getShortSlugFromModuleSlug(moduleSlug) || moduleSlug;

      // Prefer relative fetch in browser to avoid relying on env origins
      if (typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/content/quizzes/${shortSlug}`, { cache: 'no-store' });
          if (!res.ok) return null;
          const data: unknown = await res.json();
          if (!(data && typeof data === 'object')) return null;
          const quiz = data as Quiz;
          const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map(q => normalizeQuestion(q)) : [];
          return { ...quiz, questions: normalizedQuestions };
        } catch (err) {
          console.error(`getModuleQuiz(${moduleSlug}): browser fetch failed:`, err);
          return null;
        }
      }

      // Server-side: try public origin first
      try {
        const origin = getPublicOriginStrict().replace(/\/+$/, '');
        const res = await fetch(`${origin}/api/content/quizzes/${shortSlug}`, { cache: 'no-store' });
        if (res.ok) {
          const data: unknown = await res.json();
          if (!(data && typeof data === 'object')) return null;
          const quiz = data as Quiz;
          const normalizedQuestions = Array.isArray(quiz.questions) ? quiz.questions.map(q => normalizeQuestion(q)) : [];
          return { ...quiz, questions: normalizedQuestions };
        }
      } catch {}

      return null;
    } catch (error: unknown) {
      console.error(`Failed to load quiz for ${moduleSlug}:`, error);
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
    try {
      const isBrowser = typeof window !== 'undefined';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const base = isBrowser ? '' : (() => { try { return getPublicOriginStrict().replace(/\/+$/, ''); } catch { return ''; } })();
      const url = isBrowser ? `/api/content/quizzes/programming-fundamentals` : (base ? `${base}/api/content/quizzes/programming-fundamentals` : `/api/content/quizzes/programming-fundamentals`);

      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' }).finally(() => {
        clearTimeout(timeoutId);
      });

      if (!response.ok) return [];
      const data: unknown = await response.json();
      const questions = (data && typeof data === 'object' && (data as Quiz).questions) ? (data as Quiz).questions : [];
      return questions.map(q => normalizeQuestion(q));
    } catch (error: unknown) {
      console.error('Failed to load programming fundamentals questions:', error);
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
        lessons: lessons.slice(9),
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

// Wrapper exports to match API route expectations
export async function getShortSlugFromModuleSlug(moduleSlug: string): Promise<string | null> {
  return contentRegistry.getShortSlugFromModuleSlug(moduleSlug);
}

export async function getModuleSlugFromShortSlug(shortSlug: string): Promise<string | null> {
  return contentRegistry.getModuleSlugFromShortSlug(shortSlug);
}

// Export types
export type { Module, Tier, ContentRegistry, Lesson, ProgrammingQuestion, Quiz };