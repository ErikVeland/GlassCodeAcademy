/** Centralized route constants to avoid hardcoded URLs */
export const ROUTES = {
  api: {
    download: {
      animatedBackground: "/api/download/animated-background",
    },
    content: {
      registry: "/api/content/registry",
      lessons: (moduleSlug: string) => `/api/content/lessons/${moduleSlug}`,
      quizzes: (moduleSlug: string) => `/api/content/quizzes/${moduleSlug}`,
    },
    graphql: "/graphql",
    test: "/api/test",
  },
} as const;
