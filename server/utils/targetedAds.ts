import { db } from '../db';
import { adCreatives, adCampaigns, adGroups, adTargetingProfiles, users, userActivity, marketplaceItems } from '@shared/schema';
import { eq, and, like, gte, lte, desc, sql } from 'drizzle-orm';
import { generateJson, generateText } from './xaiClient';

/**
 * Generate targeted ad content based on user data and campaign objectives
 * @param campaignId Campaign ID
 * @param userId Optional user ID for personalization
 * @returns Generated ad content
 */
export async function generateAdContent(
  campaignId: number,
  userId?: number
): Promise<{
  headline: string;
  description: string;
  callToAction: string;
  imagePrompt?: string;
  suggestedTags?: string[];
  aiPrompt: string;
}> {
  try {
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // Get user data if provided
    let userData = null;
    let userActivities = null;
    
    if (userId) {
      [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      userActivities = await db
        .select()
        .from(userActivity)
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.timestamp))
        .limit(20);
    }

    // Build the system prompt
    const systemPrompt = `You are an expert marketing strategist specializing in creating targeted digital ad content. 
    Your task is to create compelling ad content that aligns with the campaign objective and resonates with the target audience.
    Create content that is concise, engaging, and designed to drive the desired action.
    Your response should be formatted as JSON with the following structure:
    {
      "headline": "Attention-grabbing headline (max 50 chars)",
      "description": "Compelling description of the value proposition (max 150 chars)",
      "callToAction": "Clear call to action (max 20 chars)",
      "imagePrompt": "Prompt for generating supporting visuals",
      "suggestedTags": ["tag1", "tag2", "tag3"]
    }
    Ensure that your content is:
    - Aligned with the campaign objective (${campaign.objective})
    - Relevant to the target audience demographics and interests
    - Clear, concise, and compelling
    - Compliant with digital advertising standards (no misleading claims)`;

    // Build the content generation prompt
    let prompt = `Generate targeted ad content for the following campaign:
    
    Campaign: ${campaign.name}
    Description: ${campaign.description || 'N/A'}
    Objective: ${campaign.objective}
    Target Audience: ${JSON.stringify(campaign.targetAudience || {})}
    `;

    // Add user-specific data if available
    if (userData) {
      prompt += `\nUser Data:
      Business Type: ${userData.businessType || 'N/A'}
      Preferences: ${userData.preferences || 'N/A'}
      
      User Activity Summary:
      ${userActivities ? userActivities.map(a => `- ${a.type}: ${a.detail || 'N/A'}`).join('\n') : 'No activity data available'}
      `;
    }

    // Generate the ad content
    const adContent = await generateJson<{
      headline: string;
      description: string;
      callToAction: string;
      imagePrompt?: string;
      suggestedTags?: string[];
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.7
    });

    return {
      ...adContent,
      aiPrompt: prompt // Store the original prompt for reference
    };
  } catch (error) {
    console.error('Error generating ad content:', error);
    throw error;
  }
}

/**
 * Generate target audience segments based on user data and business type
 * @param businessType Type of business
 * @param userBehaviors Optional array of user behaviors to target
 * @returns Generated audience targeting criteria
 */
