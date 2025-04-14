import express, { Request, Response } from 'express';
import { adminMiddleware, verifyAdminCredentials, generateToken } from '../utils/auth';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await verifyAdminCredentials(email, password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current admin user
router.get('/me', adminMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
    });
  } catch (error) {
    console.error('Get admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get API config status
router.get('/api-config', adminMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if API keys are configured
    const openai_api_key = !!process.env.OPENAI_API_KEY;
    const xai_api_key = !!process.env.XAI_API_KEY;
    const stripe_secret_key = !!process.env.STRIPE_SECRET_KEY;
    const stripe_publishable_key = !!process.env.STRIPE_PUBLISHABLE_KEY;
    
    return res.status(200).json({
      openai_api_key,
      xai_api_key,
      stripe_secret_key,
      stripe_publishable_key,
    });
  } catch (error) {
    console.error('API config error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users
router.get('/users', adminMiddleware, async (req: Request, res: Response) => {
  try {
    // Mock data for now
    const users = [
      { id: 1, email: 'user@example.com', firstName: 'John', lastName: 'Doe', role: 'user', createdAt: new Date() },
      { id: 2, email: 'admin@elevion.dev', firstName: 'Admin', lastName: 'User', role: 'admin', createdAt: new Date() },
    ];
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific user
router.get('/users/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a user
router.patch('/users/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For now, only allow updating role
    const { role } = req.body;
    
    if (role && role !== user.role) {
      // Update logic would go here
      return res.status(200).json({ message: 'User updated successfully' });
    }
    
    return res.status(200).json({ message: 'No changes made' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a user
router.delete('/users/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting the admin user
    if (user.role === 'admin' && user.email === 'brandonrollins@aerolink.community') {
      return res.status(403).json({ message: 'Cannot delete main admin user' });
    }
    
    // Delete logic would go here
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get analytics data
router.get('/analytics', adminMiddleware, async (req: Request, res: Response) => {
  try {
    // Mock data for analytics dashboard
    const analyticsData = {
      userMetrics: {
        totalUsers: 25,
        activeSubscriptions: 8,
      },
      contentMetrics: [
        { id: 1, title: 'Homepage content', views: 1254, engagement: 0.75 },
        { id: 2, title: 'Services page', views: 876, engagement: 0.68 },
        { id: 3, title: 'Blog posts', views: 450, engagement: 0.82 },
      ],
      recentOrders: [
        { id: 101, userId: 5, itemName: 'Premium Website Package', totalPrice: 499.99, status: 'completed', createdAt: new Date() },
        { id: 102, userId: 8, itemName: 'Logo Design', totalPrice: 149.99, status: 'processing', createdAt: new Date() },
        { id: 103, userId: 12, itemName: 'SEO Optimization', totalPrice: 299.99, status: 'cancelled', createdAt: new Date() },
      ],
      aiUsageMetrics: {
        totalRequests: 1876,
        dailyRequests: 95,
        avgResponseTime: 1.2,
        monthlyCost: 128.76,
        topFeatures: [
          { name: 'Content Generation', usage: 452 },
          { name: 'Mockup Creation', usage: 387 },
          { name: 'SEO Analysis', usage: 328 },
          { name: 'Competitive Analysis', usage: 241 },
        ],
      },
    };
    
    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get flagged content for moderation
router.get('/content/flagged', adminMiddleware, async (req: Request, res: Response) => {
  try {
    // Mock data for flagged content
    const flaggedContent = [
      { id: 1, contentType: 'comment', content: 'This is flagged comment content', flaggedBy: 'user@example.com', flaggedAt: new Date(), reason: 'inappropriate' },
      { id: 2, contentType: 'review', content: 'This is flagged review content', flaggedBy: 'another@example.com', flaggedAt: new Date(), reason: 'spam' },
    ];
    
    return res.status(200).json(flaggedContent);
  } catch (error) {
    console.error('Flagged content error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Review flagged content
router.post('/content/:id/review', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const contentId = parseInt(req.params.id);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: 'Invalid content ID' });
    }
    
    const { action } = req.body;
    
    if (!action || !['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    // Review logic would go here
    
    return res.status(200).json({ message: `Content ${action}d successfully` });
  } catch (error) {
    console.error('Review content error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;