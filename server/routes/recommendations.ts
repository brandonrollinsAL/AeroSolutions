import express from 'express';
import { db } from '../db';
import { callXAI } from '../utils/xaiClient';

// Configure API request timeout
const API_TIMEOUT = 30000; // 30 seconds timeout for longer requests

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
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT);
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      timeoutPromise
    ]);
    
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
    // Create a simpler, more focused prompt to reduce response time
    const prompt = `Recommend top 10 essential website features for a ${businessType} 
      in the ${industry || 'general'} industry with these objectives: ${objectives.slice(0, 3).join(', ')}.
      
      Format as JSON with this structure:
      {
        "core_features": [
          {
            "name": "Feature name",
            "benefit": "Brief benefit explanation",
            "priority": "high/medium/low"
          }
        ],
        "additional_features": [
          {
            "name": "Feature name", 
            "benefit": "Brief benefit explanation"
          }
        ]
      }`;
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT);
    });
    
    // Use a smaller model for faster response time
    const response = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini', // Use mini model for faster response
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      timeoutPromise
    ]);
    
    const content = JSON.parse(response.choices[0].message.content);
    
    // Transform the simpler response format into the expected format
    const transformedResponse = {
      must_have_features: content.core_features
        .filter(f => f.priority === 'high')
        .map(f => ({
          name: f.name,
          benefit: f.benefit,
          complexity: "Low to Medium"
        })),
      recommended_features: content.core_features
        .filter(f => f.priority === 'medium')
        .map(f => ({
          name: f.name,
          benefit: f.benefit,
          complexity: "Medium"
        })),
      nice_to_have_features: content.core_features
        .filter(f => f.priority === 'low')
        .map(f => ({
          name: f.name,
          benefit: f.benefit,
          complexity: "Medium"
        })),
      innovative_differentiators: content.additional_features
        .map(f => ({
          name: f.name,
          benefit: f.benefit,
          complexity: "Medium to High"
        }))
    };
    
    res.json({ 
      success: true, 
      features: transformedResponse
    });
  } catch (error: any) {
    console.error('Feature recommendations failed:', error);
    
    // Industry-specific fallback data for better user experience
    const industrySpecificFeatures = {
      'food & beverage': {
        must_have_features: [
          {
            name: "Online Ordering System",
            benefit: "Allows customers to place orders directly from your website, increasing convenience and sales",
            complexity: "Medium"
          },
          {
            name: "Mobile-Responsive Menu",
            benefit: "Ensures your menu is easily viewable on all devices, critical for on-the-go diners",
            complexity: "Low to Medium"
          },
          {
            name: "Reservation System",
            benefit: "Enables customers to book tables online, reducing phone calls and improving table management",
            complexity: "Medium"
          }
        ],
        recommended_features: [
          {
            name: "Local SEO Optimization",
            benefit: "Improves visibility in local search results to help nearby customers find your restaurant",
            complexity: "Medium"
          },
          {
            name: "Customer Reviews Integration",
            benefit: "Showcases positive experiences to build trust with potential new customers",
            complexity: "Low"
          }
        ],
        nice_to_have_features: [
          {
            name: "Loyalty Program Portal",
            benefit: "Encourages repeat visits through rewards and special offers",
            complexity: "Medium to High"
          }
        ],
        innovative_differentiators: [
          {
            name: "Virtual Restaurant Tour",
            benefit: "Gives potential customers a feel for your atmosphere before they visit",
            complexity: "Medium to High"
          }
        ]
      }
    };
    
    // Use industry-specific fallback if available, otherwise use generic
    const fallback = industry && industrySpecificFeatures[industry.toLowerCase()] ? 
      industrySpecificFeatures[industry.toLowerCase()] : 
      {
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
      };
    
    res.status(500).json({ 
      success: false, 
      message: 'Feature recommendations failed', 
      error: error.message,
      fallback: fallback
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
    // Create a simpler, more focused prompt to reduce response time
    const prompt = `Recommend core tech stack components for a ${project_type} project with requirements: ${requirements.slice(0, 3).join(', ')}.
      Budget level: ${budget_level || 'Moderate'}.
      
      Format as JSON with this structure:
      {
        "frontend": {
          "name": "technology name",
          "reason": "brief reason"
        },
        "backend": {
          "name": "technology name",
          "reason": "brief reason"
        },
        "database": {
          "name": "technology name",
          "reason": "brief reason"
        },
        "hosting": {
          "name": "technology name",
          "reason": "brief reason"
        }
      }`;
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT);
    });
    
    // Use a smaller model for faster response time
    const response = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini', // Use mini model for faster response
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      timeoutPromise
    ]);
    
    const content = JSON.parse(response.choices[0].message.content);
    
    // Transform the simpler response format into the expected format
    const transformedResponse = {
      frontend: {
        primary: content.frontend.name,
        reason: content.frontend.reason,
        alternatives: getAlternativesFor(content.frontend.name)
      },
      backend: {
        primary: content.backend.name,
        reason: content.backend.reason,
        alternatives: getAlternativesFor(content.backend.name)
      },
      database: {
        primary: content.database.name,
        reason: content.database.reason,
        alternatives: getAlternativesFor(content.database.name)
      },
      hosting: {
        primary: content.hosting.name,
        reason: content.hosting.reason,
        alternatives: getAlternativesFor(content.hosting.name)
      },
      additional_services: getAdditionalServices(project_type, requirements)
    };
    
    res.json({ 
      success: true, 
      tech_stack: transformedResponse
    });
  } catch (error: any) {
    console.error('Tech stack recommendations failed:', error);
    
    // Project-type specific fallback data for better user experience
    const projectSpecificStacks = {
      'ecommerce': {
        frontend: {
          primary: "React.js with Next.js",
          reason: "Provides excellent performance with server-side rendering for better SEO, which is crucial for ecommerce",
          alternatives: ["Vue.js with Nuxt", "Angular"]
        },
        backend: {
          primary: "Node.js with Express",
          reason: "Fast API response times and excellent integration with payment gateways",
          alternatives: ["Python with Django", "PHP with Laravel"]
        },
        database: {
          primary: "PostgreSQL",
          reason: "Robust relational database with excellent support for complex product relationships and inventory management",
          alternatives: ["MongoDB", "MySQL"]
        },
        hosting: {
          primary: "AWS",
          reason: "Scalable infrastructure that can handle traffic spikes during sales events",
          alternatives: ["Shopify", "Vercel with AWS"]
        },
        additional_services: {
          caching: "Redis",
          search: "Elasticsearch",
          payment: "Stripe",
          cdn: "Cloudflare"
        }
      }
    };
    
    // Use project-specific fallback if available, otherwise use generic
    const fallback = project_type && projectSpecificStacks[project_type.toLowerCase()] ? 
      projectSpecificStacks[project_type.toLowerCase()] : 
      {
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
      };
    
    res.status(500).json({ 
      success: false, 
      message: 'Tech stack recommendations failed', 
      error: error.message,
      fallback: fallback
    });
  }
});

