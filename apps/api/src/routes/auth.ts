import type { FastifyInstance } from 'fastify';
import { User, Role } from '../models';
import {
  register as registerUserService,
  login as loginUserService,
} from '../services/authService';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register endpoint
  app.post('/api/auth/register', async (request, reply) => {
    const { email, password, firstName, lastName } = request.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };

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
    } catch (error: any) {
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
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    try {
      // Use the auth service to login the user
      const result = await loginUserService({ email, password });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
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

    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['passwordHash'] },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['id', 'name', 'description'],
          },
        ],
      });

      if (!user) {
        reply.code(404);
        return {
          success: false,
          error: {
            message: 'User not found',
          },
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      reply.code(500);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to fetch profile',
        },
      };
    }
  });
}
