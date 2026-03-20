import { generateToken, verifyToken } from '../services/tokenService';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

describe('tokenService', () => {
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

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      const token = generateToken(user);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      expect(() => generateToken(user)).toThrow(
        'JWT_SECRET environment variable is not set'
      );
    });
  });

  describe('verifyToken', () => {
    it('should decode a valid token', () => {
      const user = {
        id: 42,
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      };
      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe('42');
      expect(decoded!.email).toBe('alice@example.com');
      expect(decoded!.firstName).toBe('Alice');
      expect(decoded!.lastName).toBe('Smith');
    });

    it('should return null for a tampered token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      const token = generateToken(user);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(verifyToken(tampered)).toBeNull();
    });

    it('should return null for an empty string', () => {
      expect(verifyToken('')).toBeNull();
    });

    it('should return null when JWT_SECRET is not set', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      const token = generateToken(user);

      delete process.env.JWT_SECRET;
      expect(verifyToken(token)).toBeNull();
    });
  });
});
