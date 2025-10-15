// Utility functions for handling lesson sources in Interview Prep

export interface LessonSource {
  title: string;
  url: string;
}

export interface LessonSources {
  module: string;
  sources: LessonSource[];
}

// Mapping of interview prep modules to their corresponding lesson modules
export const interviewToLessonMapping: Record<string, string> = {
  'javascript-questions': 'web-fundamentals',
  'sass-questions': 'sass-advanced',
  'react-questions': 'react-fundamentals',
  'dotnet-questions': 'dotnet-fundamentals',
  'typescript-questions': 'nextjs-advanced', // TypeScript is covered in Next.js advanced
  'system-design-questions': 'database-systems', // System design relates to database systems
};

// Technology mapping for individual interview question pages
export const techToLessonMapping: Record<string, string> = {
  'javascript': 'web-fundamentals',
  'sass': 'sass-advanced',
  'react': 'react-fundamentals',
  'dotnet': 'dotnet-fundamentals',
  'typescript': 'nextjs-advanced',
  'nextjs': 'nextjs-advanced',
  'graphql': 'graphql-advanced',
  'vue': 'vue-advanced',
  'testing': 'e2e-testing',
  'version': 'version-control',
};

/**
 * Fetches sources for a given lesson module
 */
export async function fetchLessonSources(moduleSlug: string): Promise<LessonSources | null> {
  try {
    const response = await fetch(`/api/content/lessons/${moduleSlug}/sources`);
    if (!response.ok) {
      console.warn(`Sources not found for module: ${moduleSlug}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching sources for ${moduleSlug}:`, error);
    return null;
  }
}

/**
 * Gets sources for an interview prep module
 */
export async function getInterviewPrepSources(interviewModuleId: string): Promise<LessonSources | null> {
  const lessonModule = interviewToLessonMapping[interviewModuleId];
  if (!lessonModule) {
    return null;
  }
  return await fetchLessonSources(lessonModule);
}

/**
 * Gets sources for a technology-specific interview page
 */
export async function getTechInterviewSources(tech: string): Promise<LessonSources | null> {
  const lessonModule = techToLessonMapping[tech];
  if (!lessonModule) {
    return null;
  }
  return await fetchLessonSources(lessonModule);
}

/**
 * Formats sources for display in UI components
 */
export function formatSourcesForDisplay(sources: LessonSources | null): LessonSource[] {
  if (!sources || !sources.sources) {
    return [];
  }
  return sources.sources;
}