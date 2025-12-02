import contentService from '../services/contentService.js';

export async function registerCourseRoutes(app) {
  // Get all courses with pagination support
  app.get('/api/courses', async (request, reply) => {
    try {
      // Extract pagination parameters
      const query = request.query || {};
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
    } catch (error) {
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
    const { slug } = request.params;

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
    } catch (error) {
      reply.code(500);
      return { 
        success: false,
        error: 'Failed to fetch course' 
      };
    }
  });

  // Get course by ID (use different path to avoid conflict with slug)
  app.get('/api/courses/id/:id', async (request, reply) => {
    const { id } = request.params;

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
    } catch (error) {
      reply.code(500);
      return { 
        success: false,
        error: 'Failed to fetch course' 
      };
    }
  });
}