/**
 * Helper function to get alternative technologies based on primary choice
 */
function getAlternativesFor(technology: string): string[] {
  const alternativesMap: Record<string, string[]> = {
    'React': ['Vue.js', 'Angular', 'Svelte'],
    'React.js': ['Vue.js', 'Angular', 'Svelte'],
    'Next.js': ['Nuxt.js', 'Gatsby', 'Remix'],
    'Vue': ['React', 'Angular', 'Svelte'],
    'Vue.js': ['React', 'Angular', 'Svelte'],
    'Angular': ['React', 'Vue.js', 'Svelte'],
    'Node': ['Python', 'PHP', 'Ruby', 'Java'],
    'Node.js': ['Python', 'PHP', 'Ruby', 'Java'],
    'Express': ['Fastify', 'Koa', 'NestJS'],
    'Django': ['Flask', 'FastAPI', 'Laravel'],
    'Laravel': ['Django', 'Ruby on Rails', 'ASP.NET'],
    'PostgreSQL': ['MySQL', 'MongoDB', 'Microsoft SQL Server'],
    'MySQL': ['PostgreSQL', 'MariaDB', 'SQLite'],
    'MongoDB': ['PostgreSQL', 'MySQL', 'Firestore'],
    'AWS': ['Google Cloud Platform', 'Microsoft Azure', 'Digital Ocean'],
    'Vercel': ['Netlify', 'Heroku', 'AWS Amplify'],
    'Heroku': ['Render', 'Railway', 'DigitalOcean App Platform']
  };
  
  // Check for exact match first
  if (alternativesMap[technology]) {
    return alternativesMap[technology];
  }
  
  // Look for partial matches
  const matchingKey = Object.keys(alternativesMap).find(key => 
    technology.toLowerCase().includes(key.toLowerCase())
  );
  
  return matchingKey ? 
    alternativesMap[matchingKey] : 
    ['Alternative option 1', 'Alternative option 2'];
}

/**
 * Helper function to suggest additional services based on project type and requirements
 */
