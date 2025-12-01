import type { FastifyInstance } from 'fastify';
import contentService from '../services/contentService';
import { ModuleSlugSchema, validateParams } from '../utils/validation';

export async function registerCourseRoutes(app: FastifyInstance) {
  // Get all courses with pagination support
  app.get('/api/courses', async (request, reply) => {
    try {
      // Extract pagination parameters
      const query = request.query as { page?: string; limit?: string };
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '10', 10);
      
      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        reply.code(400);
        return { error: 'Invalid page parameter' };
      }
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        reply.code(400);
        return { error: 'Invalid limit parameter (must be between 1 and 100)' };
      }
      
      const courses = await contentService.getAllCourses();
      
      // Simulate pagination (in a real implementation, this would be done at the database level)
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCourses = courses.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          courses: paginatedCourses,
          pagination: {
            page,
            limit,
            total: courses.length,
            pages: Math.ceil(courses.length / limit)
          }
        }
      };
    } catch (_error) {
      reply.code(500);
      return { 
        success: false,
        error: 'Failed to fetch courses' 
      };
    }
  });

  // Get course by slug
  app.get('/api/courses/:slug', async (request, reply) => {
    // Validate the slug parameter
    const { slug } = request.params as { slug: string };

    try {
      validateParams(ModuleSlugSchema, slug);
    } catch (_error) {
      reply.code(400);
      return { 
        success: false,
        error: 'Invalid course slug format' 
      };
    }

    try {
      const course = await contentService.getCourseBySlug(slug);
      if (!course) {
        reply.code(404);
        return { 
          success: false,
          error: 'Course not found' 
        };
      }
      
      return {
        success: true,
        data: course
      };
    } catch (_error) {
      reply.code(500);
      return { 
        success: false,
        error: 'Failed to fetch course' 
      };
    }
  });

  // Get course by ID
  app.get('/api/courses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const courseId = parseInt(id, 10);
      if (isNaN(courseId)) {
        reply.code(400);
        return { 
          success: false,
          error: 'Invalid course ID' 
        };
      }

      const course = await contentService.getCourseById(courseId);
      if (!course) {
        reply.code(404);
        return { 
          success: false,
          error: 'Course not found' 
        };
      }
      
      return {
        success: true,
        data: course
      };
    } catch (_error) {
      reply.code(500);
      return { 
        success: false,
        error: 'Failed to fetch course' 
      };
    }
  });
}