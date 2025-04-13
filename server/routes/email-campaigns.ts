import express, { Response } from 'express';
import { db } from '../db';
import { emailCampaigns, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import NodeCache from 'node-cache';
import { OpenAI } from 'openai';
import { grokApi } from '../grok';
import * as authUtils from '../utils/auth';

// Use xAI as the primary suggestion engine with OpenAI as fallback
const useXai = process.env.XAI_API_KEY ? true : false;

// Setup OpenAI client as fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extended request interface with authentication
interface Request extends express.Request {
  isAuthenticated(): boolean;
  user?: any;
}

// Initialize cache for campaign suggestions
// 2-hour TTL for campaign suggestions to balance freshness with performance
const campaignSuggestionsCache = new NodeCache({ stdTTL: 7200 });

const router = express.Router();

/**
 * Generate email campaign suggestions based on industry and type
 */
router.post('/suggestions', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { industry, campaignType } = req.body;
    
    if (!industry || !campaignType) {
      return res.status(400).json({
        success: false,
        message: 'Industry and campaign type are required'
      });
    }
    
    // Create cache key with industry and campaign type
    const cacheKey = `email_campaign_${industry}_${campaignType}`;
    
    // Check if suggestions are cached
    const cachedSuggestions = campaignSuggestionsCache.get(cacheKey);
    if (cachedSuggestions) {
      console.log('Serving cached email campaign suggestions');
      return res.json({
        success: true,
        data: cachedSuggestions
      });
    }
    
    // Generate campaign suggestions based on industry and type
    const suggestions = await generateCampaignSuggestions(industry, campaignType);
    
    // Cache suggestions
    campaignSuggestionsCache.set(cacheKey, suggestions);
    
    return res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error generating email campaign suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate email campaign suggestions'
    });
  }
});

/**
 * Save a generated campaign to the database
 */
router.post('/save', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, industry, campaignType, subject, content, template, scheduledFor, audienceSize } = req.body;
    
    if (!name || !industry || !campaignType || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required campaign fields'
      });
    }
    
    const userId = req.user.id;
    
    // Insert campaign into database
    const [newCampaign] = await db.insert(emailCampaigns).values({
      userId,
      name,
      industry,
      campaignType,
      subject,
      content,
      template,
      status: 'draft',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      audienceSize,
      isAiGenerated: true
    }).returning();
    
    return res.json({
      success: true,
      data: newCampaign
    });
  } catch (error) {
    console.error('Error saving email campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save email campaign'
    });
  }
});

/**
 * Get all campaigns for the current user
 */
router.get('/user-campaigns', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const userCampaigns = await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.userId, userId))
      .orderBy(emailCampaigns.createdAt);
    
    return res.json({
      success: true,
      data: userCampaigns
    });
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user campaigns'
    });
  }
});

/**
 * Update campaign status (draft, scheduled, sent)
 */
router.patch('/status/:id', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status, scheduledFor, sentAt } = req.body;
    
    if (!status || !['draft', 'scheduled', 'sent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (draft, scheduled, sent)'
      });
    }
    
    const userId = req.user.id;
    
    // Verify ownership
    const [campaign] = await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.id, campaignId))
      .where(eq(emailCampaigns.userId, userId));
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found or you do not have permission'
      });
    }
    
    // Update campaign status
    const updateValues: any = { status };
    
    if (status === 'scheduled' && scheduledFor) {
      updateValues.scheduledFor = new Date(scheduledFor);
    }
    
    if (status === 'sent') {
      updateValues.sentAt = sentAt ? new Date(sentAt) : new Date();
    }
    
    const [updatedCampaign] = await db.update(emailCampaigns)
      .set(updateValues)
      .where(eq(emailCampaigns.id, campaignId))
      .returning();
    
    return res.json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update campaign status'
    });
  }
});

/**
 * Delete a campaign
 */
router.delete('/:id', authUtils.authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify ownership
    const [campaign] = await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.id, campaignId))
      .where(eq(emailCampaigns.userId, userId));
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found or you do not have permission'
      });
    }
    
    // Delete campaign
    await db.delete(emailCampaigns)
      .where(eq(emailCampaigns.id, campaignId));
    
    return res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campaign'
    });
  }
});

/**
 * Generate campaign suggestions using xAI or OpenAI
 */
async function generateCampaignSuggestions(industry: string, campaignType: string) {
  try {
    // Campaign types
    const campaignTypeInfo: {[key: string]: string} = {
      welcome: "Welcome a new subscriber or customer",
      promotional: "Promote a product, service, or limited-time offer",
      newsletter: "Share industry news, tips, and company updates",
      announcement: "Announce new product/service/feature",
      followup: "Follow up after a purchase or interaction",
      reengagement: "Re-engage inactive customers or subscribers",
      seasonal: "Seasonal or holiday-related promotions",
      event: "Promote an upcoming event or webinar"
    };
    
    const campaignDescription = campaignTypeInfo[campaignType] || campaignType;
    
    // Create prompt for AI
    const prompt = `Generate 3 email campaign ideas for a ${industry} business. 
    Campaign type: ${campaignType} (${campaignDescription})
    
    For each campaign, provide:
    1. A compelling subject line
    2. A brief description of the email content (2-3 sentences)
    3. A suggested call-to-action
    4. The best time to send (day of week, time of day)
    
    Format the response as a JSON array with objects containing fields: subjectLine, content, callToAction, bestTimeToSend`;
    
    // Use xAI if available, otherwise fallback to OpenAI
    if (useXai) {
      const response = await grokApi.generateJson(prompt, 
        "You are an expert email marketing specialist helping businesses create effective email campaigns", 
        "grok-3-mini"
      );
      return response;
    } else {
      // Fallback to OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert email marketing specialist helping businesses create effective email campaigns"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse JSON response
      const content = completion.choices[0].message.content;
      return JSON.parse(content || "[]");
    }
  } catch (error) {
    console.error("Error generating campaign suggestions:", error);
    // Return a fallback response if AI generation fails
    return [
      {
        subjectLine: `${campaignType} - We have news for you!`,
        content: `This would be a ${campaignType} email for the ${industry} industry. The content would highlight key information relevant to your audience.`,
        callToAction: "Learn More",
        bestTimeToSend: "Tuesday morning"
      }
    ];
  }
}

export default router;