export async function generateTargetAudience(
  businessType: string,
  userBehaviors: string[] = []
): Promise<{
  demographics: {
    ageRange: string[];
    gender: string[];
    location: string[];
    language: string[];
    income?: string[];
    education?: string[];
    occupation?: string[];
  };
  interests: string[];
  behaviors: string[];
  keywords: string[];
  excludedAudiences?: string[];
  platforms: string[];
  devices: string[];
}> {
  try {
    // Build the system prompt
    const systemPrompt = `You are an expert in digital marketing and audience segmentation.
    Your task is to create highly effective audience targeting profiles based on business type and user behaviors.
    Your response should provide comprehensive targeting criteria that would maximize campaign effectiveness.
    Respond with JSON in this exact format:
    {
      "demographics": {
        "ageRange": ["18-24", "25-34", ...],
        "gender": ["male", "female", "all"],
        "location": ["urban", "suburban", ...],
        "language": ["en", "es", ...],
        "income": ["middle", "upper-middle", ...],
        "education": ["high school", "bachelor", ...],
        "occupation": ["professional", "student", ...]
      },
      "interests": ["interest1", "interest2", ...],
      "behaviors": ["behavior1", "behavior2", ...],
      "keywords": ["keyword1", "keyword2", ...],
      "excludedAudiences": ["segment1", "segment2", ...],
      "platforms": ["facebook", "instagram", "google", ...],
      "devices": ["mobile", "desktop", "tablet", ...]
    }`;

    // Build the audience generation prompt
    const prompt = `Generate optimal audience targeting criteria for a business in the following category:
    
    Business Type: ${businessType}
    
    ${userBehaviors.length > 0 ? `Target users who have exhibited these behaviors: ${userBehaviors.join(', ')}` : ''}
    
    Based on the business type${userBehaviors.length > 0 ? ' and user behaviors' : ''}, recommend comprehensive targeting criteria that would be most effective for digital advertising campaigns.
    Consider demographics, interests, behaviors, and keywords that would be most relevant.
    Also suggest platforms and devices that would be most effective for reaching this audience.
    `;

    // Generate the audience targeting criteria
    const targetingCriteria = await generateJson<{
      demographics: {
        ageRange: string[];
        gender: string[];
        location: string[];
        language: string[];
        income?: string[];
        education?: string[];
        occupation?: string[];
      };
      interests: string[];
      behaviors: string[];
      keywords: string[];
      excludedAudiences?: string[];
      platforms: string[];
      devices: string[];
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.4
    });

    return targetingCriteria;
  } catch (error) {
    console.error('Error generating target audience:', error);
    throw error;
  }
}

/**
 * Create a new ad campaign with AI-generated content and targeting
 * @param name Campaign name
 * @param description Campaign description
 * @param objective Campaign objective
 * @param businessType Business type for targeting
 * @param budget Campaign budget
 * @param startDate Campaign start date
 * @param userId User ID creating the campaign
 * @returns Created campaign with generated groups and creatives
 */
export async function createCampaignWithAI(
  name: string,
  description: string,
  objective: string,
  businessType: string,
  budget: number,
  startDate: Date,
  userId: number
): Promise<{
  campaign: any;
  groups: any[];
  creatives: any[];
}> {
  try {
    // 1. Generate target audience based on business type
    const targetAudience = await generateTargetAudience(businessType);

    // 2. Create the campaign
    const [campaign] = await db
      .insert(adCampaigns)
      .values({
        name,
        description,
        objective,
        startDate,
        budget,
        dailyBudget: budget / 30, // Rough estimate for daily budget
        targetAudience,
        createdBy: userId,
        status: 'draft'
      })
      .returning();

    // 3. Generate ad content
    const adContent = await generateAdContent(campaign.id, userId);

    // 4. Create an ad group
    const [adGroup] = await db
      .insert(adGroups)
      .values({
        campaignId: campaign.id,
        name: `${name} - Main Group`,
        startDate,
        status: 'draft',
        budget: budget * 0.9, // 90% of total budget to main group
        bidStrategy: 'auto'
      })
      .returning();

    // 5. Create ad creatives (main version)
    const [adCreative] = await db
      .insert(adCreatives)
      .values({
        groupId: adGroup.id,
        name: `${name} - Main Creative`,
        type: 'image',
        headline: adContent.headline,
        description: adContent.description,
        callToAction: adContent.callToAction,
        aiGenerated: true,
        aiPrompt: adContent.aiPrompt,
        status: 'draft'
      })
      .returning();

    // 6. Create A/B test variants (optional)
    const abVariants = [];

    // Return the complete campaign structure
    return {
      campaign,
      groups: [adGroup],
      creatives: [adCreative, ...abVariants]
    };
  } catch (error) {
    console.error('Error creating campaign with AI:', error);
    throw error;
  }
}

/**
 * Analyze ad performance and provide recommendations for improvement
 * @param adCreativeId ID of the ad creative to analyze
 * @returns Analysis and recommendations
 */
