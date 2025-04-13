import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * Service recommendations endpoint
 * Suggests appropriate web services based on business needs
 */
router.post('/services', async (req, res) => {
  const { 
    businessType, 
    goals, 
    currentWebsite,
    budget,
    timeframe,
    features = []
  } = req.body;
  
  if (!businessType || !goals || !Array.isArray(goals)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Business type and goals are required' 
    });
  }
  
  try {
    const prompt = `Based on the following information, recommend the best web development services 
      and platform options for this small business. Include why each recommendation fits their needs 
      and a suggested implementation timeline.
      
      Business Type: ${businessType}
      Business Goals: ${goals.join(', ')}
      Current Website Status: ${currentWebsite || 'Unknown'}
      Budget Range: ${budget || 'Unspecified'}
      Desired Timeframe: ${timeframe || 'Unspecified'}
      Requested Features: ${features.length > 0 ? features.join(', ') : 'None specified'}
      
      Format the response as JSON with this structure:
      {
        "primary_recommendation": {
          "service": "service name",
          "platform": "platform name",
          "rationale": "why this is recommended",
          "timeline": "estimated timeline",
          "price_estimate": "price range"
        },
        "alternative_options": [
          {
            "service": "alternative service",
            "platform": "platform name",
            "pros": ["pro1", "pro2"],
            "cons": ["con1", "con2"],
            "price_estimate": "price range"
          }
        ],
        "additional_services": ["service1", "service2"]
      }`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      recommendations: content
    });
  } catch (error: any) {
    console.error('Service recommendations failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Service recommendations failed', 
      error: error.message,
      fallback: {
        primary_recommendation: {
          service: businessType.toLowerCase().includes('e-commerce') ? 'EcomPro System' : 'WebCraft Platform',
          platform: businessType.toLowerCase().includes('e-commerce') ? 'EcomPro' : 'WebCraft',
          rationale: `Based on your ${businessType} business type and goals including ${goals[0]}, this solution will provide the best foundation for your online presence.`,
          timeline: timeframe || '4-6 weeks',
          price_estimate: budget || '$2,500 - $5,000'
        },
        alternative_options: [
          {
            service: 'ContentHub Management',
            platform: 'ContentHub',
            pros: ['Easy content updates', 'SEO optimization', 'Blog functionality'],
            cons: ['Less custom functionality', 'May require additional development for complex features'],
            price_estimate: '$1,800 - $3,500'
          }
        ],
        additional_services: features.includes('analytics') ? ['AnalyticEdge Solution'] : ['SEO Optimization', 'Content Creation']
      }
    });
  }
});

/**
 * Feature recommendations endpoint
 * Suggests website features based on business type and objectives
 */
