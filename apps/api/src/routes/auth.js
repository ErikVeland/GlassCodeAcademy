import { register as registerUserService, login as loginUserService } from '../services/authService.js';

export async function registerAuthRoutes(app) {
  // Register endpoint
  app.post('/api/auth/register', async (request, reply) => {
    const { email, password, firstName, lastName } = request.body;

    try {
      // Use the auth service to register the user
      const result = await registerUserService({
        email,
        firstName,
        lastName,
        password,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      reply.code(400);
      return {
        success: false,
        error: {
          message: error.message || 'Registration failed',
        },
      };
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    try {
      // Use the auth service to login the user
      const result = await loginUserService({ email, password });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      reply.code(401);
      return {
        success: false,
        error: {
          message: error.message || 'Invalid credentials',
        },
      };
    }
  });

  // Get profile endpoint
  app.get('/api/auth/me', async (request, reply) => {
    // @ts-expect-error - Fastify request decoration
    const userId = request.user?.id;

    if (!userId) {
      reply.code(401);
      return {
        success: false,
        error: {
          message: 'Unauthorized',
        },
      };
    }

    // For now, we'll return a mock user since we don't have the User model imported
    // In a real implementation, you would fetch the user from the database
    return {
      success: true,
      data: {
        id: userId,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    };
  });
}