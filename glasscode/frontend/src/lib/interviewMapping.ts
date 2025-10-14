export type InterviewMapping = {
  queryField: string;
  mutationName?: string; // falls back to generic submitAnswer if not provided
  title: string;
};

// Maps slug to GraphQL query field and mutation name
export const INTERVIEW_MAPPINGS: Record<string, InterviewMapping> = {
  // Frontend
  react: { queryField: 'reactInterviewQuestions', mutationName: 'submitReactAnswer', title: 'React Interview Questions' },
  typescript: { queryField: 'typescriptInterviewQuestions', mutationName: 'submitTypescriptAnswer', title: 'TypeScript Interview Questions' },
  sass: { queryField: 'sassInterviewQuestions', mutationName: 'submitSassAnswer', title: 'CSS & SASS Interview Questions' },
  javascript: { queryField: 'programmingInterviewQuestions', mutationName: 'submitProgrammingAnswer', title: 'JavaScript Fundamentals' },

  // Backend and platforms
  dotnet: { queryField: 'dotNetInterviewQuestions', /* no specific mutation in schema */ title: '.NET Core & C# Interview Questions' },
  node: { queryField: 'nodeInterviewQuestions', mutationName: 'submitNodeAnswer', title: 'Node.js Interview Questions' },
  database: { queryField: 'databaseInterviewQuestions', mutationName: 'submitDatabaseAnswer', title: 'Database Interview Questions' },
  vue: { queryField: 'vueInterviewQuestions', mutationName: 'submitVueAnswer', title: 'Vue Interview Questions' },
  web: { queryField: 'webInterviewQuestions', mutationName: 'submitWebAnswer', title: 'Web Fundamentals Interview Questions' },
  tailwind: { queryField: 'tailwindInterviewQuestions', mutationName: 'submitTailwindAnswer', title: 'Tailwind Interview Questions' },
  nextjs: { queryField: 'nextJsInterviewQuestions', mutationName: 'submitNextJsAnswer', title: 'Next.js Interview Questions' },
  performance: { queryField: 'performanceInterviewQuestions', mutationName: 'submitPerformanceAnswer', title: 'Performance Interview Questions' },
  security: { queryField: 'securityInterviewQuestions', mutationName: 'submitSecurityAnswer', title: 'Security Interview Questions' },
  version: { queryField: 'versionInterviewQuestions', mutationName: 'submitVersionAnswer', title: 'Version Control Interview Questions' },
  testing: { queryField: 'testingInterviewQuestions', mutationName: 'submitTestingAnswer', title: 'Testing Interview Questions' },
  graphql: { queryField: 'graphQLInterviewQuestions', /* no specific mutation */ title: 'GraphQL Interview Questions' },
  laravel: { queryField: 'laravelInterviewQuestions', mutationName: 'submitLaravelAnswer', title: 'Laravel Interview Questions' },
};

export function getInterviewMapping(slug: string): InterviewMapping | null {
  const key = slug.toLowerCase();
  return INTERVIEW_MAPPINGS[key] ?? null;
}

export function getSubmitMutationName(slug: string): string {
  const mapping = getInterviewMapping(slug);
  return mapping?.mutationName ?? 'submitAnswer';
}