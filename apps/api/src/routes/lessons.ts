import { FastifyInstance } from 'fastify';
import { getQuizzesByLessonId } from '../utils/content';

export async function registerLessonRoutes(app: FastifyInstance) {
  app.get('/api/lessons/:lessonId/quizzes', async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };
    const quizzes = await getQuizzesByLessonId(lessonId);
    if (!quizzes) {
      reply.code(404);
      return { error: 'Quizzes not found for lesson' };
    }
    return quizzes;
  });
}