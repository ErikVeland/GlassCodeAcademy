import type { FastifyInstance } from 'fastify';
import { User, Role } from '../models';
import {
  register as registerUserService,
  login as loginUserService,
} from '../services/authService';
import { generateToken } from '../services/tokenService';
import {
  RegisterSchema,
  LoginSchema,
  validateParams,
} from '../utils/validation';
import { authenticate } from '../middleware/auth';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register endpoint
  app.post('/api/auth/register', async (request, reply) => {
    try {
      const body = validateParams(RegisterSchema, request.body);

      const result: any = await registerUserService({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password,
      });

      // Generate a JWT so the client is authenticated immediately
      const token = generateToken(result.user);

      return {
        success: true,
        data: { ...result, token },
      };
    } catch (error: any) {
      const isValidation = error.message?.startsWith('Validation error');
      reply.code(isValidation ? 422 : 400);
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
    try {
      const body = validateParams(LoginSchema, request.body);

      const result: any = await loginUserService({
        email: body.email,
        password: body.password,
      });

      // Generate a JWT for the authenticated user
      const token = generateToken(result.user);

      return {
        success: true,
        data: { ...result, token },
      };
    } catch (error: any) {
      const isValidation = error.message?.startsWith('Validation error');
      reply.code(isValidation ? 422 : 401);
      return {
        success: false,
        error: {
          message: error.message || 'Invalid credentials',
        },
      };
    }
  });

  // Get profile endpoint — protected by JWT middleware
  app.get(
    '/api/auth/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request as any).user?.userId;

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
    }
  );
}
