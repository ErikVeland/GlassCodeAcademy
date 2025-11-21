import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Define the payload structure for JWT tokens
interface JwtPayload {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Generate a JWT token for a user
 * @param user The user object
 * @returns JWT token string
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // Use the JWT_SECRET from environment variables or a default value
  const secret = process.env.JWT_SECRET || 'default_secret_key';

  // Set token expiration (24 hours)
  const options: jwt.SignOptions = {
    expiresIn: '24h',
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify a JWT token
 * @param token The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'default_secret_key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}
