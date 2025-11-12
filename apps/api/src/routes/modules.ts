import { FastifyInstance } from 'fastify';
import {
  findModuleBySlugOrLegacy,
  getLessonsByModuleSlug,
} from '../utils/optimized-content';
import { ModuleSlugSchema, validateParams } from '../utils/validation';

export async function registerModuleRoutes(app: FastifyInstance) {
  // File-based: expose lessons by module slug to avoid fake numeric ids
  app.get('/api/modules/:slug/lessons', async (request, reply) => {
    // Validate the slug parameter
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
    const lessons = await getLessonsByModuleSlug(module.slug);
    return lessons;
  });
}
