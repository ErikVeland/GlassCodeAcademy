import contentService from '../services/contentService.js';

export async function registerQuizRoutes(app) {
  app.get('/api/modules/:slug/quiz', async (request, reply) => {
    const { slug } = request.params;

    // Skip validation for now
    // try {
    //   validateParams(ModuleSlugSchema, slug);
    // } catch (error) {
    //   reply.code(400);
    //   return { error: 'Invalid module slug format' };
    // }

    try {
      const module = await contentService.getModuleBySlug(slug);
      if (!module) {
        reply.code(404);
        return { error: 'Module not found' };
      }

      // Get all lessons for this module, then get all quizzes for those lessons
      const lessons = await contentService.getLessonsByModuleId(module.id);
      const allQuizzes = [];

      for (const lesson of lessons) {
        const lessonQuizzes = await contentService.getQuizzesByLessonId(
          lesson.id
        );
        allQuizzes.push(...lessonQuizzes);
      }

      return allQuizzes;
    } catch (_error) {
      reply.code(500);
      return { error: 'Failed to fetch quizzes' };
    }
  });

  // Get quiz by ID
  app.get('/api/quizzes/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const quizId = parseInt(id, 10);
      if (isNaN(quizId)) {
        reply.code(400);
        return { error: 'Invalid quiz ID' };
      }

      const quiz = await contentService.getQuizById(quizId);
      if (!quiz) {
        reply.code(404);
        return { error: 'Quiz not found' };
      }
      return quiz;
    } catch (_error) {
      reply.code(500);
      return { error: 'Failed to fetch quiz' };
    }
  });
}