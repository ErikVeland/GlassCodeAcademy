import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRegistryRoutes } from './routes/registry';
import { registerModuleRoutes } from './routes/modules';
import { registerLessonRoutes } from './routes/lessons';
import { registerQuizRoutes } from './routes/quizzes';

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await registerRegistryRoutes(app);
  await registerModuleRoutes(app);
  await registerLessonRoutes(app);
  await registerQuizRoutes(app);

  return app;
}

async function start() {
  const app = await buildServer();
  const port = Number(process.env.PORT || 8081);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start TS server:', err);
  process.exit(1);
});