import express, { Request, Response } from 'express';
import { z } from 'zod';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../utils/auth';
import { db } from '../db';
import { grokApi } from '../grok';

// Create a router instance
const router = express.Router();

// Sample data for platforms and posts until database implementation is complete
const samplePlatforms = [
  {
    id: 1,
    name: 'twitter',
    displayName: 'Twitter',
    description: 'Connect and share quick updates with your audience on Twitter.',
    isActive: true,
    icon: null,
    apiConfig: {
      baseUrl: 'https://api.twitter.com/2',
      characterLimit: 280,
      bufferProfileId: 'buf123twitter'
    }
  },
  {
    id: 2,
    name: 'instagram',
    displayName: 'Instagram',
    description: 'Share visual content and stories with your Instagram followers.',
    isActive: true,
    icon: null,
    apiConfig: {
      baseUrl: 'https://graph.instagram.com/v13.0',
      bufferProfileId: 'buf123insta'
    }
  },
  {
    id: 3,
    name: 'linkedin',
    displayName: 'LinkedIn',
    description: 'Share professional updates and content with your LinkedIn network.',
    isActive: true,
    icon: null,
    apiConfig: {
      baseUrl: 'https://api.linkedin.com/v2',
      characterLimit: 3000,
      bufferProfileId: 'buf123linkedin'
    }
  },
  {
    id: 4,
    name: 'facebook',
    displayName: 'Facebook',
    description: 'Connect with your community on Facebook through various content types.',
    isActive: false,
    icon: null,
    apiConfig: {
      baseUrl: 'https://graph.facebook.com/v13.0'
    }
  }
];

const samplePosts = [
  {
    id: 1,
    platformId: 1,
    content: "Just launched our new website redesign service! Check out how we can transform your online presence with modern, responsive designs. #WebDesign #SmallBusiness",
    status: "posted",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    postedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    hashTags: ["WebDesign", "SmallBusiness"],
    mediaUrls: [],
    metrics: {
      likes: 45,
      comments: 12,
      shares: 8,
      impressions: 1240,
      engagement: 0.052
    },
    platform: samplePlatforms[0]
  },
  {
    id: 2,
    platformId: 2,
    content: "Our design team created this stunning mockup for a local coffee shop. Swipe to see how the final website turned out! #WebDesign #LocalBusiness #BeforeAndAfter",
    status: "posted",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    postedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    hashTags: ["WebDesign", "LocalBusiness", "BeforeAndAfter"],
    mediaUrls: ["https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d", "https://images.unsplash.com/photo-1546074177-31bfa593f731"],
    metrics: {
      likes: 127,
      comments: 23,
      shares: 5,
      impressions: 2540,
      engagement: 0.061
    },
    platform: samplePlatforms[1]
  },
  {
    id: 3,
    platformId: 3,
    content: "Is your business website ready for 2023? Here are 5 trends that can help you stay ahead of the competition:\n\n1. AI-enhanced user experiences\n2. Voice search optimization\n3. Mobile-first design\n4. Immersive scroll experiences\n5. Dark mode options\n\nReady to upgrade? Contact us for a free consultation! #WebsiteTrends #BusinessGrowth",
    status: "posted",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    postedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    hashTags: ["WebsiteTrends", "BusinessGrowth"],
    mediaUrls: [],
    metrics: {
      likes: 89,
      comments: 15,
      shares: 32,
      impressions: 3120,
      engagement: 0.044
    },
    platform: samplePlatforms[2]
  },
  {
    id: 4,
    platformId: 1,
    content: "Join our upcoming webinar: 'Boosting Your Business with Effective Landing Pages' - Learn how to create high-converting pages that drive real results. Register now at elevion.dev/webinar",
    status: "scheduled",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    scheduledTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    hashTags: ["Webinar", "LandingPages", "ConversionOptimization"],
    mediaUrls: [],
    platform: samplePlatforms[0]
  },
  {
    id: 5,
    platformId: 4,
    content: "Draft post for our upcoming product launch. Need to add product images and final pricing details before scheduling.",
    status: "draft",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    hashTags: ["ProductLaunch", "ComingSoon"],
    mediaUrls: [],
    platform: samplePlatforms[3]
  }
];

