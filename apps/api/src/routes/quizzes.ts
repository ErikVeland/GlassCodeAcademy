import { FastifyInstance } from 'fastify';
import {
  findModuleBySlugOrLegacy,
  getQuizzesByModuleSlug,
} from '../utils/optimized-content';
import { ModuleSlugSchema, validateParams } from '../utils/validation';

export async function registerQuizRoutes(app: FastifyInstance) {
  app.get('/api/modules/:slug/quiz', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    try {
      validateParams(ModuleSlugSchema, slug);
    } catch (_error) {
      reply.code(400);
      return { error: 'Invalid module slug format' };
    }

    const module = await findModuleBySlugOrLegacy(slug);
    if (!module) {
      reply.code(404);
      return { error: 'Module not found' };
    }
    const quizzes = await getQuizzesByModuleSlug(module.slug);
    return quizzes;
  });
}
