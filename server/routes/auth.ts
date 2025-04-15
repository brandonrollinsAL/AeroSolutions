import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { storage } from '../storage';
import { 
  generateToken, 
  hashPassword, 
  verifyPassword, 
  authMiddleware, 
  generateRandomToken,
  generateVerificationLink,
  generatePasswordResetLink
} from '../utils/auth';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { callXAI } from '../utils/xaiClient';
import { validateRequest } from '../utils/validation';

const router = Router();

// User registration endpoint
router.post('/register', [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('Name must be less than 100 characters')
    .trim(),
], validateRequest("Invalid registration data"), async (req: Request, res: Response) => {
  try {

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    const existingEmail = await storage.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = hashPassword(req.body.password);

    // Create verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Process user data using Zod schema
    const userData = insertUserSchema.parse({
      ...req.body,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
      verificationToken,
      verificationExpires,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create user
    const user = await storage.createUser(userData);

    // Generate JWT token
    const token = generateToken(user);

    // Send welcome email with verification link in a production environment
    // For now, just log the verification link
    const verificationLink = generateVerificationLink(
      user.id, 
      verificationToken, 
      `${req.protocol}://${req.get('host')}`
    );
    console.log(`Verification link for user ${user.username}: ${verificationLink}`);

    // Create user onboarding entry
    try {
      const { businessType, businessGoals } = req.body;
      
      if (businessType) {
        // Use xAI to generate personalized onboarding tips
        const aiPrompt = `Generate 3 personalized onboarding tips for a new user who runs a ${businessType} business` + 
          (businessGoals ? ` with the following goals: ${businessGoals}` : '') + 
          '. Format as bullet points and keep each tip under 120 characters.';
        
        let onboardingTips = '';
        try {
          const response = await callXAI('/chat/completions', {
            model: 'grok-3-mini',
            messages: [{ role: 'user', content: aiPrompt }]
          });
          
          onboardingTips = response.choices[0].message.content;
        } catch (aiError) {
          console.error('Error generating AI onboarding tips:', aiError);
          onboardingTips = '• Welcome to Elevion! Set up your profile\n• Explore our marketplace for inspiration\n• Try our AI tools to enhance your web presence';
        }
        
        await storage.createUserOnboarding({
          userId: user.id,
          businessType,
          businessGoals: businessGoals || '',
          onboardingTips,
          currentStep: 1,
          totalSteps: 5,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (onboardingError) {
      console.error('Error creating user onboarding:', onboardingError);
      // Continue processing, this is not fatal
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// User login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest("Invalid login data"), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Import the login logger here to avoid circular dependencies
    const { logLoginAttempt, isIPLockedOut } = await import('../utils/loginLogger');
    
    // Check if the IP is locked out due to too many failed attempts
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (isIPLockedOut(ip)) {
      logLoginAttempt(req, username, false, 'IP temporarily locked out');
      
      return res.status(429).json({
        success: false,
        message: "Too many failed login attempts. Please try again later."
      });
    }

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      // Log failed login attempt - user not found
      logLoginAttempt(req, username, false, 'User not found');
      
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Verify password
    const isValidPassword = verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt - invalid password
      logLoginAttempt(req, username, false, 'Invalid password');
      
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Check if user is verified (if verification is required)
    if (user.isVerified === false) {
      // Log failed login attempt - account not verified
      logLoginAttempt(req, username, false, 'Account not verified');
      
      return res.status(401).json({
        success: false,
        message: "Account not verified. Please check your email for verification instructions."
      });
    }

    // Generate JWT token with only necessary user information
    const token = generateToken(user);

    // Update last login time
    await storage.updateUser(user.id, { 
      lastLoginAt: new Date(),
      lastLoginIP: req.ip || req.socket.remoteAddress || 'unknown'
    });

    // Log successful login
    logLoginAttempt(req, username, true);

    // Return success response with filtered user data
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log error during login
    try {
      const { logLoginAttempt } = await import('../utils/loginLogger');
      logLoginAttempt(
        req, 
        req.body?.username || 'unknown', 
        false, 
        `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } catch (logError) {
      console.error('Error logging login attempt:', logError);
    }
    
    return res.status(500).json({
      success: false,
      message: "Login failed due to a system error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { uid, token } = req.query;
    
    if (!uid || !token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link"
      });
    }
    
    const userId = parseInt(uid as string, 10);
    
    // Find user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }
    
    // Check token validity
    if (user.verificationToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token"
      });
    }
    
    // Check token expiration
    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification token expired"
      });
    }
    
    // Update user
    await storage.updateUser(userId, {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      updatedAt: new Date()
    });
    
    // For API requests return JSON
    if (req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: "Email verified successfully"
      });
    }
    
    // For browser requests, redirect to frontend verification success page
    res.redirect('/auth/verification-success');
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// User profile endpoint
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Get user profile
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Return user profile without sensitive data
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// User onboarding status endpoint
router.get('/onboarding', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Get user onboarding
    const onboarding = await storage.getUserOnboarding(userId);
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: onboarding
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve onboarding",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update user onboarding
router.post('/onboarding/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { currentStep, completedAt } = req.body;
    
    // Get user onboarding
    const onboarding = await storage.getUserOnboarding(userId);
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding not found"
      });
    }
    
    // Update onboarding
    const updates: any = {
      updatedAt: new Date()
    };
    
    if (currentStep !== undefined) {
      updates.currentStep = currentStep;
    }
    
    if (completedAt !== undefined) {
      updates.completedAt = completedAt ? new Date() : null;
    }
    
    const updatedOnboarding = await storage.updateUserOnboarding(userId, updates);
    
    return res.status(200).json({
      success: true,
      message: "Onboarding updated",
      data: updatedOnboarding
    });
  } catch (error) {
    console.error('Onboarding update error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to update onboarding",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
], validateRequest("Invalid email"), async (req: Request, res: Response) => {
  try {
    
    const { email } = req.body;
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // Always return success to prevent user enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a password reset link has been sent"
      });
    }
    
    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    
    // Update user with reset token
    await storage.updateUser(user.id, {
      resetToken,
      resetExpires,
      updatedAt: new Date()
    });
    
    // Generate reset link
    const resetLink = generatePasswordResetLink(
      user.id, 
      resetToken, 
      `${req.protocol}://${req.get('host')}`
    );
    
    // In a production environment, send email here
    console.log(`Password reset link for user ${user.username}: ${resetLink}`);
    
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent"
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Reset password endpoint
router.post('/reset-password', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
], validateRequest("Invalid reset data"), async (req: Request, res: Response) => {
  try {
    
    const { userId, token, password } = req.body;
    
    // Find user
    const user = await storage.getUser(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check token validity
    if (!user.resetToken || user.resetToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token"
      });
    }
    
    // Check token expiration
    if (!user.resetExpires || new Date() > user.resetExpires) {
      return res.status(400).json({
        success: false,
        message: "Reset token expired"
      });
    }
    
    // Hash new password
    const hashedPassword = hashPassword(password);
    
    // Update user
    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
      updatedAt: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Change password endpoint (for authenticated users)
router.post('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('New password must contain at least one special character')
], validateRequest("Invalid password data"), async (req: Request, res: Response) => {
  try {
    
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Verify current password
    const isValidPassword = verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Hash new password
    const hashedPassword = hashPassword(newPassword);
    
    // Update user
    await storage.updateUser(user.id, {
      password: hashedPassword,
      updatedAt: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Logout endpoint (just for form, actual token invalidation should be handled client-side)
router.post('/logout', (req: Request, res: Response) => {
  // In a JWT-based auth system, the client should simply remove the token
  return res.status(200).json({
    success: true,
    message: "Logout successful"
  });
});

// Admin-only: Get all users endpoint
router.get('/admin/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    
    // Get all users
    const users = await storage.getAllUsers();
    
    // Return users without sensitive data
    return res.status(200).json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }))
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;