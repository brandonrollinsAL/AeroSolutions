import { db } from '../db';
import { eq, desc, and } from 'drizzle-orm';
import {
  adCampaigns,
  adGroups,
  adCreatives,
  type AdCampaign,
  type AdGroup,
  type AdCreative
} from '../../shared/schema';
import { grokApi } from '../grok';

// Campaign-related functions
export async function createCampaign(data: any): Promise<AdCampaign> {
  try {
    const [campaign] = await db.insert(adCampaigns).values({
      name: data.name,
      description: data.description || null,
      objective: data.objective,
      status: data.status || 'draft',
      startDate: data.startDate,
      endDate: data.endDate || null,
      budget: data.budget || null,
      dailyBudget: data.dailyBudget || null,
      primaryPlatforms: data.primaryPlatforms || null,
      businessType: data.businessType || null,
      businessDescription: data.businessDescription || null,
      targetAudience: data.targetAudience || null,
      createdBy: data.createdBy
    }).returning();
    
    return campaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function getCampaigns(userId: number): Promise<AdCampaign[]> {
  try {
    const campaigns = await db.select().from(adCampaigns)
      .where(eq(adCampaigns.createdBy, userId))
      .orderBy(desc(adCampaigns.createdAt));
    
    return campaigns;
  } catch (error) {
    console.error('Error getting campaigns:', error);
    throw error;
  }
}

export async function getCampaign(campaignId: number, userId: number): Promise<AdCampaign | undefined> {
  try {
    const [campaign] = await db.select().from(adCampaigns)
      .where(
        and(
          eq(adCampaigns.id, campaignId),
          eq(adCampaigns.createdBy, userId)
        )
      );
    
    return campaign;
  } catch (error) {
    console.error('Error getting campaign:', error);
    throw error;
  }
}

export async function updateCampaign(campaignId: number, data: Partial<AdCampaign>): Promise<AdCampaign> {
  try {
    const [updatedCampaign] = await db.update(adCampaigns)
      .set(data)
      .where(eq(adCampaigns.id, campaignId))
      .returning();
    
    return updatedCampaign;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

// Ad Group related functions
export async function getAdGroups(campaignId: number): Promise<AdGroup[]> {
  try {
    const groups = await db.select().from(adGroups)
      .where(eq(adGroups.campaignId, campaignId))
      .orderBy(desc(adGroups.createdAt));
    
    return groups;
  } catch (error) {
    console.error('Error getting ad groups:', error);
    throw error;
  }
}

export async function getAdGroup(groupId: number): Promise<AdGroup | undefined> {
  try {
    const [group] = await db.select().from(adGroups)
      .where(eq(adGroups.id, groupId));
    
    return group;
  } catch (error) {
    console.error('Error getting ad group:', error);
    throw error;
  }
}

export async function createAdGroup(data: any): Promise<AdGroup> {
  try {
    const [group] = await db.insert(adGroups).values({
      name: data.name,
      campaignId: data.campaignId,
      status: data.status || 'draft',
      startDate: data.startDate,
      endDate: data.endDate || null,
      budget: data.budget || null,
      bidAmount: data.bidAmount || null,
      bidStrategy: data.bidStrategy || null,
      metrics: data.metrics || null,
      externalIds: data.externalIds || null
    }).returning();
    
    return group;
  } catch (error) {
    console.error('Error creating ad group:', error);
    throw error;
  }
}

// Creative related functions
export async function getCreatives(groupId: number): Promise<AdCreative[]> {
  try {
    const creatives = await db.select().from(adCreatives)
      .where(eq(adCreatives.groupId, groupId))
      .orderBy(desc(adCreatives.createdAt));
    
    return creatives;
  } catch (error) {
    console.error('Error getting creatives:', error);
    throw error;
  }
}

export async function getCreative(creativeId: number): Promise<AdCreative | undefined> {
  try {
    const [creative] = await db.select().from(adCreatives)
      .where(eq(adCreatives.id, creativeId));
    
    return creative;
  } catch (error) {
    console.error('Error getting creative:', error);
    throw error;
  }
}

export async function createCreative(data: any): Promise<AdCreative> {
  try {
    const [creative] = await db.insert(adCreatives).values({
      name: data.name,
      groupId: data.groupId,
      type: data.type,
      headline: data.headline || null,
      description: data.description || null,
      ctaText: data.ctaText || null,
      imageUrl: data.imageUrl || null,
      videoUrl: data.videoUrl || null,
      landingPageUrl: data.landingPageUrl || null,
      status: data.status || 'draft',
      abTestGroup: data.abTestGroup || null,
      metrics: data.metrics || null,
      insights: data.insights || null,
      performanceRating: data.performanceRating || null,
      externalIds: data.externalIds || null
    }).returning();
    
    return creative;
  } catch (error) {
    console.error('Error creating creative:', error);
    throw error;
  }
}

// AI-powered functions
export async function generateTargetingStrategy(campaign: AdCampaign): Promise<any> {
  try {
    const prompt = `
      Generate a comprehensive targeting strategy for a digital marketing campaign with the following details:
      
      Campaign name: ${campaign.name}
      Objective: ${campaign.objective}
      ${campaign.businessType ? `Business type: ${campaign.businessType}` : ''}
      ${campaign.businessDescription ? `Business description: ${campaign.businessDescription}` : ''}
      ${campaign.targetAudience ? `Target audience: ${campaign.targetAudience}` : ''}
      
      Your response should include:
      1. Demographics targeting (age ranges, gender, income levels)
      2. Geographic targeting (regions, cities, radius)
      3. Interest categories
      4. Behavioral targeting
      5. Lookalike audiences
      6. Custom audience suggestions (if any)
      7. Exclusion criteria
      
      Format your response as JSON with these sections.
    `;
    
    const result = await grokApi.generateJson({
      prompt,
      systemPrompt: "You are a digital marketing expert specializing in ad targeting strategies. Your task is to provide detailed, realistic targeting recommendations based on the campaign details provided."
    });
    
    return result;
  } catch (error) {
    console.error('Error generating targeting strategy:', error);
    return {
      error: 'Failed to generate targeting strategy',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateAdGroupSuggestions(campaign: AdCampaign): Promise<any> {
  try {
    const prompt = `
      Generate AI-powered ad group suggestions for a digital marketing campaign with the following details:
      
      Campaign name: ${campaign.name}
      Objective: ${campaign.objective}
      ${campaign.businessType ? `Business type: ${campaign.businessType}` : ''}
      ${campaign.businessDescription ? `Business description: ${campaign.businessDescription}` : ''}
      ${campaign.targetAudience ? `Target audience: ${campaign.targetAudience}` : ''}
      
      Create 3-5 suggested ad groups, each with:
      1. Name
      2. Target audience focus
      3. Bidding strategy
      4. Budget allocation (percentage of total campaign budget)
      5. Key metrics to track for this group
      
      Format your response as JSON with an array of ad group objects.
    `;
    
    const result = await grokApi.generateJson({
      prompt,
      systemPrompt: "You are a digital marketing expert specializing in campaign structure and optimization. Your task is to provide practical, effective ad group suggestions based on the campaign details provided."
    });
    
    return result;
  } catch (error) {
    console.error('Error generating ad group suggestions:', error);
    return {
      error: 'Failed to generate ad group suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateCreativeSuggestions(adGroup: AdGroup, campaign: AdCampaign): Promise<any> {
  try {
    const prompt = `
      Generate 3-5 creative suggestions for a digital ad with the following details:
      
      Campaign name: ${campaign.name}
      Campaign objective: ${campaign.objective}
      Ad group name: ${adGroup.name}
      ${campaign.businessType ? `Business type: ${campaign.businessType}` : ''}
      ${campaign.businessDescription ? `Business description: ${campaign.businessDescription}` : ''}
      ${campaign.targetAudience ? `Target audience: ${campaign.targetAudience}` : ''}
      
      For each creative suggestion, include:
      1. Type (image, video, carousel)
      2. Headline (max 40 chars)
      3. Description (max 120 chars)
      4. Call-to-action button text
      5. Key visual elements to include
      6. Tone and messaging approach
      
      Format your response as JSON with an array of creative objects.
    `;
    
    const result = await grokApi.generateJson({
      prompt,
      systemPrompt: "You are a digital advertising creative expert. Your task is to generate compelling, effective ad creative concepts based on the campaign and ad group details provided."
    });
    
    return result;
  } catch (error) {
    console.error('Error generating creative suggestions:', error);
    return {
      error: 'Failed to generate creative suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateCampaignOptimizationSuggestions(campaign: AdCampaign): Promise<any> {
  try {
    // Extract budget information for analysis
    let budget = 0;
    if (campaign.budget) {
      budget = parseFloat(campaign.budget);
    }
    
    const prompt = `
      Generate a set of optimization suggestions for a digital marketing campaign with the following details:
      
      Campaign name: ${campaign.name}
      Objective: ${campaign.objective}
      Status: ${campaign.status}
      Start date: ${campaign.startDate.toISOString().split('T')[0]}
      ${campaign.endDate ? `End date: ${campaign.endDate.toISOString().split('T')[0]}` : ''}
      ${campaign.budget ? `Total budget: $${campaign.budget}` : ''}
      ${campaign.dailyBudget ? `Daily budget: $${campaign.dailyBudget}` : ''}
      ${campaign.businessType ? `Business type: ${campaign.businessType}` : ''}
      ${campaign.targetAudience ? `Target audience: ${campaign.targetAudience}` : ''}
      
      Provide optimization suggestions in these areas:
      1. Budget allocation adjustments
      2. Audience targeting refinements
      3. Bidding strategy improvements
      4. Ad creative optimization
      5. Performance tracking enhancements
      6. Testing opportunities
      
      Format your response as JSON with these sections.
    `;
    
    const result = await grokApi.generateJson({
      prompt,
      systemPrompt: "You are a digital marketing optimization expert. Your task is to provide practical, actionable suggestions to improve campaign performance based on the details provided."
    });
    
    return result;
  } catch (error) {
    console.error('Error generating campaign optimization suggestions:', error);
    return {
      error: 'Failed to generate campaign optimization suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default {
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
};