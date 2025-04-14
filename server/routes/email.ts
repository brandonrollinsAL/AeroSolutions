import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { emailService } from '../utils/emailService';
import { validateRequest } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Send a test email 
 * POST /api/email/test
 * Body: { to: string, subject: string, message: string }
 */
router.post(
  '/test',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // Only allow authenticated admin users to send test emails
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Admin access required' 
      });
    }

    try {
      const { to, subject, message } = req.body;

      const response = await emailService.sendEmail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #3B5B9D; text-align: center;">${subject}</h1>
            <div style="font-size: 16px; line-height: 1.5; color: #555;">
              ${message}
            </div>
            <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
              © ${new Date().getFullYear()} Elevion. All rights reserved.
            </p>
          </div>
        `
      });

      logger.info(`Test email sent to ${to}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully',
        data: { messageId: response.id }
      });
    } catch (error: any) {
      logger.error('Failed to send test email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: error.message 
      });
    }
  }
);

/**
 * Send welcome email to a new user
 * POST /api/email/welcome
 * Body: { to: string, username: string }
 */
router.post(
  '/welcome',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // Only allow authenticated admins or the system to send welcome emails
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'system')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Admin access required' 
      });
    }

    try {
      const { to, username } = req.body;
      
      const response = await emailService.sendWelcomeEmail(to, username);
      
      logger.info(`Welcome email sent to ${to}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Welcome email sent successfully',
        data: { messageId: response.id }
      });
    } catch (error: any) {
      logger.error('Failed to send welcome email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome email',
        error: error.message 
      });
    }
  }
);

/**
 * Send verification email
 * POST /api/email/verification
 * Body: { to: string, username: string, verificationToken: string }
 */
router.post(
  '/verification',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
    body('verificationToken').trim().isLength({ min: 1 }).withMessage('Verification token is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // System route for auth system - can be called during registration without auth
    // but will have rate limiting and IP tracking in production
    try {
      const { to, username, verificationToken } = req.body;
      
      const response = await emailService.sendVerificationEmail(to, username, verificationToken);
      
      logger.info(`Verification email sent to ${to}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Verification email sent successfully',
        data: { messageId: response.id }
      });
    } catch (error: any) {
      logger.error('Failed to send verification email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email',
        error: error.message 
      });
    }
  }
);

/**
 * Send password reset email
 * POST /api/email/password-reset
 * Body: { to: string, username: string, resetToken: string }
 */
router.post(
  '/password-reset',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
    body('resetToken').trim().isLength({ min: 1 }).withMessage('Reset token is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // System route for password reset - can be called without auth
    // but will have rate limiting and IP tracking in production
    try {
      const { to, username, resetToken } = req.body;
      
      const response = await emailService.sendPasswordResetEmail(to, username, resetToken);
      
      logger.info(`Password reset email sent to ${to}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Password reset email sent successfully',
        data: { messageId: response.id }
      });
    } catch (error: any) {
      logger.error('Failed to send password reset email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send password reset email',
        error: error.message 
      });
    }
  }
);

/**
 * Send marketplace notification email
 * POST /api/email/marketplace-notification
 * Body: { to: string, username: string, itemName: string, action: string, itemId: string }
 */
router.post(
  '/marketplace-notification',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
    body('itemName').trim().isLength({ min: 1 }).withMessage('Item name is required'),
    body('action').isIn(['published', 'purchased', 'updated', 'sold']).withMessage('Invalid action'),
    body('itemId').trim().isLength({ min: 1 }).withMessage('Item ID is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // Only allow authenticated requests
    if (!req.isAuthenticated()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    try {
      const { to, username, itemName, action, itemId } = req.body;
      
      const response = await emailService.sendMarketplaceNotification(
        to, 
        username, 
        itemName, 
        action as 'published' | 'purchased' | 'updated' | 'sold',
        itemId
      );
      
      logger.info(`Marketplace notification email (${action}) sent to ${to} for item ${itemId}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Marketplace notification email sent successfully',
        data: { messageId: response.id, action }
      });
    } catch (error: any) {
      logger.error(`Failed to send marketplace notification email:`, error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send marketplace notification email',
        error: error.message 
      });
    }
  }
);

/**
 * Send weekly newsletter email
 * POST /api/email/newsletter
 * Body: { to: string, username: string, recommendations: Array<{title, description, link, imageUrl?}> }
 */
router.post(
  '/newsletter',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
    body('recommendations').isArray({ min: 1 }).withMessage('At least one recommendation is required'),
    body('recommendations.*.title').trim().isLength({ min: 1 }).withMessage('Recommendation title is required'),
    body('recommendations.*.description').trim().isLength({ min: 1 }).withMessage('Recommendation description is required'),
    body('recommendations.*.link').trim().isLength({ min: 1 }).withMessage('Recommendation link is required'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    // Only allow authenticated admin or system requests
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'system')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Admin or system access required' 
      });
    }

    try {
      const { to, username, recommendations } = req.body;
      
      const response = await emailService.sendWeeklyNewsletter(to, username, recommendations);
      
      logger.info(`Weekly newsletter email sent to ${to}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Weekly newsletter email sent successfully',
        data: { messageId: response.id }
      });
    } catch (error: any) {
      logger.error('Failed to send weekly newsletter email:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send weekly newsletter email',
        error: error.message 
      });
    }
  }
);

export default router;