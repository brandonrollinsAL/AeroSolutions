import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Ensure JWT secret is available
const JWT_SECRET = process.env.JWT_SECRET || 'aero-solutions-development-jwt-secret';
const JWT_EXPIRY = '24h'; // Token expiry time

// Token Types
export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Error Types
export class AuthError extends Error {
  status: number;
  
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Generate a JWT token for a user
 * @param user The user to generate a token for
 * @returns JWT token string
 */
export function generateToken(user: Pick<User, 'id' | 'username'>, role = 'user'): string {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token
 * @param token The token to verify
 * @returns Decoded token payload
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired');
    } else {
      throw new AuthError('Authentication failed');
    }
  }
}

/**
 * Extract token from request headers
 * @param req Express request
 * @returns Token string or null
 */
export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware to authenticate JWT token
 * Skip authentication for public routes
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Skip authentication for public routes
  const publicRoutes = [
    // Static routes and client-side routes
    /^(?!\/api).*/,  // All routes that don't start with /api/
    /^\/$/,         // Root route
    /^\/static/,     
    /^\/images/,
    /^\/assets/,
    /^\/@/,
    /^\/src/,
    /^\/node_modules/,
    // Public pages
    /^\/privacy-policy/,
    /^\/terms/,
    /^\/security/,
    /^\/client-preview/,
    // Auth routes
    /^\/api\/auth\/login/,
    /^\/api\/auth\/register/,
    // Public API routes
    /^\/api\/contact$/,
    /^\/api\/copilot$/,
    /^\/api\/preview\/validate$/
  ];
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(pattern => 
    pattern instanceof RegExp 
      ? pattern.test(req.path) 
      : req.path === pattern
  );
  
  if (isPublicRoute) {
    return next();
  }
  
  // Extract token
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No token provided'
    });
  }
  
  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'Internal server error'
    });
  }
}

/**
 * Middleware to check if user has required role
 * @param roles Array of roles allowed to access the route
 */
export function authorize(roles: string[] = ['admin']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'Authentication required'
      });
    }
    
    const userRole = (req.user as JwtPayload).role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
}