function getAdditionalServices(projectType: string, requirements: string[]): Record<string, string> {
  const req = requirements.map(r => r.toLowerCase());
  
  const services: Record<string, string> = {
    caching: "Redis"
  };
  
  // Add services based on project type
  if (projectType.toLowerCase().includes('ecommerce')) {
    services.payment = "Stripe";
    services.search = "Elasticsearch";
    services.inventory = "Custom inventory management system";
  } else if (projectType.toLowerCase().includes('blog') || projectType.toLowerCase().includes('content')) {
    services.cms = "Contentful";
    services.analytics = "Google Analytics";
  } else if (projectType.toLowerCase().includes('social') || projectType.toLowerCase().includes('community')) {
    services.realtime = "Socket.io";
    services.storage = "AWS S3";
    services.analytics = "Mixpanel";
  }
  
  // Add services based on requirements
  if (req.some(r => r.includes('search') || r.includes('find'))) {
    services.search = "Elasticsearch";
  }
  if (req.some(r => r.includes('image') || r.includes('media') || r.includes('upload'))) {
    services.storage = "AWS S3";
  }
  if (req.some(r => r.includes('mail') || r.includes('email') || r.includes('newsletter'))) {
    services.email = "SendGrid";
  }
  if (req.some(r => r.includes('auth') || r.includes('login') || r.includes('user'))) {
    services.authentication = "Auth0";
  }
  
  return services;
}

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
    // Create a simpler, more focused prompt to reduce response time
    const prompt = `Create a content plan for a ${business_type} in the ${industry || 'general'} 
      industry with these top goals: ${goals.slice(0, 2).join(', ')}. 
      Target audience: ${target_audience}.
      Timeline: ${timeline}.
      
      Format as JSON with this structure:
      {
        "themes": [
          {"name": "theme name", "topics": ["topic1", "topic2"]}
        ],
        "content_formats": [
          {"type": "format name", "frequency": "how often"}
        ],
        "channels": ["channel1", "channel2"],
        "metrics": ["metric1", "metric2"]
      }`;
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT);
    });
    
    // Use a smaller model for faster response time
    const response = await Promise.race([
      callXAI('/chat/completions', {
        model: 'grok-3-mini', // Use mini model for faster response
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
      timeoutPromise
    ]);
    
    const content = JSON.parse(response.choices[0].message.content);
    
    // Transform the simpler response format into the expected format
    const transformedResponse = {
      content_themes: content.themes.map((theme: any) => ({
        theme: theme.name,
        topics: theme.topics
      })),
      content_types: content.content_formats.map((format: any) => ({
        type: format.type,
        frequency: format.frequency,
        length: format.type.toLowerCase().includes('blog') ? "800-1500 words" : 
                format.type.toLowerCase().includes('video') ? "2-5 minutes" : 
                format.type.toLowerCase().includes('social') ? "Short-form" : "Variable"
      })),
      distribution_channels: content.channels,
      success_metrics: content.metrics
    };
    
    res.json({ 
      success: true, 
      content_plan: transformedResponse
    });
  } catch (error: any) {
    console.error('Content plan recommendations failed:', error);
    
    // Industry-specific fallback data for better user experience
    const industrySpecificPlans: Record<string, any> = {
      'food & beverage': {
        content_themes: [
          {
            theme: "Culinary Expertise",
            topics: ["Signature dishes", "Cooking techniques", "Ingredient spotlights"]
          },
          {
            theme: "Customer Experience",
            topics: ["Dining atmosphere", "Service highlights", "Customer stories"]
          },
          {
            theme: "Local Food Culture",
            topics: ["Local ingredients", "Food events", "Community partnerships"]
          }
        ],
        content_types: [
          {
            type: "Food photography posts",
            frequency: "3-4 times per week",
            length: "Visual with short descriptions"
          },
          {
            type: "Recipe blogs",
            frequency: "Weekly",
            length: "800-1200 words with photos"
          },
          {
            type: "Chef/Staff spotlights",
            frequency: "Monthly",
            length: "Short-form videos and stories"
          }
        ],
        distribution_channels: [
          "Instagram",
          "Facebook",
          "Restaurant website",
          "Email newsletter",
          "Local food apps"
        ],
        success_metrics: [
          "Social media engagement",
          "Website traffic",
          "Online reservations",
          "Email click-through rates",
          "Customer mentions and tags"
        ]
      },
      'web development': {
        content_themes: [
          {
            theme: "Technical Expertise",
            topics: ["Development best practices", "Technology trends", "Case studies"]
          },
          {
            theme: "Business Value",
            topics: ["ROI of web development", "Digital transformation", "Success stories"]
          },
          {
            theme: "Educational Content",
            topics: ["How-to guides", "Technology comparisons", "Industry reports"]
          }
        ],
        content_types: [
          {
            type: "Blog posts",
            frequency: "Weekly",
            length: "1000-1500 words with code examples"
          },
          {
            type: "Case study articles",
            frequency: "Monthly",
            length: "1500-2000 words with visuals"
          },
          {
            type: "Technical newsletters",
            frequency: "Bi-weekly",
            length: "5-7 minute read with links"
          }
        ],
        distribution_channels: [
          "Company website/blog",
          "LinkedIn",
          "Twitter/X",
          "Developer forums",
          "Email newsletter"
        ],
        success_metrics: [
          "Website traffic",
          "Time on page",
          "Lead form submissions",
          "Content downloads",
          "Social shares"
        ]
      }
    };
    
    // Use industry-specific fallback if available, otherwise use generic
    const fallback = industry && industrySpecificPlans[industry.toLowerCase()] ? 
      industrySpecificPlans[industry.toLowerCase()] : 
      {
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
            platforms: ["LinkedIn", "Twitter/X", "Facebook"]
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
      };
    
    res.status(500).json({ 
      success: false, 
      message: 'Content plan recommendations failed', 
      error: error.message,
      fallback: fallback
    });
  }
});

export default router;