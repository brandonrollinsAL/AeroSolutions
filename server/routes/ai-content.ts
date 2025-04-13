import express from 'express';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * Generate blog post ideas endpoint
 * Uses xAI to generate blog post topic ideas based on keywords and audience
 */
router.post('/blog-ideas', async (req, res) => {
  const { keywords, audience, industry, count = 5 } = req.body;
  
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Keywords array is required' 
    });
  }
  
  try {
    const prompt = `Generate ${count} engaging blog post ideas for a ${industry || 'web development'} 
      company targeting ${audience || 'small business owners'}. Include compelling headlines, 
      brief descriptions (2-3 sentences), and target keywords. The blog should incorporate these 
      keywords: ${keywords.join(', ')}. Format the response as JSON with the following structure:
      {
        "ideas": [
          {
            "headline": "Compelling headline here",
            "description": "Brief 2-3 sentence description",
            "keywords": ["keyword1", "keyword2"],
            "estimated_word_count": 1200
          }
        ]
      }`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      ideas: content.ideas
    });
  } catch (error: any) {
    console.error('Blog ideas generation failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Blog ideas generation failed', 
      error: error.message,
      fallback: {
        ideas: [
          {
            headline: "5 Essential Web Design Elements Every Small Business Website Needs",
            description: "Discover the key design elements that can transform your small business website from ordinary to extraordinary. Learn how professional layouts, responsive design, and strategic CTAs can drive conversions and enhance user experience.",
            keywords: ["web design", "small business website", "user experience"],
            estimated_word_count: 1200
          },
          {
            headline: "How to Choose the Right Web Development Partner for Your Small Business",
            description: "Finding the perfect web development partner can be challenging. This guide walks you through the essential questions to ask, red flags to watch for, and how to evaluate portfolios to ensure you select a developer who understands your unique business needs.",
            keywords: ["web development", "small business", "website partner"],
            estimated_word_count: 1500
          },
          {
            headline: "The ROI of Professional Web Development: Why It's Worth the Investment",
            description: "Explore the tangible and intangible returns of investing in professional web development for your small business. We break down the financial benefits, time savings, and competitive advantages that come with a properly developed website.",
            keywords: ["web development ROI", "website investment", "small business growth"],
            estimated_word_count: 1300
          }
        ]
      }
    });
  }
});

/**
 * Generate product descriptions endpoint
 * Uses xAI to create compelling product descriptions
 */
router.post('/product-description', async (req, res) => {
  const { 
    productName, 
    features, 
    benefits, 
    targetAudience, 
    tone = 'professional',
    wordCount = 150
  } = req.body;
  
  if (!productName || !features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Product name and features array are required' 
    });
  }
  
  try {
    const prompt = `Create a compelling ${wordCount}-word product description for "${productName}". 
      Target audience: ${targetAudience || 'small business owners'}. 
      Tone: ${tone}.
      Features: ${features.join(', ')}. 
      Benefits: ${benefits ? benefits.join(', ') : 'to be determined from features'}.
      Make the description engaging, highlight unique selling points, and include a call to action.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }]
    });
    
    res.json({ 
      success: true, 
      description: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Product description generation failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Product description generation failed', 
      error: error.message,
      fallback: {
        description: `${productName} is designed specifically for ${targetAudience || 'small business owners'} who need a reliable web solution. Featuring ${features.slice(0, 3).join(', ')}, this product streamlines your online presence while saving you time and resources. With an intuitive interface and professional design, ${productName} helps you stand out from competitors and attract more customers. Try it today and transform your digital experience.`
      }
    });
  }
});

/**
 * Generate social media content endpoint
 * Creates platform-specific social content based on key messages
 */
router.post('/social-content', async (req, res) => {
  const { 
    keyMessages, 
    platforms = ['twitter', 'linkedin', 'facebook'], 
    tone = 'professional',
    industry
  } = req.body;
  
  if (!keyMessages || !Array.isArray(keyMessages) || keyMessages.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Key messages array is required' 
    });
  }
  
  try {
    const prompt = `Create social media posts for ${platforms.join(', ')} based on these key messages: 
      ${keyMessages.join('; ')}. 
      Industry: ${industry || 'web development'}.
      Tone: ${tone}.
      Tailor each post to the specific platform, including appropriate hashtags and formatting.
      Return the response as JSON with this structure:
      {
        "posts": [
          {
            "platform": "platform name",
            "content": "post content",
            "hashtags": ["tag1", "tag2"]
          }
        ]
      }`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      posts: content.posts
    });
  } catch (error: any) {
    console.error('Social content generation failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Social content generation failed', 
      error: error.message,
      fallback: {
        posts: platforms.map(platform => {
          const post = {
            platform,
            content: `Looking to enhance your online presence? Our ${industry || 'web development'} solutions help small businesses stand out in a crowded market. ${keyMessages[0] || 'Contact us today to learn more!'}`,
            hashtags: [`#${industry?.replace(/\s+/g, '') || 'WebDevelopment'}`, '#SmallBusiness', '#DigitalSolutions']
          };
          
          // Platform-specific adjustments
          if (platform === 'twitter') {
            post.content = post.content.substring(0, 240);
          } else if (platform === 'linkedin') {
            post.content += ' What challenges is your business facing online?';
          }
          
          return post;
        })
      }
    });
  }
});

/**
 * Generate email template endpoint
 * Creates marketing or transactional email templates
 */
router.post('/email-template', async (req, res) => {
  const { 
    type = 'marketing', 
    subject,
    keyPoints, 
    audience,
    callToAction,
    companyName = 'Elevion'
  } = req.body;
  
  if (!keyPoints || !Array.isArray(keyPoints) || keyPoints.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Key points array is required' 
    });
  }
  
  try {
    const prompt = `Create an ${type} email template for ${audience || 'small business owners'}.
      Subject line: ${subject || 'suggest an engaging subject line'}.
      Company: ${companyName}.
      Key points to include: ${keyPoints.join('; ')}.
      Call to action: ${callToAction || 'Schedule a consultation'}.
      Include appropriate greeting, body with key points, call to action, and signature.
      Format the response with clear sections for subject line and email body.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }]
    });
    
    // Parse the response to extract subject and body
    const content = response.choices[0].message.content;
    let emailSubject = subject || '';
    let emailBody = content;
    
    // Try to extract subject if it exists in the response
    const subjectMatch = content.match(/Subject(?:\s+line)?:\s*(.*?)(?:\n|$)/i);
    if (subjectMatch && subjectMatch[1]) {
      emailSubject = subjectMatch[1].trim();
      emailBody = content.replace(subjectMatch[0], '').trim();
    }
    
    res.json({ 
      success: true, 
      email: {
        subject: emailSubject,
        body: emailBody
      }
    });
  } catch (error: any) {
    console.error('Email template generation failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Email template generation failed', 
      error: error.message,
      fallback: {
        email: {
          subject: subject || `Transform Your Business with ${companyName}'s Web Solutions`,
          body: `Dear ${audience || 'Business Owner'},

We hope this email finds you well. At ${companyName}, we understand the challenges that small businesses face in establishing a strong online presence.

${keyPoints.map(point => `• ${point}`).join('\n')}

We'd love to discuss how we can help you achieve your business goals through our customized web solutions.

${callToAction || 'Schedule a free consultation today by replying to this email or calling us at (555) 123-4567.'}

Best regards,
The ${companyName} Team`
        }
      }
    });
  }
});

export default router;