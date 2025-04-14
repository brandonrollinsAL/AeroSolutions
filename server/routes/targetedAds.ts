import { Router } from 'express';
import { db } from '../db';
import { adCampaigns, adGroups, adCreatives, adTargetingProfiles, adPlatforms } from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';
import targetedAds from '../utils/targetedAds';
import { requireAuth } from '../utils/auth';

const router = Router();

// Get all campaigns
router.get('/', requireAuth, async (req, res) => {
  try {
    const campaigns = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign with all related data
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Get ad groups for this campaign
    const groups = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.campaignId, campaignId));
    
    // Get creatives for each group
    const groupIds = groups.map(group => group.id);
    let creatives = [];
    
    if (groupIds.length > 0) {
      creatives = await db
        .select()
        .from(adCreatives)
        .where(sql`${adCreatives.groupId} IN (${groupIds.join(',')})`);
    }
    
    // Organize creatives by group
    const groupsWithCreatives = groups.map(group => ({
      ...group,
      creatives: creatives.filter(creative => creative.groupId === group.id)
    }));
    
    res.json({
      campaign,
      groups: groupsWithCreatives
    });
  } catch (error) {
    console.error(`Error fetching campaign ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

// Create new campaign with AI-generated content
const createCampaignSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  objective: z.string().min(3).max(50),
  businessType: z.string().min(2).max(50),
  budget: z.number().min(1),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

router.post('/', requireAuth, validateRequest(createCampaignSchema), async (req, res) => {
  try {
    const { name, description, objective, businessType, budget, startDate, endDate } = req.body;
    const userId = req.user.id;
    
    const campaign = await targetedAds.createCampaignWithAI(
      name,
      description || '',
      objective,
      businessType,
      budget,
      startDate,
      userId
    );
    
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Generate ad content for an existing campaign
router.post('/:id/generate-content', requireAuth, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const adContent = await targetedAds.generateAdContent(campaignId, userId);
    
    res.json(adContent);
  } catch (error) {
    console.error(`Error generating content for campaign ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to generate ad content' });
  }
});

// Analyze ad performance and get recommendations
router.get('/creatives/:id/analyze', requireAuth, async (req, res) => {
  try {
    const creativeId = parseInt(req.params.id);
    
    if (isNaN(creativeId)) {
      return res.status(400).json({ error: 'Invalid creative ID' });
    }
    
    const analysis = await targetedAds.analyzeAdPerformance(creativeId);
    
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing creative ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to analyze ad performance' });
  }
});

// Get campaign insights (metrics visualization)
router.get('/:id/insights', requireAuth, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const insights = await targetedAds.generateCampaignInsights(campaignId);
    
    res.json(insights);
  } catch (error) {
    console.error(`Error generating insights for campaign ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to generate campaign insights' });
  }
});

// Generate target audience for a business type
router.post('/audience', requireAuth, async (req, res) => {
  try {
    const { businessType, behaviors } = req.body;
    
    if (!businessType) {
      return res.status(400).json({ error: 'Business type is required' });
    }
    
    const audience = await targetedAds.generateTargetAudience(
      businessType,
      behaviors || []
    );
    
    res.json(audience);
  } catch (error) {
    console.error('Error generating target audience:', error);
    res.status(500).json({ error: 'Failed to generate target audience' });
  }
});

// Update campaign status
const updateCampaignStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'])
});

router.patch('/:id/status', requireAuth, validateRequest(updateCampaignStatusSchema), async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    const [campaign] = await db
      .update(adCampaigns)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(adCampaigns.id, campaignId))
      .returning();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error(`Error updating campaign ${req.params.id} status:`, error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// Get all targeting profiles
router.get('/targeting-profiles', requireAuth, async (req, res) => {
  try {
    const profiles = await db.select().from(adTargetingProfiles);
    
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching targeting profiles:', error);
    res.status(500).json({ error: 'Failed to fetch targeting profiles' });
  }
});

// Create new targeting profile
const createTargetingProfileSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  criteria: z.record(z.any()).optional()
});

router.post('/targeting-profiles', requireAuth, validateRequest(createTargetingProfileSchema), async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    const userId = req.user.id;
    
    const [profile] = await db
      .insert(adTargetingProfiles)
      .values({
        name,
        description,
        criteria: criteria || {},
        createdBy: userId
      })
      .returning();
    
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating targeting profile:', error);
    res.status(500).json({ error: 'Failed to create targeting profile' });
  }
});

// Prepare campaign for external platform
router.get('/:id/prepare/:platform', requireAuth, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const platformName = req.params.platform;
    
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    // Verify the platform exists
    const [platform] = await db
      .select()
      .from(adPlatforms)
      .where(eq(adPlatforms.name, platformName));
    
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    const data = await targetedAds.prepareCampaignForExternalPlatform(
      campaignId,
      platformName
    );
    
    res.json(data);
  } catch (error) {
    console.error(`Error preparing campaign ${req.params.id} for ${req.params.platform}:`, error);
    res.status(500).json({ error: 'Failed to prepare campaign for external platform' });
  }
});

// Get all supported ad platforms
router.get('/platforms', requireAuth, async (req, res) => {
  try {
    const platforms = await db
      .select()
      .from(adPlatforms)
      .where(eq(adPlatforms.isActive, true));
    
    res.json(platforms);
  } catch (error) {
    console.error('Error fetching ad platforms:', error);
    res.status(500).json({ error: 'Failed to fetch ad platforms' });
  }
});

export default router;