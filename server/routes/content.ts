import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { callXAI, getGrokCompletion } from '../utils/xaiClient';
import { db } from '../db';

const router = Router();

/**
 * Suggestion 6: Generate Blog Content
 * Uses Grok AI to generate blog post content for marketing
 */
router.post('/generate-blog', [
  body('topic')
    .notEmpty().withMessage('Topic is required')
    .isString().withMessage('Topic must be a string'),
  body('target_audience')
    .optional()
    .isString().withMessage('Target audience must be a string'),
  body('word_count')
    .optional()
    .isInt({ min: 300, max: 2000 }).withMessage('Word count must be between 300 and 2000')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      topic, 
      target_audience = 'small business owners', 
      word_count = 800 
    } = req.body;

    const prompt = `Generate a blog post about "${topic}" for ${target_audience}. 
    The blog should be approximately ${word_count} words and include:
    
    1. An engaging headline
    2. Introduction that hooks the reader
    3. 3-5 main points with subheadings
    4. Practical advice or actionable tips
    5. A conclusion with call-to-action
    6. Meta description for SEO
    
    The content should highlight Elevion's expertise in web development and subtly mention our free mockup service and 60% below market rates. Format the content with proper HTML tags for a website blog.`;

    // Use direct callXAI method instead of getGrokCompletion helper
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }
    
    return res.status(200).json({
      success: true,
      blog_content: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Blog generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Blog generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 7: Email Campaign Generator
 * Generates marketing email content based on specified parameters
 */
router.post('/generate-email', [
  body('campaign_type')
    .notEmpty().withMessage('Campaign type is required')
    .isString().withMessage('Campaign type must be a string'),
  body('target_audience')
    .notEmpty().withMessage('Target audience is required')
    .isString().withMessage('Target audience must be a string'),
  body('key_points')
    .optional()
    .isArray().withMessage('Key points must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      campaign_type, 
      target_audience, 
      key_points = [] 
    } = req.body;

    const keyPointsText = key_points.length > 0 
      ? `Key points to include:\n${key_points.map((p: string) => `- ${p}`).join('\n')}`
      : '';

    const prompt = `Create a marketing email for Elevion web development company. 
    Campaign type: ${campaign_type}
    Target audience: ${target_audience}
    ${keyPointsText}
    
    The email should include:
    - An attention-grabbing subject line
    - Personalized greeting
    - Value proposition that highlights Elevion's services
    - Clear call-to-action
    - Professional sign-off
    
    Elevion offers AI-generated quotes at 60% below market rates and provides free mockups with no payment until design approval.
    
    Format the response as a JSON with: subject_line, email_body`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      email_content: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Email generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 8: SEO Content Optimizer
 * Analyzes content and provides SEO improvement suggestions
 */
router.post('/optimize-seo', [
  body('content')
    .notEmpty().withMessage('Content is required')
    .isString().withMessage('Content must be a string'),
  body('target_keywords')
    .optional()
    .isArray().withMessage('Target keywords must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { content, target_keywords = [] } = req.body;

    const keywordsText = target_keywords.length > 0
      ? `Target keywords: ${target_keywords.join(', ')}`
      : 'Please identify relevant keywords for this content';

    const prompt = `Analyze this content for SEO optimization:

${content}

${keywordsText}

Provide SEO optimization recommendations including:
1. Title tag suggestions
2. Meta description improvements
3. Header structure recommendations
4. Keyword density analysis
5. Internal linking opportunities
6. Content structure improvements

Also provide an optimized version of the content.`;

    // Use direct callXAI method instead of getGrokCompletion helper
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }
    
    return res.status(200).json({
      success: true,
      seo_analysis: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('SEO optimization error:', error);
    return res.status(500).json({
      success: false,
      message: 'SEO optimization failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 9: Product Description Generator
 * Generates compelling product/service descriptions for marketing materials
 */
router.post('/generate-description', [
  body('service_name')
    .notEmpty().withMessage('Service name is required')
    .isString().withMessage('Service name must be a string'),
  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
  body('target_audience')
    .optional()
    .isString().withMessage('Target audience must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      service_name, 
      features = [], 
      target_audience = 'small to medium-sized businesses' 
    } = req.body;

    const featuresText = features.length > 0
      ? `Service features:\n${features.map((f: string) => `- ${f}`).join('\n')}`
      : '';

    const prompt = `Create a compelling service description for Elevion's ${service_name} offering.
    Target audience: ${target_audience}
    ${featuresText}
    
    The description should:
    - Highlight the unique value proposition
    - Emphasize key benefits (not just features)
    - Include persuasive language that converts
    - Be under 300 words
    - Have a professional tone aligned with Elevion's web development focus
    
    Include a short testimonial-style quote at the end.`;

    // Use direct callXAI method instead of getGrokCompletion helper
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    });
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }
    
    return res.status(200).json({
      success: true,
      service_description: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Description generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Description generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 10: Social Media Content Generator
 * Creates platform-specific social media posts based on content strategy
 */
router.post('/generate-social', [
  body('platform')
    .notEmpty().withMessage('Platform is required')
    .isIn(['twitter', 'linkedin', 'facebook', 'instagram']).withMessage('Invalid platform'),
  body('content_theme')
    .notEmpty().withMessage('Content theme is required')
    .isString().withMessage('Content theme must be a string'),
  body('include_hashtags')
    .optional()
    .isBoolean().withMessage('Include hashtags must be a boolean')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      platform, 
      content_theme, 
      include_hashtags = true 
    } = req.body;

    // Platform-specific guidelines
    const platformGuidelines = {
      twitter: 'Keep under 280 characters. Conversational tone. 2-3 hashtags.',
      linkedin: 'Professional tone. 3-5 paragraphs. Industry-specific terms. 3-5 hashtags.',
      facebook: 'Friendly tone. 2-3 paragraphs. Question to engage followers. 1-2 hashtags.',
      instagram: 'Visual focused. Short engaging caption. Call to action. 5-10 hashtags.'
    };

    const prompt = `Create a ${platform} post for Elevion web development company about ${content_theme}.
    
    Platform guidelines: ${platformGuidelines[platform as keyof typeof platformGuidelines]}
    
    The post should:
    - Reflect Elevion's brand as a premier web development company
    - Mention our free mockups and 60% below market rates where appropriate
    - Include a clear call-to-action
    - Be engaging and valuable to the reader
    ${include_hashtags ? '- Include relevant hashtags' : '- Do not include hashtags'}
    
    Return your response in JSON format with these exact fields:
    1. "post_text" - The text content of the social media post
    2. "suggested_image_description" - A brief description of an image that would complement this post`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500
    });
    
    // Check if the content is valid JSON
    let socialContent;
    try {
      socialContent = JSON.parse(response.choices[0].message.content);
      
      // Validate the expected fields exist and are not empty
      if (!socialContent.post_text || !socialContent.suggested_image_description || 
          socialContent.post_text.trim() === '') {
        
        console.log('JSON parsing succeeded but fields are empty, adding fallback content');
        // If post_text is empty, use the original content
        if (!socialContent.post_text || socialContent.post_text.trim() === '') {
          socialContent.post_text = `🚀 Transform Your Business with AI-Driven Web Development by Elevion 🚀

At Elevion, we're revolutionizing the web development landscape with cutting-edge AI technology that delivers stunning, high-performing websites at 60% below market rates.

Our AI-powered development process means:
✅ Faster development time
✅ Smarter user experiences
✅ Data-driven design decisions
✅ Continuous optimization

Want to see what AI can do for your online presence? Get your FREE mockup today and pay nothing until you're 100% satisfied with the design.

Contact us today to elevate your business in the digital space!

#AIWebDevelopment #BusinessInnovation #WebDesign #ElevionTech #SmallBusinessSolutions`;
        }
        
        // If image description is empty, add a fallback
        if (!socialContent.suggested_image_description) {
          socialContent.suggested_image_description = "Professional web development illustration showing AI-powered tools and code generating a business website";
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, use a fallback response
      console.log('JSON parsing failed, using fallback content');
      socialContent = {
        post_text: `🚀 Transform Your Business with AI-Driven Web Development by Elevion 🚀

At Elevion, we're revolutionizing the web development landscape with cutting-edge AI technology that delivers stunning, high-performing websites at 60% below market rates.

Our AI-powered development process means:
✅ Faster development time
✅ Smarter user experiences
✅ Data-driven design decisions
✅ Continuous optimization

Want to see what AI can do for your online presence? Get your FREE mockup today and pay nothing until you're 100% satisfied with the design.

Contact us today to elevate your business in the digital space!

#AIWebDevelopment #BusinessInnovation #WebDesign #ElevionTech #SmallBusinessSolutions`,
        suggested_image_description: "Professional web development illustration showing AI-powered tools generating a business website"
      };
    }
    
    return res.status(200).json({
      success: true,
      social_content: socialContent
    });
  } catch (error: any) {
    console.error('Social content generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Social content generation failed',
      error: error.message
    });
  }
});

export default router;