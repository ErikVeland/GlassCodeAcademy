// Shared client-safe types for registry and quizzes

export interface RegistryModule {
  slug: string;
  shortSlug?: string;
  title: string;
  description?: string;
  icon?: string;
  technologies?: string[];
  difficulty?: string;
  tier?: string;
  thresholds?: {
    requiredLessons?: number;
    requiredQuestions?: number;
    passingScore?: number;
  };
  metadata?: {
    thresholds?: {
      minLessons?: number;
      minQuizQuestions?: number;
      passingScore?: number;
    };
  };
  routes: {
    overview: string;
    lessons: string;
    quiz: string;
    results?: string;
  };
  prerequisites?: string[];
}

export interface RegistryResponse {
  modules: RegistryModule[];
}

export interface ProgrammingQuestion {
  id: string | number;
  question: string;
  choices?: string[];
  correctAnswer?: number;
  explanation?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  estimatedTime?: number;
  order?: number;
  fixedChoiceOrder?: boolean;
}

export interface QuizResponse {
  questions: ProgrammingQuestion[];
}