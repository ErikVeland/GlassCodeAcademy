import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/tokenService';

/**
 * Fastify preHandler hook that verifies a JWT Bearer token and
 * populates `request.user` with the decoded payload.
 *
 * Usage: add `{ preHandler: [authenticate] }` to any route that
 * requires a logged-in user.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({
      success: false,
      error: { message: 'Missing or invalid authorization header' },
    });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    reply.code(401).send({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
    return;
  }

  // Attach the decoded token payload to the request
  (request as any).user = payload;
}
