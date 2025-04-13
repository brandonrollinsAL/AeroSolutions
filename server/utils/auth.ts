import jwt from 'jsonwebtoken';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { User } from '@shared/schema';

interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'elevion-dev-secret-key';
const TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate a JWT token for a user
 * @param user The user object
 * @returns JWT token string
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role || 'user'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * @param token The JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate a random token for email verification, password reset, etc.
 * @returns Random token string
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a hash for a password with salt
 * @param password Plain password text
 * @returns {string} Hashed password with salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(password, salt, 64).toString('hex');
  return `${hashedPassword}.${salt}`;
}

/**
 * Verify a password against a hashed version
 * @param password Plain password text
 * @param hashedPassword Stored hashed password with salt
 * @returns {boolean} Whether the password matches
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [hash, salt] = hashedPassword.split('.');
  const inputHash = scryptSync(password, salt, 64).toString('hex');
  return hash === inputHash;
}

/**
 * Middleware to verify JWT token in authorization header
 */
export function authMiddleware(req: any, res: any, next: any) {
  // Skip authentication for the public API endpoints
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/test-xai',
    '/api/test-ai-content',
    '/api/stripe/config',
    '/api/stripe/webhook'
  ];
  
  // Check if the current path is public
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Verify the token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  
  // Add user info to the request
  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role
  };
  
  next();
}

/**
 * Middleware to check if user has required roles
 */
export function adminMiddleware(allowedRoles: string[] = ['admin']) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Generate a secure verification link for email verification
 */
export function generateVerificationLink(userId: number, token: string, baseUrl: string): string {
  return `${baseUrl}/verify-email?uid=${userId}&token=${token}`;
}

/**
 * Generate a secure reset password link
 */
export function generatePasswordResetLink(userId: number, token: string, baseUrl: string): string {
  return `${baseUrl}/reset-password?uid=${userId}&token=${token}`;
}