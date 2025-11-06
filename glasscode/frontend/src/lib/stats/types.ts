// Types for stats feature

export interface AppStats {
  totalLessons: number;
  totalQuizzes: number;
  totalModules: number;
  totalQuestions: number;
  averageCompletionTime: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  moduleBreakdown: {
    name: string;
    lessons: number;
    questions: number;
    color: string;
  }[];
  tierBreakdown: {
    foundational: number;
    core: number;
    specialized: number;
    quality: number;
  };
  topicDistribution: {
    [key: string]: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Base type for registry-based results (no loading/error)
export type BaseStats = Omit<AppStats, 'isLoading' | 'error'>;

// Client-safe registry shapes used by stats
export interface ModuleRoutes { overview?: string; lessons?: string; quiz?: string }
export interface RegistryModule { slug: string; title?: string; difficulty?: string; tier?: string; routes?: ModuleRoutes }
export interface RegistryResponse { modules: RegistryModule[] }