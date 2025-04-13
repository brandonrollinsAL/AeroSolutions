import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { grokApi } from '../grok';

const router = express.Router();

/**
 * @route POST /api/marketing/generate-campaign
 * @desc Generate a marketing campaign using XAI
 * @access Private
 */
router.post('/generate-campaign', [
  check('industry').notEmpty().withMessage('Industry is required'),
  check('target').notEmpty().withMessage('Target audience is required'),
  check('goal').notEmpty().withMessage('Campaign goal is required'),
  check('season').notEmpty().withMessage('Season or time period is required'),
  check('tone').notEmpty().withMessage('Tone is required'),
  check('channelTypes').isArray().withMessage('Channel types must be an array'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { industry, target, goal, season, tone, channelTypes, businessName, metrics } = req.body;
    
    // Create the prompt for the XAI API
    const prompt = `Generate a marketing campaign strategy for ${businessName || 'a business'} in the ${industry} industry.
    
Target audience: ${target}
Campaign goal: ${goal}
Season/time period: ${season}
Tone: ${tone}
Channels: ${channelTypes.join(', ')}
${metrics ? `Relevant metrics: ${JSON.stringify(metrics)}` : ''}

Please provide a complete marketing campaign with the following:
1. Campaign name
2. Short campaign description
3. Key messaging points
4. Content for each channel type:
${channelTypes.map(channel => `   - ${channel}`).join('\n')}
5. Suggested timeline
6. Expected KPIs`;

    // Call XAI to generate JSON response
    const response = await grokApi.generateJson({
      prompt,
      systemPrompt: `You are an expert marketing campaign strategist. Create a coherent, practical, and engaging marketing campaign based on the given parameters. 
      Format your response as structured JSON with these fields:
      - campaignName (string): A catchy name for the campaign
      - campaignDescription (string): A concise description of the campaign, 1-2 sentences
      - keyMessaging (array of strings): 3-5 key messaging points 
      - channelContent (object): Content for each requested channel with the channel name as key and an object as value containing:
        - content (string): The main content for this channel
        - headline (string): A headline or subject line
        - callToAction (string): Clear call to action
      - timeline (string): Suggested implementation timeline
      - kpis (array of strings): 3-5 key performance indicators to measure success
      - seasonalTips (array of strings): Optional additional tips relevant to the season`,
      temperature: 0.7
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating marketing campaign:', error);
    return res.status(500).json({ 
      message: 'Failed to generate marketing campaign',
      error: error.message
    });
  }
});

/**
 * @route POST /api/marketing/generate-email
 * @desc Generate a marketing email using XAI
 * @access Private
 */
router.post('/generate-email', [
  check('campaignName').notEmpty().withMessage('Campaign name is required'),
  check('target').notEmpty().withMessage('Target audience is required'),
  check('objective').notEmpty().withMessage('Email objective is required'),
  check('keyPoints').isArray().withMessage('Key points must be an array'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { campaignName, target, objective, keyPoints, businessName, tone } = req.body;
    
    // Create the prompt for the XAI API
    const prompt = `Generate a marketing email for the "${campaignName}" campaign.
    
Business name: ${businessName || 'Our business'}
Target audience: ${target}
Email objective: ${objective}
Key points to include: ${JSON.stringify(keyPoints)}
Tone: ${tone || 'professional'}

Please provide a complete marketing email with subject line, body content, and call to action.`;

    // Call XAI to generate JSON response
    const response = await grokApi.generateJson({
      prompt,
      systemPrompt: `You are an expert email marketing copywriter. Create a compelling, professional marketing email that follows best practices for deliverability and engagement. 
      Format your response as structured JSON with these fields:
      - subject (string): An engaging subject line under 50 characters 
      - preheader (string): A brief preheader text under 100 characters
      - greeting (string): An appropriate greeting
      - bodyContent (string): The main email content, formatted with appropriate paragraphs
      - callToAction (string): A clear call to action
      - signature (string): Email signature`,
      temperature: 0.7
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating marketing email:', error);
    return res.status(500).json({ 
      message: 'Failed to generate marketing email',
      error: error.message
    });
  }
});

/**
 * @route POST /api/marketing/generate-social-post
 * @desc Generate a social media post using XAI
 * @access Private
 */
router.post('/generate-social-post', [
  check('platform').notEmpty().withMessage('Social platform is required'),
  check('campaignName').notEmpty().withMessage('Campaign name is required'),
  check('objective').notEmpty().withMessage('Post objective is required'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { platform, campaignName, objective, tone, keyPoints, businessName, hashtags, includeEmoji } = req.body;
    
    // Determine character limits based on platform
    let characterLimit = 280; // Default (Twitter)
    if (platform.toLowerCase() === 'linkedin') {
      characterLimit = 3000;
    } else if (platform.toLowerCase() === 'facebook') {
      characterLimit = 5000;
    } else if (platform.toLowerCase() === 'instagram') {
      characterLimit = 2200;
    }
    
    // Create the prompt for the XAI API
    const prompt = `Generate a ${platform} post for the "${campaignName}" campaign.
    
Business name: ${businessName || 'Our business'}
Post objective: ${objective}
Key points to include: ${JSON.stringify(keyPoints || [])}
Tone: ${tone || 'professional'}
Include hashtags: ${hashtags ? 'Yes' : 'No'}
Include emoji: ${includeEmoji ? 'Yes' : 'No'}
Character limit: ${characterLimit}

Please provide a complete social media post optimized for ${platform}.`;

    // Call XAI to generate JSON response
    const response = await grokApi.generateJson({
      prompt,
      systemPrompt: `You are an expert social media marketer. Create an engaging, platform-optimized social media post that will drive high engagement.
      Format your response as structured JSON with these fields:
      - content (string): The main post content, optimized for the specific platform
      - hashtags (array of strings): Relevant hashtags (if requested)
      - callToAction (string): A clear call to action
      - suggestedImageDescription (string): Description of an image that would work well with this post`,
      temperature: 0.7
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating social media post:', error);
    return res.status(500).json({ 
      message: 'Failed to generate social media post',
      error: error.message
    });
  }
});

export default router;