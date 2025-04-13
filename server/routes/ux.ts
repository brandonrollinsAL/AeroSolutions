import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { callXAI, getGrokCompletion } from '../utils/xaiClient';
import { db } from '../db';

const router = Router();

/**
 * Suggestion 11: Personalized Onboarding Messages
 * Generates custom onboarding messages based on user profile
 */
router.post('/onboarding-message', [
  body('user_data')
    .notEmpty().withMessage('User data is required')
    .isObject().withMessage('User data must be an object'),
  body('onboarding_stage')
    .optional()
    .isString().withMessage('Onboarding stage must be a string')
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

    const { user_data, onboarding_stage = 'welcome' } = req.body;
    
    // Extract relevant user information
    const { name, business_type, interests = [] } = user_data;
    
    const interestsText = interests.length > 0 
      ? `with interests in ${interests.join(', ')}`
      : '';

    const prompt = `Create a personalized onboarding message for ${name}, who owns a ${business_type} business ${interestsText}.
    Onboarding stage: ${onboarding_stage}
    
    The message should:
    - Be warm and welcoming
    - Briefly introduce relevant Elevion web development services for their business type
    - Include a specific next step based on the onboarding stage
    - Be under 150 words
    - Mention our free mockup service and AI-generated quotes at 60% below market rates
    
    Format as a JSON object with "subject" and "message" fields.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500
    });
    
    return res.status(200).json({
      success: true,
      onboarding_message: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Onboarding message generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Onboarding message generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 12: Smart FAQ Generator
 * Dynamically generates FAQ content based on user behavior and common questions
 */
router.post('/generate-faq', [
  body('business_type')
    .notEmpty().withMessage('Business type is required')
    .isString().withMessage('Business type must be a string'),
  body('service_focus')
    .optional()
    .isString().withMessage('Service focus must be a string'),
  body('common_questions')
    .optional()
    .isArray().withMessage('Common questions must be an array')
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
      business_type, 
      service_focus = 'general web development', 
      common_questions = [] 
    } = req.body;

    const questionsText = common_questions.length > 0
      ? `Include answers to these specific questions:\n${common_questions.map(q => `- ${q}`).join('\n')}`
      : 'Generate common questions and answers relevant to this business type';

    const prompt = `Create a comprehensive FAQ section for ${business_type} businesses interested in ${service_focus} services from Elevion.
    
    ${questionsText}
    
    Guidelines:
    - Include at least 8 Q&A pairs (more if specific questions were provided)
    - Focus on addressing common concerns about web development processes
    - Include information about pricing, timelines, and maintenance
    - Mention Elevion's free mockups and 60% below market rate pricing
    - Keep answers concise and clear (50-100 words each)
    
    Format as a JSON array of objects with "question" and "answer" fields.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500
    });
    
    return res.status(200).json({
      success: true,
      faq_content: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('FAQ generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'FAQ generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 13: Support Response Generator
 * Creates personalized support responses based on user tickets
 */
router.post('/support-response', [
  body('ticket_content')
    .notEmpty().withMessage('Ticket content is required')
    .isString().withMessage('Ticket content must be a string'),
  body('user_history')
    .optional()
    .isObject().withMessage('User history must be an object'),
  body('priority')
    .optional()
    .isString().withMessage('Priority must be a string')
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
      ticket_content, 
      user_history = {}, 
      priority = 'normal' 
    } = req.body;
    
    // Format user history if available
    const historyText = Object.keys(user_history).length > 0
      ? `User history:\n${JSON.stringify(user_history, null, 2)}`
      : 'No previous history available for this user.';

    const prompt = `Generate a support response for this customer ticket:
    
    Ticket content: "${ticket_content}"
    Priority: ${priority}
    ${historyText}
    
    Guidelines for the response:
    - Maintain a professional, helpful tone
    - Acknowledge the customer's concern
    - Provide a clear solution or next steps
    - Include any relevant resources or documentation links
    - End with an appropriate sign-off
    - Keep the response between 100-200 words
    
    Return the response as plain text.`;

    const supportResponse = await getGrokCompletion(prompt, 'grok-3-mini');
    
    return res.status(200).json({
      success: true,
      support_response: supportResponse
    });
  } catch (error: any) {
    console.error('Support response generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Support response generation failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 14: User Feedback Analyzer
 * Analyzes user feedback and provides actionable insights
 */
router.post('/analyze-feedback', [
  body('feedback')
    .notEmpty().withMessage('Feedback is required')
    .isArray().withMessage('Feedback must be an array'),
  body('feedback_type')
    .optional()
    .isString().withMessage('Feedback type must be a string')
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

    const { feedback, feedback_type = 'general' } = req.body;
    
    const feedbackText = feedback.map((item: any, index: number) => {
      return `${index + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`;
    }).join('\n');

    const prompt = `Analyze the following user ${feedback_type} feedback for Elevion web development services:
    
    ${feedbackText}
    
    Provide a comprehensive analysis including:
    1. Sentiment breakdown (positive/negative/neutral percentages)
    2. Key themes and patterns
    3. Most common pain points
    4. Most appreciated features/aspects
    5. Actionable recommendations based on the feedback
    6. Suggested priority areas for improvement
    
    Format as JSON with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      feedback_analysis: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Feedback analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Feedback analysis failed',
      error: error.message
    });
  }
});

/**
 * Suggestion 15: User Persona Generator
 * Creates detailed user personas based on aggregated user data
 */
router.post('/generate-persona', [
  body('user_data')
    .notEmpty().withMessage('User data is required')
    .isArray().withMessage('User data must be an array'),
  body('segment_name')
    .optional()
    .isString().withMessage('Segment name must be a string')
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

    const { user_data, segment_name = 'primary customer segment' } = req.body;
    
    const userData = JSON.stringify(user_data, null, 2);

    const prompt = `Create a detailed user persona based on this aggregated user data for our ${segment_name}:
    
    ${userData}
    
    Generate a comprehensive persona including:
    1. Name and basic demographics
    2. Job role and company details
    3. Goals and motivations
    4. Pain points and challenges
    5. Preferred communication channels
    6. Decision-making factors
    7. Technical expertise level
    8. Budget considerations
    9. A day in their life
    10. How Elevion's web development services specifically address their needs
    
    Return as a JSON object with appropriate sections.`;

    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    });
    
    return res.status(200).json({
      success: true,
      user_persona: JSON.parse(response.choices[0].message.content)
    });
  } catch (error: any) {
    console.error('Persona generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Persona generation failed',
      error: error.message
    });
  }
});

export default router;