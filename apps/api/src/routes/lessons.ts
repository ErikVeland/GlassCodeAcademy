import { FastifyInstance } from 'fastify';
import { getQuizzesByLessonId } from '../utils/optimized-content';
import { LessonIdSchema, validateParams } from '../utils/validation';

export async function registerLessonRoutes(app: FastifyInstance) {
  app.get('/api/lessons/:lessonId/quizzes', async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };

    try {
      validateParams(LessonIdSchema, lessonId);
    } catch (_error) {
      reply.code(400);
      return { error: 'Invalid lesson ID format' };
    }

    const quizzes = await getQuizzesByLessonId(lessonId);
    if (!quizzes) {
      reply.code(404);
      return { error: 'Quizzes not found for lesson' };
    }
    return quizzes;
  });
}
