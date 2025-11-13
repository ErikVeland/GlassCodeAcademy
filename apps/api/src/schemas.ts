import { z } from 'zod';

export const QuizQuestionSchema = z.object({
  id: z.number().optional(),
  question: z.string(),
  choices: z.array(z.string()).default([]),
  correctAnswer: z.number().optional(),
  explanation: z.string().optional(),
  topic: z.string().default('general'),
  type: z.string().default('multiple-choice'),
  difficulty: z.string().default('Beginner'),
  estimatedTime: z.number().default(90),
  order: z.number().default(0),
});

export const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).default([]),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

export const RegistryModuleSchema = z.object({
  slug: z.string(),
  shortSlug: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  tier: z.string().optional(),
  routes: z.object({
    overview: z.string(),
    lessons: z.string(),
    quiz: z.string(),
    results: z.string().optional(),
  }),
});

export const RegistrySchema = z.object({
  modules: z.array(RegistryModuleSchema),
});

export type RegistryModule = z.infer<typeof RegistryModuleSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

// Minimal lesson schema to normalize content variability during migration
export const LessonSourceSchema = z.object({
  title: z.string(),
  url: z.string().url().optional(),
});

export const LessonSchema = z.object({
  id: z.number().optional(),
  moduleSlug: z.string(),
  title: z.string(),
  order: z.number().default(0),
  intro: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
  sources: z.array(LessonSourceSchema).default([]).optional(),
  lastUpdated: z.string().optional(),
  version: z.string().optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;