import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'elevion-secret-key';

// Generate JWT token
export const generateToken = (payload: any, expiresIn = '24h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
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
      const decoded = jwt.verify(token, JWT_SECRET);
      
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
  requireAuth
};