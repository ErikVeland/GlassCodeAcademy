/**
 * Content Registry Utilities
 * Provides centralized access to content registry data for routing and navigation
 */

import { getApolloClient } from '@/apolloClient';
import { GET_PROGRAMMING_LESSONS, GET_PROGRAMMING_QUESTIONS } from '@/graphql/queries';

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
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_BASE_URL || 'https://glasscode.academy'
            : 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/content/registry`, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
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
        const response = await fetch('/registry.json', {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
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
    // Special handling for programming-fundamentals module to use GraphQL
    if (moduleSlug === 'programming-fundamentals') {
      try {
        const client = getApolloClient();
        const { data } = await client.query({
          query: GET_PROGRAMMING_LESSONS
        });
        return data.programmingLessons || [];
      } catch (error) {
        console.error(`Failed to load programming lessons via GraphQL:`, error);
        // During build time, the backend might not be available
        // Return a minimal set of lessons to allow build to complete
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          console.log('Build phase detected, returning minimal lesson data for programming-fundamentals');
          return [
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
        }
        // Return empty array as fallback to prevent build failures
        return [];
      }
    }
    
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://glasscode.academy'
        : 'http://localhost:3000';
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${baseUrl}/api/content/lessons/${moduleSlug}`, {
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error(`Received HTML instead of JSON for lessons/${moduleSlug}`);
        return [];
      }
      
      if (!response.ok) {
        console.error(`HTTP error ${response.status} for lessons/${moduleSlug}`);
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to load lessons for ${moduleSlug}:`, error);
      // Return empty array as fallback to prevent build failures
      return [];
    }
  }

  /**
   * Get quiz for a specific module
   */
  async getModuleQuiz(moduleSlug: string): Promise<any | null> {
    // Special handling for programming-fundamentals module to use GraphQL
    if (moduleSlug === 'programming-fundamentals') {
      try {
        const client = getApolloClient();
        const { data } = await client.query({
          query: GET_PROGRAMMING_QUESTIONS
        });
        
        // Transform the data to match the expected quiz format
        return {
          questions: data.programmingInterviewQuestions || []
        };
      } catch (error: any) {
        console.error(`Failed to load programming questions via GraphQL:`, error);
        // Check if it's a GraphQL error with specific details
        if (error.graphQLErrors && error.graphQLErrors.length > 0) {
          console.error('GraphQL errors:', error.graphQLErrors);
        }
        if (error.networkError) {
          console.error('Network error:', error.networkError);
        }
        // During build time, the backend might not be available
        // Return a minimal set of questions to allow build to complete
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          console.log('Build phase detected, returning minimal quiz data for programming-fundamentals');
          return {
            questions: [
              { id: 1, topic: 'basics', type: 'multiple-choice', question: 'What is a variable?', choices: ['A storage location', 'A function', 'A loop', 'A class'], correctAnswer: 0, explanation: 'A variable is a storage location paired with an associated symbolic name.' },
              { id: 2, topic: 'basics', type: 'multiple-choice', question: 'What is a function?', choices: ['A storage location', 'A reusable block of code', 'A loop', 'A class'], correctAnswer: 1, explanation: 'A function is a reusable block of code that performs a specific task.' },
              { id: 3, topic: 'data-structures', type: 'multiple-choice', question: 'What is an array?', choices: ['A single value', 'A collection of elements', 'A function', 'A class'], correctAnswer: 1, explanation: 'An array is a collection of elements, each identified by an array index.' }
            ]
          };
        }
        // Return null as fallback to prevent build failures
        return null;
      }
    }
    
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://glasscode.academy'
        : 'http://localhost:3000';
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${baseUrl}/api/content/quizzes/${moduleSlug}`, {
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
        return null;
      }
      
      const data = await response.json();
      return data && typeof data === 'object' ? data : null;
    } catch (error) {
      console.error(`Failed to load quiz for ${moduleSlug}:`, error);
      // Return null as fallback to prevent build failures
      return null;
    }
  }

  /**
   * Get programming fundamentals lessons via GraphQL
   */
  async getProgrammingLessons(): Promise<any[]> {
    // Special handling for programming-fundamentals module to use GraphQL
    try {
      const client = getApolloClient();
      const { data } = await client.query({
        query: GET_PROGRAMMING_LESSONS
      });
      return data.programmingLessons || [];
    } catch (error) {
      console.error(`Failed to load programming lessons via GraphQL:`, error);
      // During build time, the backend might not be available
      // Return a minimal set of lessons to allow build to complete
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.log('Build phase detected, returning minimal lesson data');
        return [
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
      }
      // Return empty array as fallback to prevent build failures
      return [];
    }
  }

  /**
   * Get programming fundamentals questions via GraphQL
   */
  async getProgrammingQuestions(): Promise<any[]> {
    // Special handling for programming-fundamentals module to use GraphQL
    try {
      const client = getApolloClient();
      const { data } = await client.query({
        query: GET_PROGRAMMING_QUESTIONS
      });
      return data.programmingQuestions || [];
    } catch (error) {
      console.error(`Failed to load programming questions via GraphQL:`, error);
      // During build time, the backend might not be available
      // Return a minimal set of questions to allow build to complete
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.log('Build phase detected, returning minimal question data');
        return [
          { id: 1, topic: 'basics', type: 'multiple-choice', question: 'What is a variable?', choices: ['A storage location', 'A function', 'A loop', 'A class'], correctAnswer: 0, explanation: 'A variable is a storage location paired with an associated symbolic name.' },
          { id: 2, topic: 'basics', type: 'multiple-choice', question: 'What is a function?', choices: ['A storage location', 'A reusable block of code', 'A loop', 'A class'], correctAnswer: 1, explanation: 'A function is a reusable block of code that performs a specific task.' },
          { id: 3, topic: 'data-structures', type: 'multiple-choice', question: 'What is an array?', choices: ['A single value', 'A collection of elements', 'A function', 'A class'], correctAnswer: 1, explanation: 'An array is a collection of elements, each identified by an array index.' }
        ];
      }
      // Return empty array as fallback to prevent build failures
      return [];
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
      // Return safe defaults to prevent build failures
      return { lessons: false, lessonsValid: false, quiz: false, quizValid: false, overall: false };
    }
  }
}

