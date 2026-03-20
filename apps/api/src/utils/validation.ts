import { z } from 'zod';

// Schema for module slug parameter validation
export const ModuleSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/);

// Schema for lesson ID parameter validation
export const LessonIdSchema = z.union([
  z.string().min(1).max(50),
  z.number().int().positive(),
]);

// Schema for pagination (if we add it later)
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Schema for API error responses
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
});

// Schema for version parameter validation
export const VersionSchema = z.string().min(1).max(50);

// Schema for version comparison query parameters
export const VersionComparisonSchema = z.object({
  version1: z.string().min(1).max(50),
  version2: z.string().min(1).max(50),
});

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

// Validation utility function
export function validateParams<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`);
  }
  return result.data;
}
