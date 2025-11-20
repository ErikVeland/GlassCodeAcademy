import { FastifyInstance } from 'fastify';
import contentService from '../services/contentService';
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

    try {
      const id = parseInt(lessonId, 10);
      if (isNaN(id)) {
        reply.code(400);
        return { error: 'Invalid lesson ID' };
      }

      const quizzes = await contentService.getQuizzesByLessonId(id);
      return quizzes;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch quizzes' };
    }
  });

  // Get lesson by ID
  app.get('/api/lessons/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const lessonId = parseInt(id, 10);
      if (isNaN(lessonId)) {
        reply.code(400);
        return { error: 'Invalid lesson ID' };
      }

      const lesson = await contentService.getLessonById(lessonId);
      if (!lesson) {
        reply.code(404);
        return { error: 'Lesson not found' };
      }
      return lesson;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch lesson' };
    }
  });
}
