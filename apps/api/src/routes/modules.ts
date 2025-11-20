import { FastifyInstance } from 'fastify';
import contentService from '../services/contentService';
import { ModuleSlugSchema, validateParams } from '../utils/validation';

export async function registerModuleRoutes(app: FastifyInstance) {
  // Get lessons by module slug
  app.get('/api/modules/:slug/lessons', async (request, reply) => {
    // Validate the slug parameter
    const { slug } = request.params as { slug: string };

    try {
      validateParams(ModuleSlugSchema, slug);
    } catch (_error) {
      reply.code(400);
      return { error: 'Invalid module slug format' };
    }

    try {
      const module = await contentService.getModuleBySlug(slug);
      if (!module) {
        reply.code(404);
        return { error: 'Module not found' };
      }
      const lessons = await contentService.getLessonsByModuleId(module.id);
      return lessons;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch lessons' };
    }
  });

  // Get module by ID
  app.get('/api/modules/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const moduleId = parseInt(id, 10);
      if (isNaN(moduleId)) {
        reply.code(400);
        return { error: 'Invalid module ID' };
      }
      
      const module = await contentService.getModuleById(moduleId);
      if (!module) {
        reply.code(404);
        return { error: 'Module not found' };
      }
      return module;
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch module' };
    }
  });
}