// Validation schema for creating a new post
const createPostSchema = z.object({
  platformId: z.number().int().positive(),
  content: z.string().min(1).max(3000),
  hashTags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledTime: z.string().datetime().optional()
});

// Get all platforms
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual database query
    // const platforms = await db.query('SELECT * FROM social_platforms');
    const platforms = samplePlatforms;
    
    res.status(200).json(platforms);
  } catch (error) {
    console.error('Error fetching social platforms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch social platforms',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get platform by ID
router.get('/platforms/:id', [
  param('id').isInt().toInt(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    
    // TODO: Replace with actual database query
    // const platform = await db.query('SELECT * FROM social_platforms WHERE id = ?', [id]);
    const platform = samplePlatforms.find(p => p.id === parseInt(id));
    
    if (!platform) {
      return res.status(404).json({ 
        success: false, 
        message: 'Platform not found' 
      });
    }
    
    res.status(200).json(platform);
  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch platform',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all posts with pagination and filtering
router.get('/posts', [
  query('platform').optional().isString(),
  query('status').optional().isString(),
  query('page').optional().isInt().toInt().default(1),
  query('pageSize').optional().isInt().toInt().default(10),
  query('sortBy').optional().isString().default('createdAt'),
  query('sortOrder').optional().isIn(['asc', 'desc']).default('desc'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { 
      platform = 'all', 
      status = 'all', 
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // TODO: Replace with actual database query with filters and pagination
    // const posts = await db.query(...);
    
    // Filter posts based on query parameters
    let filteredPosts = [...samplePosts];
    
    if (platform !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.platformId === parseInt(platform as string));
    }
    
    if (status !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }
    
    // Sort posts
    filteredPosts.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      // Default comparison for other types
      return sortOrder === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1);
    });
    
    // Calculate pagination
    const totalItems = filteredPosts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    res.status(200).json({
      posts: paginatedPosts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get post by ID
router.get('/posts/:id', [
  param('id').isInt().toInt(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    
    // TODO: Replace with actual database query
    // const post = await db.query('SELECT * FROM social_posts WHERE id = ?', [id]);
    const post = samplePosts.find(p => p.id === parseInt(id));
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new post
router.post('/posts', [
  authMiddleware,
  body('platformId').isInt().withMessage('Platform ID is required and must be an integer'),
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('hashTags').optional().isArray().withMessage('HashTags must be an array of strings'),
  body('mediaUrls').optional().isArray().withMessage('MediaUrls must be an array of URLs'),
  body('scheduledTime').optional().isISO8601().toDate().withMessage('ScheduledTime must be a valid datetime'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const postData = req.body;
    
    // Validate using zod schema
    try {
      createPostSchema.parse(postData);
    } catch (zodError: any) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid post data',
        errors: zodError.errors
      });
    }
    
    // Check if platform exists
    const platform = samplePlatforms.find(p => p.id === postData.platformId);
    if (!platform) {
      return res.status(404).json({ 
        success: false, 
        message: 'Platform not found' 
      });
    }
    
    // Determine status based on scheduledTime
    let status = 'draft';
    if (postData.scheduledTime) {
      status = 'scheduled';
    }
    
    // TODO: Replace with actual database insertion
    // const result = await db.query('INSERT INTO social_posts ...', [...]);
    const newPost = {
      id: samplePosts.length + 1,
      ...postData,
      status,
      createdAt: new Date().toISOString(),
      platform
    };
    
    // samplePosts.push(newPost); // In production, this would be a DB insert
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a post
router.patch('/posts/:id', [
  authMiddleware,
  param('id').isInt().toInt(),
  body('content').optional().isString().notEmpty(),
  body('hashTags').optional().isArray(),
  body('mediaUrls').optional().isArray(),
  body('scheduledTime').optional().isISO8601().toDate(),
  body('status').optional().isIn(['draft', 'scheduled', 'posted', 'cancelled']),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    // TODO: Replace with actual database query
    // const post = await db.query('SELECT * FROM social_posts WHERE id = ?', [id]);
    const postIndex = samplePosts.findIndex(p => p.id === parseInt(id));
    
    if (postIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    // In a real app, we would prevent updating posts that are already posted
    // const post = samplePosts[postIndex];
    // if (post.status === 'posted') {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Cannot update a post that has already been posted' 
    //   });
    // }
    
    // TODO: Replace with actual database update
    // const result = await db.query('UPDATE social_posts SET ... WHERE id = ?', [..., id]);
    const updatedPost = {
      ...samplePosts[postIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // samplePosts[postIndex] = updatedPost; // In production, this would be a DB update
    
    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a post
router.delete('/posts/:id', [
  authMiddleware,
  param('id').isInt().toInt(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    
    // TODO: Replace with actual database query
    // const post = await db.query('SELECT * FROM social_posts WHERE id = ?', [id]);
    const postIndex = samplePosts.findIndex(p => p.id === parseInt(id));
    
    if (postIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    // In a real app, we might want to add a check to prevent deleting posts that are already posted
    // or add a soft delete mechanism
    
    // TODO: Replace with actual database delete
    // const result = await db.query('DELETE FROM social_posts WHERE id = ?', [id]);
    
    // samplePosts.splice(postIndex, 1); // In production, this would be a DB delete
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate AI content for social post
router.post('/generate-content', [
  authMiddleware,
  body('platformId').isInt().withMessage('Platform ID is required'),
  body('prompt').isString().notEmpty().withMessage('Prompt is required'),
  body('contentType').optional().isString().isIn(['post', 'caption', 'hashtags']).withMessage('Invalid content type'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { platformId, prompt, contentType = 'post' } = req.body;
    
    // Get platform information
    const platform = samplePlatforms.find(p => p.id === parseInt(platformId as string));
    if (!platform) {
      return res.status(404).json({ 
        success: false, 
        message: 'Platform not found' 
      });
    }
    
    // Construct AI prompt based on platform and content type
    let aiPrompt = '';
    let characterLimit = platform.apiConfig?.characterLimit;
    
    switch (contentType) {
      case 'post':
        aiPrompt = `Generate a compelling social media post for ${platform.displayName}${characterLimit ? ` (maximum ${characterLimit} characters)` : ''} about ${prompt}. Make it engaging, relevant to the platform, and optimized for engagement.`;
        break;
      case 'caption':
        aiPrompt = `Write an engaging caption for an image on ${platform.displayName}${characterLimit ? ` (maximum ${characterLimit} characters)` : ''} about ${prompt}.`;
        break;
      case 'hashtags':
        aiPrompt = `Suggest 5-10 relevant and trending hashtags for a ${platform.displayName} post about ${prompt}. Format as JSON array.`;
        break;
      default:
        aiPrompt = `Generate social media content for ${platform.displayName} about ${prompt}.`;
    }
    
    // Generate content with Grok
    try {
      let content;
      
      if (contentType === 'hashtags') {
        const response = await grokApi.generateJson({
          prompt: aiPrompt,
          systemPrompt: "You are a social media expert specializing in hashtag optimization."
        });
        content = response;
      } else {
        const response = await grokApi.generateText({
          prompt: aiPrompt,
          systemPrompt: "You are a social media expert specializing in creating engaging, platform-optimized content."
        });
        content = response;
      }
      
      res.status(200).json({
        success: true,
        content,
        platform: {
          id: platform.id,
          name: platform.name,
          displayName: platform.displayName,
          characterLimit
        }
      });
    } catch (error) {
      console.error('Error generating AI content:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate content',
        error: error instanceof Error ? error.message : 'AI generation failed'
      });
    }
  } catch (error) {
    console.error('Error in generate-content endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export router
export default router;