export async function analyzeAdPerformance(adCreativeId: number): Promise<{
  performanceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  abTestSuggestions: {
    headline?: string;
    description?: string;
    callToAction?: string;
  }[];
}> {
  try {
    // 1. Get the ad creative
    const [adCreative] = await db
      .select()
      .from(adCreatives)
      .where(eq(adCreatives.id, adCreativeId));

    if (!adCreative) {
      throw new Error(`Ad creative with ID ${adCreativeId} not found`);
    }

    // 2. Get the ad group
    const [adGroup] = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.id, adCreative.groupId));

    // 3. Get the campaign
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, adGroup.campaignId));

    // Build the system prompt
    const systemPrompt = `You are a digital advertising expert specializing in performance analysis and optimization.
    Analyze the provided ad creative and performance metrics to identify strengths, weaknesses, and actionable recommendations.
    Your response should be a JSON object with the following structure:
    {
      "performanceScore": number from 1-10,
      "strengths": ["strength1", "strength2", ...],
      "weaknesses": ["weakness1", "weakness2", ...],
      "recommendations": ["recommendation1", "recommendation2", ...],
      "abTestSuggestions": [
        { "headline": "Alternative headline", "description": "Alternative description", "callToAction": "Alternative CTA" },
        { ... additional variants ... }
      ]
    }`;

    // Build the analysis prompt
    const prompt = `Analyze this ad creative and its performance:
    
    Ad Creative:
    - Headline: ${adCreative.headline}
    - Description: ${adCreative.description}
    - Call to Action: ${adCreative.callToAction}
    - Type: ${adCreative.type}
    
    Campaign Objective: ${campaign.objective}
    Target Audience: ${JSON.stringify(campaign.targetAudience || {})}
    
    Performance Metrics:
    ${adCreative.metrics ? JSON.stringify(adCreative.metrics, null, 2) : 'No metrics available yet'}
    
    Considering the campaign objective and target audience, analyze the creative's effectiveness and suggest improvements.
    Also propose A/B test variants that might perform better.`;

    // Generate the analysis
    const analysis = await generateJson<{
      performanceScore: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      abTestSuggestions: {
        headline?: string;
        description?: string;
        callToAction?: string;
      }[];
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.4
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing ad performance:', error);
    throw error;
  }
}

/**
 * Generate ad campaign metrics visualization insights
 * @param campaignId Campaign ID
 * @returns Visualization insights and recommendations
 */
export async function generateCampaignInsights(campaignId: number): Promise<{
  summary: string;
  keyMetrics: {
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    insight: string;
  }[];
  insights: string[];
  recommendations: string[];
  bestPerformingAds: {
    id: number;
    name: string;
    reason: string;
  }[];
}> {
  try {
    // 1. Get the campaign
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // 2. Get all groups in the campaign
    const groups = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.campaignId, campaignId));

    // 3. Get all creatives across all groups
    const groupIds = groups.map(group => group.id);
    let creatives = [];
    
    if (groupIds.length > 0) {
      creatives = await db
        .select()
        .from(adCreatives)
        .where(sql`${adCreatives.groupId} IN (${groupIds.join(',')})`);
    }

    // Build the system prompt
    const systemPrompt = `You are a data analyst specializing in digital advertising performance metrics.
    Analyze the provided campaign data to generate actionable insights and visualizations recommendations.
    Your analysis should highlight key metrics, trends, and optimization opportunities.
    Respond with JSON in this exact format:
    {
      "summary": "Brief campaign performance summary",
      "keyMetrics": [
        { "name": "Metric name", "value": numeric value, "trend": "up/down/stable", "insight": "Insight about this metric" },
        ...
      ],
      "insights": ["Insight 1", "Insight 2", ...],
      "recommendations": ["Recommendation 1", "Recommendation 2", ...],
      "bestPerformingAds": [
        { "id": creative id, "name": "creative name", "reason": "why it's performing well" },
        ...
      ]
    }`;

    // Build the insights prompt
    const prompt = `Generate performance insights for this ad campaign:
    
    Campaign: ${campaign.name}
    Objective: ${campaign.objective}
    Status: ${campaign.status}
    Budget: $${campaign.budget}
    Target Audience: ${JSON.stringify(campaign.targetAudience || {})}
    
    Campaign Metrics:
    ${campaign.metrics ? JSON.stringify(campaign.metrics, null, 2) : 'No metrics available yet'}
    
    ${groups.length} Ad Groups:
    ${groups.map(g => `- ${g.name}: $${g.budget} budget, Status: ${g.status}`).join('\n')}
    
    ${creatives.length} Ad Creatives:
    ${creatives.map(c => `- ${c.name}: Type: ${c.type}, Status: ${c.status}`).join('\n')}
    ${creatives.map(c => `  Metrics: ${c.metrics ? JSON.stringify(c.metrics) : 'No metrics yet'}`).join('\n')}
    
    Based on this data, provide a comprehensive performance analysis with actionable insights.
    If metrics are limited or unavailable, provide hypothetical insights based on the campaign structure and objectives.`;

    // Generate the insights
    const insights = await generateJson<{
      summary: string;
      keyMetrics: {
        name: string;
        value: number;
        trend: 'up' | 'down' | 'stable';
        insight: string;
      }[];
      insights: string[];
      recommendations: string[];
      bestPerformingAds: {
        id: number;
        name: string;
        reason: string;
      }[];
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.4
    });

    return insights;
  } catch (error) {
    console.error('Error generating campaign insights:', error);
    throw error;
  }
}