// Export singleton instance
export const contentRegistry = ContentRegistryLoader.getInstance();

// Export utility functions for lesson grouping
export function getLessonGroups(moduleSlug: string, lessons: any[]): any[] {
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
  
  // For other modules, create one group per lesson
  return lessons.map((lesson, index) => ({
    id: `group-${index + 1}`,
    title: lesson.title,
    description: lesson.intro ? lesson.intro.split('\n')[0] : '',
    lessons: [lesson],
    order: index + 1
  }));
}

export function getLessonGroupForLesson(moduleSlug: string, lessons: any[], lessonOrder: number): any | null {
  const groups = getLessonGroups(moduleSlug, lessons);
  const lessonIndex = lessonOrder - 1;
  const lesson = lessons[lessonIndex];
  
  if (!lesson) return null;
  
  for (const group of groups) {
    if (group.lessons.some((l: any) => l.order === lesson.order)) {
      return {
        group,
        groupIndex: groups.indexOf(group)
      };
    }
  }
  
  return null;
}

export function getNextLessonGroup(moduleSlug: string, lessons: any[], lessonOrder: number): any | null {
  const groups = getLessonGroups(moduleSlug, lessons);
  const currentGroupInfo = getLessonGroupForLesson(moduleSlug, lessons, lessonOrder);
  
  if (!currentGroupInfo) return null;
  
  const nextGroupIndex = currentGroupInfo.groupIndex + 1;
  return nextGroupIndex < groups.length ? groups[nextGroupIndex] : null;
}

// Export types
export type { Module, Tier, ContentRegistry };