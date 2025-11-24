import type { FastifyInstance } from 'fastify';
import {
  getAllModules,
  getLessonsByModuleSlug,
  getQuizzesByModuleSlug,
} from '../utils/optimized-content';
import { z } from 'zod';

// Schema for search query validation
const SearchQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  type: z.enum(['all', 'lessons', 'quizzes']).optional().default('all'),
  module: z.string().optional(),
});

type SearchQuery = z.infer<typeof SearchQuerySchema>;

// Search result types
interface SearchResult {
  type: 'lesson' | 'quiz';
  moduleId: string;
  moduleName: string;
  title: string;
  excerpt: string;
  matchType: 'title' | 'content' | 'objective' | 'question';
  relevance: number;
}

// Helper function to create excerpt from content
function createExcerpt(
  content: string,
  searchTerm: string,
  maxLength: number = 150
): string {
  if (!content) return '';

  // Find the first occurrence of the search term
  const searchTermIndex = content
    .toLowerCase()
    .indexOf(searchTerm.toLowerCase());

  if (searchTermIndex === -1) {
    // If search term not found, return beginning of content
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  // Calculate start position (try to center the search term)
  const start = Math.max(0, searchTermIndex - Math.floor(maxLength / 2));
  const end = Math.min(content.length, start + maxLength);

  let excerpt = content.substring(start, end);

  // Add ellipsis if not at the beginning or end
  if (start > 0) {
    excerpt = '...' + excerpt;
  }
  if (end < content.length) {
    excerpt = excerpt + '...';
  }

  return excerpt;
}

// Helper function to calculate relevance score
function calculateRelevance(text: string, searchTerm: string): number {
  if (!text || !searchTerm) return 0;

  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();

  // Exact match gets highest score
  if (lowerText === lowerSearch) return 100;

  // Starts with search term
  if (lowerText.startsWith(lowerSearch)) return 90;

  // Contains exact phrase
  if (lowerText.includes(lowerSearch)) return 75;

  // Partial word matches
  const words = lowerText.split(/\s+/);
  const searchWords = lowerSearch.split(/\s+/);

  let score = 0;
  for (const searchWord of searchWords) {
    for (const word of words) {
      if (word.includes(searchWord)) {
        score += 10;
      }
    }
  }

  return Math.min(score, 50); // Cap partial match score
}

// Search in lessons
async function searchLessons(
  searchTerm: string,
  moduleId?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const modules = moduleId ? [{ slug: moduleId }] : await getAllModules();

  for (const module of modules) {
    try {
      const lessons = await getLessonsByModuleSlug(module.slug);

      for (const lesson of lessons) {
        const matches: SearchResult[] = [];
        const lowerSearch = searchTerm.toLowerCase();

        // Search in title
        if (lesson.title && lesson.title.toLowerCase().includes(lowerSearch)) {
          matches.push({
            type: 'lesson',
            moduleId: module.slug,
            moduleName: module.slug,
            title: lesson.title,
            excerpt: createExcerpt(lesson.title, searchTerm),
            matchType: 'title',
            relevance: calculateRelevance(lesson.title, searchTerm),
          });
        }

        // Search in introduction
        if (lesson.intro && lesson.intro.toLowerCase().includes(lowerSearch)) {
          matches.push({
            type: 'lesson',
            moduleId: module.slug,
            moduleName: module.slug,
            title: lesson.title,
            excerpt: createExcerpt(lesson.intro, searchTerm),
            matchType: 'content',
            relevance: calculateRelevance(lesson.intro, searchTerm),
          });
        }

        // Search in objectives
        if (lesson.objectives) {
          for (const objective of lesson.objectives) {
            if (objective.toLowerCase().includes(lowerSearch)) {
              matches.push({
                type: 'lesson',
                moduleId: module.slug,
                moduleName: module.slug,
                title: lesson.title,
                excerpt: createExcerpt(objective, searchTerm),
                matchType: 'objective',
                relevance: calculateRelevance(objective, searchTerm),
              });
            }
          }
        }

        // Add all matches for this lesson
        results.push(...matches);
      }
    } catch (error) {
      console.warn(`Failed to search lessons in module ${module.slug}:`, error);
    }
  }

  return results;
}

// Search in quizzes
async function searchQuizzes(
  searchTerm: string,
  moduleId?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const modules = moduleId ? [{ slug: moduleId }] : await getAllModules();

  for (const module of modules) {
    try {
      const quizData = await getQuizzesByModuleSlug(module.slug);
      const questions = quizData?.questions || [];

      for (const question of questions) {
        const matches: SearchResult[] = [];
        const lowerSearch = searchTerm.toLowerCase();

        // Search in question text
        if (
          question.question &&
          question.question.toLowerCase().includes(lowerSearch)
        ) {
          matches.push({
            type: 'quiz',
            moduleId: module.slug,
            moduleName: module.slug,
            title: `Quiz Question: ${question.topic || 'Untitled'}`,
            excerpt: createExcerpt(question.question, searchTerm),
            matchType: 'question',
            relevance: calculateRelevance(question.question, searchTerm),
          });
        }

        // Search in choices
        if (question.choices) {
          for (const choice of question.choices) {
            if (choice.toLowerCase().includes(lowerSearch)) {
              matches.push({
                type: 'quiz',
                moduleId: module.slug,
                moduleName: module.slug,
                title: `Quiz Question: ${question.topic || 'Untitled'}`,
                excerpt: createExcerpt(choice, searchTerm),
                matchType: 'content',
                relevance: calculateRelevance(choice, searchTerm),
              });
            }
          }
        }

        // Search in explanation
        if (
          question.explanation &&
          question.explanation.toLowerCase().includes(lowerSearch)
        ) {
          matches.push({
            type: 'quiz',
            moduleId: module.slug,
            moduleName: module.slug,
            title: `Quiz Question: ${question.topic || 'Untitled'}`,
            excerpt: createExcerpt(question.explanation, searchTerm),
            matchType: 'content',
            relevance: calculateRelevance(question.explanation, searchTerm),
          });
        }

        // Add all matches for this question
        results.push(...matches);
      }
    } catch (error) {
      console.warn(`Failed to search quizzes in module ${module.slug}:`, error);
    }
  }

  return results;
}

export async function registerSearchRoutes(app: FastifyInstance) {
  app.get('/api/search', async (request, reply) => {
    const { q, type, module } = request.query as {
      q?: string;
      type?: string;
      module?: string;
    };

    // Validate query parameters
    try {
      // Check if q parameter is provided
      if (q === undefined) {
        reply.code(400);
        return { error: 'Search query parameter "q" is required' };
      }

      const validatedQuery: SearchQuery = SearchQuerySchema.parse({
        q,
        type,
        module,
      });
      const searchTerm = validatedQuery.q.trim();

      const results: SearchResult[] = [];

      // Search in lessons if requested
      if (validatedQuery.type === 'all' || validatedQuery.type === 'lessons') {
        const lessonResults = await searchLessons(
          searchTerm,
          validatedQuery.module
        );
        results.push(...lessonResults);
      }

      // Search in quizzes if requested
      if (validatedQuery.type === 'all' || validatedQuery.type === 'quizzes') {
        const quizResults = await searchQuizzes(
          searchTerm,
          validatedQuery.module
        );
        results.push(...quizResults);
      }

      // Sort by relevance (highest first)
      results.sort((a, b) => b.relevance - a.relevance);

      // Limit results to 50
      const limitedResults = results.slice(0, 50);

      return {
        query: searchTerm,
        totalResults: results.length,
        results: limitedResults,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return {
          error: 'Invalid search parameters',
          details: error.errors?.map((e) => e.message) || [error.message],
        };
      }

      reply.code(500);
      return { error: 'Internal server error during search' };
    }
  });
}
