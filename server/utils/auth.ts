import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';
import { storage } from '../storage';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'elevion-admin-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const authenticateAdmin = async (token: string): Promise<User | null> => {
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  const user = await storage.getUser(payload.userId);
  
  if (!user || user.email !== 'brandonrollins@aerolink.community' || user.role !== 'admin') {
    return null;
  }
  
  return user;
};

export const verifyAdminCredentials = async (email: string, password: string): Promise<User | null> => {
  if (email !== 'brandonrollins@aerolink.community' || password !== '*Rosie2010') {
    return null;
  }
  
  const user = await storage.getUserByEmail(email);
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return user;
};

// Middleware to check if a user is authenticated
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized access' });
};

// Middleware to check if a user is an admin
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authorization required' });
  }
  
  const token = authHeader.split(' ')[1];
  const user = await authenticateAdmin(token);
  
  if (!user) {
    return res.status(403).json({ message: 'Admin access forbidden' });
  }
  
  req.user = user;
  next();
};

// Password hashing and verification functions
export const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};

// Generate random token for email verification, password reset, etc.
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate verification link for email verification
export const generateVerificationLink = (userId: number, token: string, baseUrl: string): string => {
  return `${baseUrl}/api/auth/verify-email?uid=${userId}&token=${token}`;
};

// Generate password reset link
export const generatePasswordResetLink = (userId: number, token: string, baseUrl: string): string => {
  return `${baseUrl}/reset-password?uid=${userId}&token=${token}`;
};