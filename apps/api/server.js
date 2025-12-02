/* eslint-env node */
'use strict';

// Minimal Fastify server to satisfy local connectivity for frontend
import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import process from 'process';
// Import route registration functions
import { registerAuthRoutes } from './src/routes/auth.js';
import { registerRegistryRoutes } from './src/routes/registry.js';
import { registerModuleRoutes } from './src/routes/modules.js';
import { registerLessonRoutes } from './src/routes/lessons.js';
import { registerQuizRoutes } from './src/routes/quizzes.js';
import { registerCourseRoutes } from './src/routes/courses.js';

// Import stats route from TypeScript (will need to be compiled or we create a .js version)
import contentService from './src/services/contentService.js';

const PORT = Number(process.env.PORT || 8082);

const app = fastify({ logger: true, bodyLimit: 1_048_576, trustProxy: true });

// Security headers
app.register(helmet, { contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });

// Strict CORS
app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? ['https://bet.glasscode.academy'] : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600,
});

// Rate limit
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip || 'unknown',
  skipOnError: true,
});

// Health endpoint used by frontend `/health` (simple version)
app.get('/health', async () => ({ success: true, status: 'ok' }));

// Basic root for sanity
app.get('/', async () => ({ ok: true }));

// Register API routes
// Note: registerHealthRoutes adds /api/health, not /health
// Register inline stats route
app.get('/api/stats/aggregate', async (_request, reply) => {
  try {
    const courses = await contentService.getAllCourses();
    let totalModules = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;
    let totalQuestions = 0;
    
    for (const course of courses) {
      if (course.modules && Array.isArray(course.modules)) {
        totalModules += course.modules.length;
        for (const module of course.modules) {
          if (module.lessons && Array.isArray(module.lessons)) {
            totalLessons += module.lessons.length;
            for (const lesson of module.lessons) {
              if (lesson.quizzes && Array.isArray(lesson.quizzes)) {
                totalQuizzes += lesson.quizzes.length;
                for (const quiz of lesson.quizzes) {
                  if (quiz.questions && Array.isArray(quiz.questions)) {
                    totalQuestions += quiz.questions.length;
                  } else if (quiz.choices) {
                    totalQuestions += 1;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return {
      data: {
        totalModules,
        totalLessons,
        totalQuizzes,
        totalQuestions,
        totalCourses: courses.length
      }
    };
  } catch (error) {
    app.log.error({ err: error }, 'Failed to fetch aggregate stats');
    reply.code(500);
    return {
      success: false,
      error: 'Failed to fetch aggregate statistics'
    };
  }
});
await registerAuthRoutes(app);
await registerCourseRoutes(app);
await registerRegistryRoutes(app);
await registerModuleRoutes(app);
await registerLessonRoutes(app);
await registerQuizRoutes(app);

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API server listening on http://localhost:${PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });