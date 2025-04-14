import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../utils/validation';
import { authMiddleware } from '../utils/auth';
import { storage } from '../storage';
import { db } from '../db';
import { 
  users, 
  userDataChangeLogs,
  userOnboarding,
  insertUserDataChangeLogSchema
} from '@shared/schema';
import { z } from 'zod';
import { 
  validateUserProfileChanges, 
  analyzeUserDataChanges 
} from '../utils/xaiClient';
import { eq } from 'drizzle-orm';

const userRouter = Router();

// Middleware to validate user update input
const validateUserUpdate = [
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('firstName').optional().isString().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('businessType').optional().isString().trim().withMessage('Business type must be a string'),
  body('preferences').optional().isString().trim().withMessage('Preferences must be a string'),
  validateRequest(z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    businessType: z.string().optional(),
    preferences: z.string().optional()
  }))
];

/**
 * Get user profile details
 * GET /api/users/:id
 */
userRouter.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Only allow users to access their own profile or admins to access any profile
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own profile.' 
      });
    }

    // Get user from database
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      businessType: users.businessType,
      preferences: users.preferences,
      lastLoginAt: users.lastLoginAt,
      verified: users.verified,
      onboardingComplete: users.onboardingComplete,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(eq(users.id, parseInt(id)));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get onboarding data if available
    const [onboardingData] = await db.select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, parseInt(id)));

    res.status(200).json({ 
      success: true, 
      data: { 
        ...user, 
        onboarding: onboardingData || null 
      } 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Update user profile
 * PUT /api/users/:id
 * 
 * Uses XAI to validate changes and ensure compliance with privacy regulations
 */
userRouter.put('/:id', [authMiddleware, validateUserUpdate], async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // Only allow users to update their own profile or admins to update any profile
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own profile.' 
      });
    }

    // Get current user data
    const [currentUser] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)));

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Important: Sanitize updates to prevent modifying sensitive fields
    const allowedUpdates = [
      'email', 
      'firstName', 
      'lastName', 
      'businessType', 
      'preferences'
    ];

    const sanitizedUpdates: Record<string, any> = {};
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // Use XAI to validate the profile changes
    const validationResult = await validateUserProfileChanges(
      currentUser.id,
      {
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        businessType: currentUser.businessType,
        preferences: currentUser.preferences
      },
      sanitizedUpdates
    );

    // If changes are not valid or require manual review
    if (!validationResult.isValid || !validationResult.canProceed) {
      // Log the attempted change with high risk
      await db.insert(userDataChangeLogs).values({
        userId: currentUser.id,
        changedByUserId: req.user.userId,
        changeType: 'profile-update-rejected',
        previousData: currentUser,
        newData: sanitizedUpdates,
        changeCategory: 'Rejected Update',
        privacyImpact: 'high',
        riskLevel: validationResult.riskLevel,
        securityFlags: validationResult.recommendations,
        aiAnalysisNotes: validationResult.riskDetails,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        regulatoryNotes: 'Change rejected due to security and compliance concerns',
        requiresReview: true,
        reviewStatus: 'pending'
      });

      return res.status(400).json({
        success: false,
        message: 'Profile update rejected due to security concerns',
        details: validationResult.riskDetails,
        recommendations: validationResult.recommendations
      });
    }

    // Perform the update
    const [updatedUser] = await db
      .update(users)
      .set({
        ...sanitizedUpdates,
        updatedAt: new Date()
      })
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Use XAI to analyze the changes for compliance and audit
    const analysisResult = await analyzeUserDataChanges(
      currentUser.id,
      'profile-update',
      sanitizedUpdates,
      req.user.userId !== parseInt(id) ? req.user.userId : undefined
    );

    // Log the changes for audit
    await db.insert(userDataChangeLogs).values({
      userId: currentUser.id,
      changedByUserId: req.user.userId,
      changeType: 'profile-update',
      previousData: {
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        businessType: currentUser.businessType,
        preferences: currentUser.preferences
      },
      newData: sanitizedUpdates,
      changeCategory: analysisResult.changeCategory,
      privacyImpact: analysisResult.privacyImpact,
      riskLevel: validationResult.riskLevel,
      securityFlags: analysisResult.securityFlags,
      aiAnalysisNotes: validationResult.riskDetails,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      regulatoryNotes: analysisResult.regulatoryNotes,
      requiresReview: analysisResult.privacyImpact === 'high',
      reviewStatus: analysisResult.privacyImpact === 'high' ? 'pending' : 'approved'
    });

    // Return the updated user
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        businessType: updatedUser.businessType,
        preferences: updatedUser.preferences,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user profile change logs (for admins or for users viewing their own logs)
 * GET /api/users/:id/change-logs
 */
userRouter.get('/:id/change-logs', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Only allow users to access their own logs or admins to access any logs
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own change logs.' 
      });
    }

    const logs = await db.select()
      .from(userDataChangeLogs)
      .where(eq(userDataChangeLogs.userId, parseInt(id)))
      .orderBy({ createdAt: 'desc' });

    res.status(200).json({ 
      success: true, 
      data: logs 
    });
  } catch (error) {
    console.error('Error fetching user change logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user change logs', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Admin endpoint: Get all change logs that require review
 * GET /api/users/admin/pending-reviews
 */
userRouter.get('/admin/pending-reviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Ensure only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const pendingReviews = await db.select()
      .from(userDataChangeLogs)
      .where(eq(userDataChangeLogs.reviewStatus, 'pending'))
      .orderBy({ createdAt: 'desc' });

    res.status(200).json({ 
      success: true, 
      data: pendingReviews 
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending reviews', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Admin endpoint: Update review status for a change log
 * PUT /api/users/admin/review/:logId
 */
userRouter.put('/admin/review/:logId', authMiddleware, async (req: Request, res: Response) => {
  const { logId } = req.params;
  const { reviewStatus, reviewNotes } = req.body;
  
  try {
    // Ensure only admins can access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Validate input
    if (!reviewStatus || !['approved', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid review status. Must be "approved" or "rejected".' 
      });
    }

    // Update the review status
    const [updatedLog] = await db.update(userDataChangeLogs)
      .set({
        reviewStatus,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
        aiAnalysisNotes: reviewNotes 
          ? `${userDataChangeLogs.aiAnalysisNotes} | Admin review: ${reviewNotes}` 
          : userDataChangeLogs.aiAnalysisNotes
      })
      .where(eq(userDataChangeLogs.id, parseInt(logId)))
      .returning();

    if (!updatedLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Change log not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `Review status updated to ${reviewStatus}`, 
      data: updatedLog 
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update review status', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default userRouter;