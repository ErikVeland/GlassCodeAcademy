import { FastifyInstance } from 'fastify';
import { findModuleBySlugOrLegacy, getQuizzesByModuleSlug } from '../utils/content';

export async function registerQuizRoutes(app: FastifyInstance) {
  app.get('/api/modules/:slug/quiz', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const module = await findModuleBySlugOrLegacy(slug);
    if (!module) {
      reply.code(404);
      return { error: 'Module not found' };
    }
    const quizzes = await getQuizzesByModuleSlug(module.slug);
    return quizzes;
  });
}