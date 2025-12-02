import contentService from '../services/contentService.js';

export async function registerLessonRoutes(app) {
  app.get('/api/lessons/:lessonId/quizzes', async (request, reply) => {
    const { lessonId } = request.params;

    // Skip validation for now
    // try {
    //   validateParams(LessonIdSchema, lessonId);
    // } catch (error) {
    //   reply.code(400);
    //   return { error: 'Invalid lesson ID format' };
    // }

    try {
      const id = parseInt(lessonId, 10);
      if (isNaN(id)) {
        reply.code(400);
        return { error: 'Invalid lesson ID' };
      }

      const quizzes = await contentService.getQuizzesByLessonId(id);
      return quizzes;
    } catch (_error) {
      reply.code(500);
      return { error: 'Failed to fetch quizzes' };
    }
  });

  // Get lesson by ID
  app.get('/api/lessons/:id', async (request, reply) => {
    const { id } = request.params;

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
    } catch (_error) {
      reply.code(500);
      return { error: 'Failed to fetch lesson' };
    }
  });
}
