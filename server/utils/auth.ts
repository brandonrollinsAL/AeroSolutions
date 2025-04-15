import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'elevion-secret-key';

// Generate JWT token with only necessary user information
export const generateToken = (user: any, expiresIn = '24h'): string => {
  // Extract only the necessary fields to avoid storing sensitive information in the token
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email
  };
  
  // Convert expiresIn to a SignOptions object
  const options = { expiresIn };
  
  try {
    // Using proper JWT signing with explicit typing
    return jwt.sign(tokenPayload, String(JWT_SECRET), options);
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, String(JWT_SECRET));
  } catch (error) {
    return null;
  }
};

// Generate a random token for verification or password reset
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash password using bcrypt
export const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Verify password using bcrypt
export const verifyPassword = (plainPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

// Generate email verification link
export const generateVerificationLink = (userId: number, token: string, baseUrl: string): string => {
  return `${baseUrl}/api/auth/verify-email?uid=${userId}&token=${token}`;
};

// Generate password reset link
export const generatePasswordResetLink = (userId: number, token: string, baseUrl: string): string => {
  return `${baseUrl}/reset-password?uid=${userId}&token=${token}`;
};

// Check if a user is an admin
export const isAdmin = (req: Request): boolean => {
  return !!(req.user && req.user.role === 'admin');
};

// Authentication middleware using JWT
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret);
      
      // Add the decoded user to the request
      (req as any).user = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Admin middleware to check if user has admin role
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin privileges required' 
    });
  }
  
  next();
};

/**
 * Middleware to require authentication
 * 
 * @param req The Express request object
 * @param res The Express response object
 * @param next The Express next function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
  next();
};

export default {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
  requireAuth,
  hashPassword,
  verifyPassword,
  generateRandomToken,
  generateVerificationLink,
  generatePasswordResetLink,
  isAdmin
};