router.post('/features', async (req, res) => {
  const { 
    businessType, 
    objectives, 
    industry,
    target_audience
  } = req.body;
  
  if (!businessType || !objectives || !Array.isArray(objectives)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Business type and objectives are required' 
    });
  }
  
  try {
    const prompt = `Recommend essential website features and functionality for a ${businessType} 
      in the ${industry || 'general'} industry. Their main business objectives are: ${objectives.join(', ')}.
      Their target audience is: ${target_audience || 'general consumers'}.
      
      Provide recommendations in these categories:
      1. Must-have features
      2. Recommended features
      3. Nice-to-have features
      4. Innovative differentiators
      
      For each feature, include a brief explanation of its benefit and relative implementation complexity.
      Format the response as JSON.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      features: content
    });
  } catch (error: any) {
    console.error('Feature recommendations failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Feature recommendations failed', 
      error: error.message,
      fallback: {
        must_have_features: [
          {
            name: "Mobile-Responsive Design",
            benefit: "Ensures your website works well on all devices, which is critical as mobile traffic continues to increase",
            complexity: "Low to Medium"
          },
          {
            name: "Contact Form",
            benefit: "Provides a direct way for potential customers to reach you",
            complexity: "Low"
          },
          {
            name: "About Us Page",
            benefit: "Builds trust and helps visitors connect with your brand story",
            complexity: "Low"
          }
        ],
        recommended_features: [
          {
            name: "Newsletter Signup",
            benefit: "Helps build your email list for ongoing marketing",
            complexity: "Low"
          },
          {
            name: "Testimonials Section",
            benefit: "Leverages social proof to build credibility",
            complexity: "Low"
          }
        ],
        nice_to_have_features: [
          {
            name: "Live Chat",
            benefit: "Provides immediate assistance to visitors, potentially increasing conversions",
            complexity: "Medium"
          }
        ],
        innovative_differentiators: [
          {
            name: "Interactive Product Configurator",
            benefit: "Allows customers to customize products to their specific needs",
            complexity: "High"
          }
        ]
      }
    });
  }
});

/**
 * Technology stack recommendations endpoint
 * Suggests appropriate tech stack based on project requirements
 */
router.post('/tech-stack', async (req, res) => {
  const { 
    project_type, 
    requirements, 
    scale,
    budget_level,
    maintenance_preference,
    future_scalability
  } = req.body;
  
  if (!project_type || !requirements || !Array.isArray(requirements)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Project type and requirements are required' 
    });
  }
  
  try {
    const prompt = `Recommend an optimal technology stack for a ${project_type} project with the 
      following requirements: ${requirements.join(', ')}.
      
      Additional considerations:
      Scale: ${scale || 'Medium'}
      Budget Level: ${budget_level || 'Moderate'}
      Maintenance Preference: ${maintenance_preference || 'Balanced'}
      Future Scalability Needs: ${future_scalability || 'Moderate growth expected'}
      
      For each technology component, explain why it's recommended and provide alternatives.
      Components should include frontend, backend, database, hosting, and any additional services.
      Format the response as JSON.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      tech_stack: content
    });
  } catch (error: any) {
    console.error('Tech stack recommendations failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Tech stack recommendations failed', 
      error: error.message,
      fallback: {
        frontend: {
          primary: "React.js",
          reason: "Offers excellent performance, component reusability, and has a large ecosystem of libraries",
          alternatives: ["Vue.js", "Angular"]
        },
        backend: {
          primary: "Node.js with Express",
          reason: "JavaScript across the stack simplifies development and hiring; good balance of performance and development speed",
          alternatives: ["Python with Django", "PHP with Laravel"]
        },
        database: {
          primary: "PostgreSQL",
          reason: "Robust relational database with excellent support for complex queries and data integrity",
          alternatives: ["MongoDB", "MySQL"]
        },
        hosting: {
          primary: "AWS",
          reason: "Comprehensive cloud platform with extensive services that can scale with your business",
          alternatives: ["Digital Ocean", "Heroku"]
        },
        additional_services: {
          caching: "Redis",
          search: "Elasticsearch",
          media_storage: "AWS S3"
        }
      }
    });
  }
});

/**
 * Content plan recommendations endpoint
 * Suggests content strategy based on business goals
 */
router.post('/content-plan', async (req, res) => {
  const { 
    business_type, 
    goals, 
    target_audience,
    industry,
    timeline = '3 months'
  } = req.body;
  
  if (!business_type || !goals || !Array.isArray(goals) || !target_audience) {
    return res.status(400).json({ 
      success: false, 
      message: 'Business type, goals, and target audience are required' 
    });
  }
  
  try {
    const prompt = `Create a strategic content plan for a ${business_type} in the ${industry || 'general'} 
      industry. Their business goals are: ${goals.join(', ')}. Their target audience is: ${target_audience}.
      
      The content plan should cover a ${timeline} period and include:
      1. Content themes and topics
      2. Content types (blog posts, videos, infographics, etc.)
      3. Publishing frequency
      4. Distribution channels
      5. KPIs to track success
      
      Format the response as JSON with clear sections for each component of the plan.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      content_plan: content
    });
  } catch (error: any) {
    console.error('Content plan recommendations failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Content plan recommendations failed', 
      error: error.message,
      fallback: {
        content_themes: [
          {
            theme: "Industry Expertise",
            topics: ["Latest trends", "Best practices", "Case studies"]
          },
          {
            theme: "Problem-Solution Content",
            topics: ["Common challenges", "How-to guides", "Tips and tricks"]
          },
          {
            theme: "Behind the Scenes",
            topics: ["Company culture", "Process insights", "Team spotlights"]
          }
        ],
        content_types: [
          {
            type: "Blog posts",
            frequency: "Weekly",
            length: "800-1200 words"
          },
          {
            type: "Social media posts",
            frequency: "3-5 times per week",
            platforms: ["LinkedIn", "Twitter", "Facebook"]
          },
          {
            type: "Email newsletter",
            frequency: "Bi-weekly",
            focus: "Industry insights and company updates"
          }
        ],
        distribution_channels: [
          "Company website/blog",
          "Email list",
          "Social media platforms",
          "Industry forums and communities"
        ],
        success_metrics: [
          "Website traffic",
          "Time on page",
          "Social shares",
          "Email open and click rates",
          "Lead generation"
        ]
      }
    });
  }
});

export default router;