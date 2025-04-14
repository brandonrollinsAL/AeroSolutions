import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  getAdGroups,
  getAdGroup,
  createAdGroup,
  getCreatives,
  getCreative,
  createCreative,
  generateTargetingStrategy,
  generateAdGroupSuggestions,
  generateCreativeSuggestions,
  generateCampaignOptimizationSuggestions
} from '../utils/targetedAds';
import { validateRequest } from '../utils/validation';
import { authMiddleware } from '../utils/auth';

const targetedAdsRouter = Router();

// Campaign schemas
const campaignCreateSchema = z.object({
  name: z.string().min(3),
  objective: z.string(),
  startDate: z.coerce.date(), 
  endDate: z.coerce.date().optional().nullable(),
  budget: z.string().optional(),
  dailyBudget: z.string().optional(),
  businessType: z.string().optional(),
  primaryPlatforms: z.array(z.string()).optional(),
  businessDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  status: z.string().default('draft')
});

const campaignUpdateSchema = campaignCreateSchema.partial();

// Ad Group schemas
const adGroupCreateSchema = z.object({
  name: z.string().min(3),
  campaignId: z.number(),
  status: z.string().default('draft'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  budget: z.string().optional(),
  bidAmount: z.string().optional(),
  bidStrategy: z.string().optional()
});

const adGroupUpdateSchema = adGroupCreateSchema.partial();

// Creative schemas
const creativeCreateSchema = z.object({
  name: z.string().min(3),
  groupId: z.number(),
  type: z.string(),
  headline: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  landingPageUrl: z.string().optional(),
  status: z.string().default('draft'),
  abTestGroup: z.string().optional()
});

const creativeUpdateSchema = creativeCreateSchema.partial();

// Campaign routes
targetedAdsRouter.get('/campaigns', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaigns = await getCampaigns((req as any).user.id);
    return res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

targetedAdsRouter.get('/campaigns/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const campaign = await getCampaign(campaignId, (req as any).user.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    // Get associated ad groups and creatives
    const adGroups = await getAdGroups(campaignId);
    const creatives = [];
    
    // Get creatives for each ad group
    for (const group of adGroups) {
      const groupCreatives = await getCreatives(group.id);
      creatives.push(...groupCreatives);
    }
    
    return res.json({
      success: true,
      data: { campaign, adGroups, creatives }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch campaign details' });
  }
});

targetedAdsRouter.post('/campaigns', 
  authMiddleware,
  validateRequest(campaignCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const campaignData = req.body;
      const userId = (req as any).user.id;
      
      const campaign = await createCampaign({
        ...campaignData,
        createdBy: userId
      });
      
      return res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({ success: false, error: 'Failed to create campaign' });
    }
  }
);

targetedAdsRouter.patch('/campaigns/:id',
  authMiddleware,
  validateRequest(campaignUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Check if campaign exists and belongs to user
      const existingCampaign = await getCampaign(campaignId, userId);
      if (!existingCampaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const updatedCampaign = await updateCampaign(campaignId, req.body);
      
      return res.json({ success: true, data: updatedCampaign });
    } catch (error) {
      console.error('Error updating campaign:', error);
      return res.status(500).json({ success: false, error: 'Failed to update campaign' });
    }
  }
);

// Ad Group routes
targetedAdsRouter.get('/adgroups/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(req.params.id);
    const adGroup = await getAdGroup(groupId);
    
    if (!adGroup) {
      return res.status(404).json({ success: false, error: 'Ad group not found' });
    }
    
    // Get associated creatives
    const creatives = await getCreatives(groupId);
    
    return res.json({
      success: true,
      data: { adGroup, creatives }
    });
  } catch (error) {
    console.error('Error fetching ad group:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch ad group details' });
  }
});

targetedAdsRouter.post('/adgroups', 
  authMiddleware,
  validateRequest(adGroupCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const groupData = req.body;
      const userId = (req as any).user.id;
      
      // Check if campaign exists and belongs to user
      const campaign = await getCampaign(groupData.campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const adGroup = await createAdGroup(groupData);
      
      return res.status(201).json({ success: true, data: adGroup });
    } catch (error) {
      console.error('Error creating ad group:', error);
      return res.status(500).json({ success: false, error: 'Failed to create ad group' });
    }
  }
);

// Creative routes
targetedAdsRouter.get('/creatives/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const creativeId = parseInt(req.params.id);
    const creative = await getCreative(creativeId);
    
    if (!creative) {
      return res.status(404).json({ success: false, error: 'Creative not found' });
    }
    
    return res.json({ success: true, data: creative });
  } catch (error) {
    console.error('Error fetching creative:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch creative details' });
  }
});

targetedAdsRouter.post('/creatives', 
  authMiddleware,
  validateRequest(creativeCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const creativeData = req.body;
      const userId = (req as any).user.id;
      
      // Get the ad group
      const adGroup = await getAdGroup(creativeData.groupId);
      if (!adGroup) {
        return res.status(404).json({ success: false, error: 'Ad group not found' });
      }
      
      // Check if campaign belongs to user
      const campaign = await getCampaign(adGroup.campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const creative = await createCreative(creativeData);
      
      return res.status(201).json({ success: true, data: creative });
    } catch (error) {
      console.error('Error creating creative:', error);
      return res.status(500).json({ success: false, error: 'Failed to create creative' });
    }
  }
);

// AI-assisted ad generation routes
targetedAdsRouter.post('/campaigns/:id/targeting', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Check if campaign exists and belongs to user
      const campaign = await getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const targetingStrategy = await generateTargetingStrategy(campaign);
      
      return res.json({ success: true, data: targetingStrategy });
    } catch (error) {
      console.error('Error generating targeting strategy:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate targeting strategy' });
    }
  }
);

targetedAdsRouter.post('/campaigns/:id/adgroup-suggestions', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Check if campaign exists and belongs to user
      const campaign = await getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const suggestions = await generateAdGroupSuggestions(campaign);
      
      return res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Error generating ad group suggestions:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate ad group suggestions' });
    }
  }
);

targetedAdsRouter.post('/adgroups/:id/creative-suggestions', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Get the ad group
      const adGroup = await getAdGroup(groupId);
      if (!adGroup) {
        return res.status(404).json({ success: false, error: 'Ad group not found' });
      }
      
      // Check if campaign belongs to user
      const campaign = await getCampaign(adGroup.campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const suggestions = await generateCreativeSuggestions(adGroup, campaign);
      
      return res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Error generating creative suggestions:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate creative suggestions' });
    }
  }
);

targetedAdsRouter.post('/campaigns/:id/optimization', 
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Check if campaign exists and belongs to user
      const campaign = await getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      
      const suggestions = await generateCampaignOptimizationSuggestions(campaign);
      
      return res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Error generating campaign optimization suggestions:', error);
      return res.status(500).json({ success: false, error: 'Failed to generate campaign optimization suggestions' });
    }
  }
);

export default targetedAdsRouter;