/**
 * Prepare campaign data for external ad platform integration
 * @param campaignId Campaign ID
 * @param platformName Platform name (e.g., "google_ads", "facebook_ads")
 * @returns Formatted campaign data for the platform API
 */
export async function prepareCampaignForExternalPlatform(
  campaignId: number,
  platformName: string
): Promise<{
  platformSpecificData: any;
  mappingDetails: any;
  apiEndpoints: any;
  estimatedReach: number;
  suggestedBudget: number;
}> {
  try {
    // 1. Get the campaign
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // 2. Get the ad platform details
    const [platform] = await db
      .select()
      .from(adPlatforms)
      .where(eq(adPlatforms.name, platformName));

    if (!platform) {
      throw new Error(`Ad platform ${platformName} not found`);
    }

    // 3. Get all groups and creatives
    const groups = await db
      .select()
      .from(adGroups)
      .where(eq(adGroups.campaignId, campaignId));

    const groupIds = groups.map(group => group.id);
    let creatives = [];
    
    if (groupIds.length > 0) {
      creatives = await db
        .select()
        .from(adCreatives)
        .where(sql`${adCreatives.groupId} IN (${groupIds.join(',')})`);
    }

    // Build the system prompt
    const systemPrompt = `You are an advertising API integration specialist.
    Your task is to convert the internal campaign structure to the format required by the ${platformName} API.
    Provide the mapping between our data model and the platform's requirements.
    Respond with JSON in this exact format:
    {
      "platformSpecificData": {
        // Platform-specific campaign structure
      },
      "mappingDetails": {
        // Mapping between our fields and platform fields
      },
      "apiEndpoints": {
        // Relevant API endpoints for this platform
      },
      "estimatedReach": numeric estimated reach,
      "suggestedBudget": numeric suggested budget
    }`;

    // Build the platform preparation prompt
    const prompt = `Prepare this campaign for integration with ${platformName}:
    
    Campaign: ${campaign.name}
    Description: ${campaign.description || 'N/A'}
    Objective: ${campaign.objective}
    Budget: $${campaign.budget}
    Daily Budget: $${campaign.dailyBudget || 'N/A'}
    Start Date: ${campaign.startDate}
    End Date: ${campaign.endDate || 'No end date'}
    Target Audience: ${JSON.stringify(campaign.targetAudience || {})}
    
    Platform Details:
    Name: ${platform.name}
    Display Name: ${platform.displayName}
    API Configuration: ${JSON.stringify(platform.apiConfig || {})}
    
    Our campaign has ${groups.length} ad groups and ${creatives.length} creatives.
    
    Convert this internal campaign structure to the format required by the ${platformName} API.
    Include all necessary mappings, required API endpoints, and any platform-specific considerations.
    Estimate the potential reach based on the target audience and suggest an optimal budget for this platform.`;

    // Generate the platform-specific data
    const platformData = await generateJson<{
      platformSpecificData: any;
      mappingDetails: any;
      apiEndpoints: any;
      estimatedReach: number;
      suggestedBudget: number;
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.3
    });

    return platformData;
  } catch (error) {
    console.error(`Error preparing campaign for ${platformName}:`, error);
    throw error;
  }
}

export default {
  generateAdContent,
  generateTargetAudience,
  createCampaignWithAI,
  analyzeAdPerformance,
  generateCampaignInsights,
  prepareCampaignForExternalPlatform
};