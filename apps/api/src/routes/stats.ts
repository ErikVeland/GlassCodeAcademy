import type { FastifyInstance } from 'fastify';
import contentService from '../services/contentService';

export async function registerStatsRoutes(app: FastifyInstance) {
  // Get aggregated statistics for all content
  app.get('/api/stats/aggregate', async (_request, reply) => {
    try {
      // Fetch all courses with nested modules, lessons, and quizzes
      const courses = (await contentService.getAllCourses()) as any[];

      // Initialize counters
      let totalModules = 0;
      let totalLessons = 0;
      let totalQuizzes = 0;
      let totalQuestions = 0;

      // Traverse the nested structure and count
      for (const course of courses) {
        if (course.modules && Array.isArray(course.modules)) {
          totalModules += course.modules.length;

          for (const module of course.modules) {
            if (module.lessons && Array.isArray(module.lessons)) {
              totalLessons += module.lessons.length;

              for (const lesson of module.lessons) {
                if (lesson.quizzes && Array.isArray(lesson.quizzes)) {
                  totalQuizzes += lesson.quizzes.length;

                  // Count questions in each quiz
                  for (const quiz of lesson.quizzes) {
                    // If quiz has a questions array, count them
                    if (quiz.questions && Array.isArray(quiz.questions)) {
                      totalQuestions += quiz.questions.length;
                    }
                    // If quiz has choices (single question quiz), count as 1
                    else if (quiz.choices) {
                      totalQuestions += 1;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Return aggregated statistics
      return {
        data: {
          totalModules,
          totalLessons,
          totalQuizzes,
          totalQuestions,
          totalCourses: courses.length,
        },
      };
    } catch (error: any) {
      app.log.error({ err: error }, 'Failed to fetch aggregate stats');
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch aggregate statistics',
      };
    }
  });
}
