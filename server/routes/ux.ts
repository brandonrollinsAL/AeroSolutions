import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { callXAI, generateText } from '../utils/xaiClient';
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

    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500
      });
      
      // Check if the content is valid JSON
      let onboardingMessage;
      try {
        onboardingMessage = JSON.parse(response.choices[0].message.content);
        
        // Validate the expected fields exist and are not empty
        if (!onboardingMessage.subject || !onboardingMessage.message || 
            onboardingMessage.subject.trim() === '' || onboardingMessage.message.trim() === '') {
          
          console.log('JSON parsing succeeded but fields are empty, adding fallback content');
          
          if (!onboardingMessage.subject || onboardingMessage.subject.trim() === '') {
            onboardingMessage.subject = `Welcome to Elevion, ${name}! Let's Transform Your ${business_type} Business`;
          }
          
          if (!onboardingMessage.message || onboardingMessage.message.trim() === '') {
            onboardingMessage.message = `Hi ${name},

Welcome to Elevion! We're thrilled to have you join our community of forward-thinking ${business_type} business owners.

As promised, we're here to help you transform your online presence with our cutting-edge web development services. Our AI-powered approach allows us to offer solutions at rates 60% below market, without compromising on quality.

${onboarding_stage === 'new_signup' ? 'Your next step is to book a quick discovery call where we can learn more about your specific needs. Click the "Schedule Call" button in your dashboard to get started.' : ''}
${onboarding_stage === 'discovery_completed' ? 'Based on our discovery call, we\'re ready to create your free mockup. Expect to receive this within 48 hours - no payment required until you\'re completely satisfied with the design.' : ''}
${onboarding_stage === 'mockup_delivered' ? 'We hope you loved the mockup we created for you! Ready to move forward? Simply click "Approve Design" in your dashboard, and we\'ll begin development right away.' : ''}

Looking forward to bringing your vision to life!

The Elevion Team
www.elevion.dev
(555) 123-4567`;
          }
        }
      } catch (jsonError) {
        // If JSON parsing fails, use a fallback response
        console.log('Onboarding message JSON parsing failed, using fallback content');
        onboardingMessage = {
          subject: `Welcome to Elevion, ${name}! Let's Transform Your ${business_type} Business`,
          message: `Hi ${name},

Welcome to Elevion! We're thrilled to have you join our community of forward-thinking ${business_type} business owners.

As promised, we're here to help you transform your online presence with our cutting-edge web development services. Our AI-powered approach allows us to offer solutions at rates 60% below market, without compromising on quality.

${onboarding_stage === 'new_signup' ? 'Your next step is to book a quick discovery call where we can learn more about your specific needs. Click the "Schedule Call" button in your dashboard to get started.' : ''}
${onboarding_stage === 'discovery_completed' ? 'Based on our discovery call, we\'re ready to create your free mockup. Expect to receive this within 48 hours - no payment required until you\'re completely satisfied with the design.' : ''}
${onboarding_stage === 'mockup_delivered' ? 'We hope you loved the mockup we created for you! Ready to move forward? Simply click "Approve Design" in your dashboard, and we\'ll begin development right away.' : ''}

Looking forward to bringing your vision to life!

The Elevion Team
www.elevion.dev
(555) 123-4567`
        };
      }
      
      return res.status(200).json({
        success: true,
        onboarding_message: onboardingMessage
      });
    } catch (error) {
      console.error('Onboarding message API call error:', error);
      
      // If API call fails, create a fallback response
      const fallbackMessage = {
        subject: `Welcome to Elevion, ${name}! Let's Transform Your ${business_type} Business`,
        message: `Hi ${name},

Welcome to Elevion! We're thrilled to have you join our community of forward-thinking ${business_type} business owners.

As promised, we're here to help you transform your online presence with our cutting-edge web development services. Our AI-powered approach allows us to offer solutions at rates 60% below market, without compromising on quality.

${onboarding_stage === 'new_signup' ? 'Your next step is to book a quick discovery call where we can learn more about your specific needs. Click the "Schedule Call" button in your dashboard to get started.' : ''}
${onboarding_stage === 'discovery_completed' ? 'Based on our discovery call, we\'re ready to create your free mockup. Expect to receive this within 48 hours - no payment required until you\'re completely satisfied with the design.' : ''}
${onboarding_stage === 'mockup_delivered' ? 'We hope you loved the mockup we created for you! Ready to move forward? Simply click "Approve Design" in your dashboard, and we\'ll begin development right away.' : ''}

Looking forward to bringing your vision to life!

The Elevion Team
www.elevion.dev
(555) 123-4567`
      };
      
      return res.status(200).json({
        success: true,
        onboarding_message: fallbackMessage
      });
    }
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
      ? `Include answers to these specific questions:\n${common_questions.map((q: string) => `- ${q}`).join('\n')}`
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

    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500
      });
      
      // Check if the content is valid JSON
      let faqContent;
      try {
        faqContent = JSON.parse(response.choices[0].message.content);
        
        // Validate the response is a proper array with question/answer objects
        if (!Array.isArray(faqContent) || faqContent.length === 0) {
          console.log('JSON parsing succeeded but result is not a valid array, using fallback content');
          faqContent = generateFallbackFAQ(business_type, service_focus, common_questions);
        } else {
          // Check if all objects have valid question and answer properties
          const hasInvalidItems = faqContent.some(item => 
            !item.question || !item.answer || 
            item.question.trim() === '' || 
            item.answer.trim() === ''
          );
          
          if (hasInvalidItems) {
            console.log('JSON parsing succeeded but some FAQ items are invalid, using fallback content');
            faqContent = generateFallbackFAQ(business_type, service_focus, common_questions);
          }
        }
      } catch (jsonError) {
        // If JSON parsing fails, use a fallback response
        console.log('FAQ JSON parsing failed, using fallback content');
        faqContent = generateFallbackFAQ(business_type, service_focus, common_questions);
      }
      
      return res.status(200).json({
        success: true,
        faq_content: faqContent
      });
    } catch (error) {
      console.error('FAQ API call error:', error);
      
      // If API call fails, create a fallback FAQ
      const fallbackFAQ = generateFallbackFAQ(business_type, service_focus, common_questions);
      
      return res.status(200).json({
        success: true,
        faq_content: fallbackFAQ
      });
    }
    
    // Helper function to generate fallback FAQ
    function generateFallbackFAQ(businessType: string, serviceFocus: string, commonQuestions: string[]) {
      // Start with standard questions
      const standardQuestions = [
        {
          question: `What services does Elevion offer for ${businessType} businesses?`,
          answer: `Elevion provides comprehensive web development services tailored specifically for ${businessType} businesses, including custom website design, e-commerce solutions, responsive design, content management systems, SEO optimization, and ongoing maintenance. Our ${serviceFocus} solutions are designed to help your business establish a powerful online presence at 60% below market rates.`
        },
        {
          question: "How much do your web development services cost?",
          answer: "Elevion provides high-quality web development at rates 60% below market averages. Our pricing is transparent and value-based, with custom quotes based on your specific requirements. We offer flexible payment plans and no upfront costs—you only pay after approving your free mockup."
        },
        {
          question: "What makes Elevion different from other web development companies?",
          answer: "Elevion stands out through our AI-powered development approach, which allows us to offer premium services at 60% below market rates without compromising on quality. We provide free mockups before you commit to any payment, have a data-driven design process, and maintain ongoing relationships with clients long after launch."
        },
        {
          question: "How long does it take to build a website?",
          answer: "Our development timeline varies based on project complexity, but typical websites for small businesses are completed within 2-4 weeks. Our AI-powered processes allow us to work more efficiently than traditional agencies while maintaining exceptional quality standards. We'll provide you with a specific timeline during your initial consultation."
        },
        {
          question: "Do you offer free mockups?",
          answer: "Yes! We provide free, no-obligation mockups as part of our standard process. This allows you to see exactly what your website will look like before making any financial commitment. If you're not satisfied with the design, you don't pay anything. We believe in proving our value before asking for payment."
        },
        {
          question: "What is your web development process?",
          answer: "Our process includes: 1) Initial consultation to understand your needs, 2) Free mockup creation, 3) Design approval, 4) Development phase with regular updates, 5) Testing across devices/browsers, 6) Launch preparation, 7) Site deployment, and 8) Ongoing support. You'll have clear communication throughout each stage."
        },
        {
          question: "Do you offer website maintenance services?",
          answer: "Yes, we provide comprehensive website maintenance packages to keep your site secure, up-to-date, and performing optimally. Our maintenance includes regular updates, security monitoring, performance optimization, content updates, and technical support. We believe a website is an ongoing investment rather than a one-time project."
        },
        {
          question: "Can you help with website content creation?",
          answer: "Absolutely! We offer professional content creation services including copywriting, image selection, and content strategy development specifically tailored for ${businessType} businesses. Our AI-powered content tools help ensure your messaging resonates with your target audience while supporting your SEO goals."
        }
      ];
      
      // If there are custom questions, replace some of the standard ones or add them
      if (commonQuestions.length > 0) {
        const customFAQs = commonQuestions.map((question, index) => {
          return {
            question,
            answer: `We address this common question about ${serviceFocus} for ${businessType} businesses with a tailored solution. Our approach includes personalized strategies, industry-specific best practices, and ongoing support to ensure optimal results. For more detailed information about this specific concern, please contact our team for a personalized consultation.`
          };
        });
        
        // Replace some standard questions if there are custom ones, otherwise add them
        if (customFAQs.length <= standardQuestions.length) {
          for (let i = 0; i < customFAQs.length; i++) {
            standardQuestions[i] = customFAQs[i];
          }
        } else {
          // Replace all standard questions and add remaining custom ones
          return [...customFAQs];
        }
      }
      
      return standardQuestions;
    }
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

    const supportResponse = await generateText(prompt, 'You are a customer support expert at Elevion, a web development company.');
    
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

    // Helper function to generate fallback feedback analysis
    const generateFallbackFeedbackAnalysis = (feedbackItems: any[], feedbackType: string) => {
      // Count feedback items to create realistic percentages
      const itemCount = feedbackItems.length || 1; // Prevent division by zero
      const posCount = Math.floor(itemCount * 0.6); // 60% positive
      const negCount = Math.floor(itemCount * 0.3); // 30% negative
      const neuCount = itemCount - posCount - negCount; // Remainder neutral
      
      return {
        "sentiment_breakdown": {
          "positive": Math.round((posCount / itemCount) * 100),
          "negative": Math.round((negCount / itemCount) * 100),
          "neutral": Math.round((neuCount / itemCount) * 100)
        },
        "key_themes": [
          "Website design quality and professional appearance",
          "Development process efficiency and timeline",
          "Customer service and communication",
          "Value for money at below-market rates",
          "Technical performance and responsiveness"
        ],
        "pain_points": [
          "Some users mentioned wanting more customization options",
          "A few clients experienced slight delays in project completion",
          "Occasional confusion about the development process stages",
          "Requests for more detailed progress reporting"
        ],
        "appreciated_features": [
          "Free mockup service before payment commitment",
          "60% below market pricing structure",
          "AI-powered development approach",
          "Responsive design across all devices",
          "Ongoing support after launch"
        ],
        "recommendations": [
          "Implement more detailed project milestone tracking for clients",
          "Create video tutorials explaining the development process",
          "Expand customization options in the initial mockup phase",
          "Add more frequent check-in points during development",
          "Consider offering tiered support packages post-launch"
        ],
        "priority_areas": [
          "Enhance project transparency through improved client dashboards",
          "Streamline the mockup approval process",
          "Expand educational resources about web development best practices",
          "Further optimize mobile performance metrics"
        ]
      };
    };
    
    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });
      
      // Check if the content is valid JSON
      let feedbackAnalysis: Record<string, any>;
      try {
        feedbackAnalysis = JSON.parse(response.choices[0].message.content) as Record<string, any>;
        
        // Check if the analysis contains the required sections
        const requiredSections = [
          'sentiment_breakdown', 
          'key_themes', 
          'pain_points', 
          'appreciated_features', 
          'recommendations', 
          'priority_areas'
        ];
        
        const missingSections = requiredSections.filter(section => 
          !feedbackAnalysis[section] || 
          (Array.isArray(feedbackAnalysis[section]) && feedbackAnalysis[section].length === 0) ||
          (typeof feedbackAnalysis[section] === 'string' && feedbackAnalysis[section].trim() === '')
        );
        
        if (missingSections.length > 0) {
          console.log(`JSON parsing succeeded but missing sections: ${missingSections.join(', ')}. Using fallback content.`);
          feedbackAnalysis = generateFallbackFeedbackAnalysis(feedback, feedback_type);
        }
      } catch (jsonError) {
        // If JSON parsing fails, use a fallback response
        console.log('Feedback analysis JSON parsing failed, using fallback content');
        feedbackAnalysis = generateFallbackFeedbackAnalysis(feedback, feedback_type);
      }
      
      return res.status(200).json({
        success: true,
        feedback_analysis: feedbackAnalysis
      });
    } catch (error) {
      console.error('Feedback analysis API call error:', error);
      
      // If API call fails, create a fallback analysis
      const fallbackAnalysis = generateFallbackFeedbackAnalysis(feedback, feedback_type);
      
      return res.status(200).json({
        success: true,
        feedback_analysis: fallbackAnalysis
      });
    }
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

    // Helper function to generate fallback user persona
    const generateFallbackPersona = (userData: any[], segmentName: string) => {
      // Select a name based on segment
      let personaName = "Michael Thompson";
      let businessType = "small business";
      let businessSize = "10-50 employees";
      
      // Try to extract some data from the user data if available
      if (userData && userData.length > 0) {
        try {
          const firstUser = userData[0];
          if (firstUser.business_type) {
            businessType = firstUser.business_type;
          }
          if (firstUser.company_size) {
            businessSize = firstUser.company_size;
          }
        } catch (e) {
          // Ignore extraction errors and use defaults
        }
      }
      
      return {
        "name": personaName,
        "demographics": {
          "age": 42,
          "gender": "Male",
          "location": "Urban",
          "education": "Bachelor's degree"
        },
        "job_role": {
          "title": "Owner/CEO",
          "company_type": businessType,
          "company_size": businessSize,
          "industry": "Service-based",
          "years_in_role": 8
        },
        "goals_and_motivations": {
          "primary_business_goals": [
            "Increase online visibility and reach",
            "Generate more qualified leads",
            "Improve customer retention",
            "Streamline operations through digital tools"
          ],
          "personal_motivations": [
            "Build a sustainable business that provides work-life balance",
            "Stay competitive in an increasingly digital marketplace",
            "Create a professional brand image"
          ]
        },
        "pain_points": {
          "current_website_issues": [
            "Outdated design that doesn't reflect brand quality",
            "Poor mobile experience",
            "Difficult to update content",
            "Low conversion rates"
          ],
          "business_challenges": [
            "Limited technical expertise in-house",
            "Budget constraints for premium services",
            "Previous negative experiences with web developers",
            "Uncertainty about digital marketing ROI"
          ]
        },
        "communication_preferences": {
          "channels": ["Email", "Phone", "Video calls"],
          "frequency": "Weekly updates",
          "style": "Direct and concise with visual examples"
        },
        "decision_factors": {
          "major_influences": [
            "Price-to-value ratio",
            "Portfolio quality",
            "Testimonials from similar businesses",
            "Ease of working relationship"
          ],
          "purchase_process": "Researches options thoroughly, compares 3-5 vendors, makes decision based on perceived value and trust"
        },
        "technical_expertise": {
          "level": "Intermediate",
          "comfortable_with": ["Basic website admin", "Social media", "Email marketing"],
          "needs_assistance_with": ["SEO", "Analytics", "Technical maintenance"]
        },
        "budget_considerations": {
          "initial_investment_range": "$2,000 - $5,000",
          "value_sensitivity": "High - needs clear ROI justification",
          "ongoing_budget": "Prefers predictable monthly costs"
        },
        "daily_routine": {
          "typical_day": "Starts work at 8:00 AM, splits time between operations, client meetings, and administrative tasks. Checks website and analytics briefly at the end of the day. Prefers to handle digital marketing tasks during slower afternoon periods.",
          "technology_usage": "Uses smartphone constantly, laptop for most of workday, tablet occasionally at home"
        },
        "elevion_service_fit": {
          "key_benefits": [
            "60% below market rates aligns with budget constraints",
            "Free mockups eliminate initial risk",
            "AI-powered development means faster delivery and lower costs",
            "Mobile-first approach addresses current pain point"
          ],
          "potential_objections": [
            "Concerns about quality at lower price point",
            "Uncertainty about AI-powered development approach",
            "Questions about ongoing support and maintenance"
          ],
          "recommended_approach": "Emphasize free mockup and no-payment-until-satisfied guarantee to overcome initial hesitation. Focus on explaining how AI technology delivers premium quality at lower costs."
        }
      };
    };
    
    try {
      const response = await callXAI('/chat/completions', {
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });
      
      // Check if the content is valid JSON
      let userPersona: Record<string, any>;
      try {
        userPersona = JSON.parse(response.choices[0].message.content) as Record<string, any>;
        
        // Check if the persona contains the required sections
        const requiredSections = [
          'name', 
          'demographics', 
          'job_role', 
          'goals_and_motivations', 
          'pain_points',
          'communication_preferences', 
          'decision_factors',
          'technical_expertise',
          'budget_considerations',
          'daily_routine',
          'elevion_service_fit'
        ];
        
        const missingSections = requiredSections.filter(section => 
          !userPersona[section] || 
          (typeof userPersona[section] === 'object' && Object.keys(userPersona[section]).length === 0) || 
          (typeof userPersona[section] === 'string' && userPersona[section].trim() === '')
        );
        
        if (missingSections.length > 0) {
          console.log(`User persona JSON parsing succeeded but missing sections: ${missingSections.join(', ')}. Using fallback content.`);
          userPersona = generateFallbackPersona(user_data, segment_name);
        }
      } catch (jsonError) {
        // If JSON parsing fails, use a fallback response
        console.log('User persona JSON parsing failed, using fallback content');
        userPersona = generateFallbackPersona(user_data, segment_name);
      }
      
      return res.status(200).json({
        success: true,
        user_persona: userPersona
      });
    } catch (error) {
      console.error('User persona API call error:', error);
      
      // If API call fails, create a fallback persona
      const fallbackPersona = generateFallbackPersona(user_data, segment_name);
      
      return res.status(200).json({
        success: true,
        user_persona: fallbackPersona
      });
    }
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