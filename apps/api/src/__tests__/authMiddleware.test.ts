import { authenticate } from '../middleware/auth';
import { generateToken } from '../services/tokenService';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

// Minimal Fastify request/reply mocks
function mockRequest(headers: Record<string, string> = {}) {
  return { headers } as any;
}

function mockReply() {
  const reply: any = {
    statusCode: 200,
    body: null,
    code(status: number) {
      reply.statusCode = status;
      return reply;
    },
    send(payload: any) {
      reply.body = payload;
      return reply;
    },
  };
  return reply;
}

describe('authenticate middleware', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.JWT_SECRET = originalEnv;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('should reject requests without an Authorization header', async () => {
    const req = mockRequest();
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.error.message).toMatch(/missing/i);
  });

  it('should reject requests with a non-Bearer token', async () => {
    const req = mockRequest({ authorization: 'Basic abc123' });
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
  });

  it('should reject an invalid/tampered token', async () => {
    const req = mockRequest({ authorization: 'Bearer invalid.token.value' });
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.error.message).toMatch(/invalid|expired/i);
  });

  it('should populate request.user for a valid token', async () => {
    const user = {
      id: 7,
      email: 'dev@glasscode.academy',
      firstName: 'Dev',
      lastName: 'Tester',
    };
    const token = generateToken(user);
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const reply = mockReply();

    await authenticate(req, reply);

    // Should not have sent an error
    expect(reply.body).toBeNull();
    // Should have attached user payload
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('7');
    expect(req.user.email).toBe('dev@glasscode.academy');
  });
});
