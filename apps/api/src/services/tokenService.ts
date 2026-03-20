import jwt from 'jsonwebtoken';

// Define the payload structure for JWT tokens
interface JwtPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Define the User type compatible with both legacy Sequelize and new objects
interface UserType {
  id: string | number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  [key: string]: any;
}

/**
 * Generate a JWT token for a user
 * @param user The user object
 * @returns JWT token string
 */
export function generateToken(user: UserType): string {
  const payload: JwtPayload = {
    userId: String(user.id),
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. Refusing to sign tokens with a default key.'
    );
  }

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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (_error) {
    // Token is invalid or expired
    return null;
  }
}
