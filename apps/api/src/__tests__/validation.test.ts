import {
  RegisterSchema,
  LoginSchema,
  ModuleSlugSchema,
  validateParams,
} from '../utils/validation';

describe('validation schemas', () => {
  describe('RegisterSchema', () => {
    it('should accept valid registration data', () => {
      const data = {
        email: 'user@example.com',
        password: 'securePass1',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'securePass1',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject a password shorter than 8 characters', () => {
      const data = {
        email: 'user@example.com',
        password: 'short',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject an empty first name', () => {
      const data = {
        email: 'user@example.com',
        password: 'securePass1',
        firstName: '',
        lastName: 'Doe',
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const data = { email: 'user@example.com' };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'anything',
      };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject an empty password', () => {
      const data = {
        email: 'user@example.com',
        password: '',
      };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject an invalid email', () => {
      const data = {
        email: 123,
        password: 'password',
      };
      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('ModuleSlugSchema', () => {
    it('should accept a valid slug', () => {
      const result = ModuleSlugSchema.safeParse('react-fundamentals');
      expect(result.success).toBe(true);
    });

    it('should reject slugs with uppercase letters', () => {
      const result = ModuleSlugSchema.safeParse('React-Fundamentals');
      expect(result.success).toBe(false);
    });

    it('should reject empty strings', () => {
      const result = ModuleSlugSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      const result = ModuleSlugSchema.safeParse('react/fundamentals');
      expect(result.success).toBe(false);
    });
  });

  describe('validateParams', () => {
    it('should return parsed data on success', () => {
      const result = validateParams(ModuleSlugSchema, 'valid-slug');
      expect(result).toBe('valid-slug');
    });

    it('should throw on validation failure', () => {
      expect(() => validateParams(ModuleSlugSchema, '')).toThrow(
        'Validation error'
      );
    });
  });
});
