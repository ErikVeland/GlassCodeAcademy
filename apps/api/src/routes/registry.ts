import { FastifyInstance } from 'fastify';
import { getAllModules } from '../utils/content';

export async function registerRegistryRoutes(app: FastifyInstance) {
  app.get('/api/registry/modules', async () => {
    const modules = await getAllModules();
    return { modules };
  });
}