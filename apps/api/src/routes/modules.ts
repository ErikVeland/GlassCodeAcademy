import { FastifyInstance } from 'fastify';
import { findModuleBySlugOrLegacy, getLessonsByModuleSlug } from '../utils/content';

export async function registerModuleRoutes(app: FastifyInstance) {
  // File-based: expose lessons by module slug to avoid fake numeric ids
  app.get('/api/modules/:slug/lessons', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const module = await findModuleBySlugOrLegacy(slug);
    if (!module) {
      reply.code(404);
      return { error: 'Module not found' };
    }
    const lessons = await getLessonsByModuleSlug(module.slug);
    return lessons;
  });
}