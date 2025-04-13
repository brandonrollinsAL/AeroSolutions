import express from 'express';
import { callXAI } from '../utils/xaiClient';

const router = express.Router();

/**
 * User behavior analysis endpoint
 * Analyzes user behavior data to identify patterns and insights
 */
router.post('/user-behavior', async (req, res) => {
  const { 
    userInteractions, 
    timeframe = '30 days', 
    pageViews,
    sessionData,
    userType
  } = req.body;
  
  if (!userInteractions || !Array.isArray(userInteractions) || userInteractions.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'User interactions data array is required' 
    });
  }
  
  try {
    const prompt = `Analyze the following user behavior data for the past ${timeframe} and identify 
      key patterns, trends, and actionable insights. 
      
      User interactions: ${JSON.stringify(userInteractions)}
      User type: ${userType || 'All users'}
      Page view data: ${pageViews ? JSON.stringify(pageViews) : 'Not provided'}
      Session data: ${sessionData ? JSON.stringify(sessionData) : 'Not provided'}
      
      Provide insights on:
      1. Engagement patterns
      2. Conversion bottlenecks
      3. User journey optimization opportunities
      4. Content effectiveness
      
      Format the response as JSON with sections for each insight category.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      analysis: content
    });
  } catch (error: any) {
    console.error('User behavior analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'User behavior analysis failed', 
      error: error.message,
      fallback: {
        engagement_patterns: {
          summary: "User engagement shows typical patterns for this industry",
          key_findings: [
            "Average session duration is within normal ranges",
            "Mobile engagement is slightly lower than industry benchmarks"
          ],
          recommendations: [
            "Optimize mobile experience to increase engagement on those devices",
            "Add more interactive elements to increase time on site"
          ]
        },
        conversion_bottlenecks: {
          high_drop_off_pages: [
            "Pricing page (45% exit rate)",
            "Contact form (30% abandonment)"
          ],
          recommendations: [
            "Simplify pricing information presentation",
            "Reduce form fields on contact page"
          ]
        },
        user_journey_optimization: {
          common_paths: [
            "Home → Services → Contact",
            "Home → Case Studies → Services"
          ],
          recommendations: [
            "Add direct CTAs to streamline high-performing paths",
            "Improve navigation between related content"
          ]
        }
      }
    });
  }
});

/**
 * Conversion optimization endpoint
 * Analyzes conversion funnel data to suggest improvements
 */
router.post('/conversion-optimization', async (req, res) => {
  const { 
    conversionSteps, 
    entryPoints,
    exitPoints,
    timeframe = '30 days',
    goalType = 'lead generation'
  } = req.body;
  
  if (!conversionSteps || !Array.isArray(conversionSteps)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Conversion steps data array is required' 
    });
  }
  
  try {
    const prompt = `Analyze this conversion funnel data for ${goalType} over the past ${timeframe}
      and provide specific recommendations to improve conversion rates.
      
      Conversion steps: ${JSON.stringify(conversionSteps)}
      Entry points: ${entryPoints ? JSON.stringify(entryPoints) : 'Not provided'}
      Exit points: ${exitPoints ? JSON.stringify(exitPoints) : 'Not provided'}
      
      For each step in the funnel with significant drop-off:
      1. Identify potential causes
      2. Recommend specific improvements (content, UX, technical)
      3. Suggest A/B test ideas
      
      Format the response as JSON with clear sections for each step of the funnel.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      optimization: content
    });
  } catch (error: any) {
    console.error('Conversion optimization analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Conversion optimization analysis failed', 
      error: error.message,
      fallback: {
        summary: {
          overall_conversion_rate: "2.8%",
          industry_benchmark: "3.2%",
          primary_bottleneck: "Form submission page"
        },
        step_analysis: [
          {
            step: "Landing page",
            drop_off_rate: "35%",
            potential_causes: [
              "Unclear value proposition",
              "Slow page load time"
            ],
            recommendations: [
              "Simplify headline and focus on key benefits",
              "Optimize images and implement lazy loading"
            ],
            ab_test_ideas: [
              "Test different hero images",
              "Test simplified vs. detailed value proposition"
            ]
          },
          {
            step: "Form submission",
            drop_off_rate: "65%",
            potential_causes: [
              "Too many form fields",
              "Lack of trust indicators"
            ],
            recommendations: [
              "Reduce form fields to essential information only",
              "Add testimonials and security badges near form"
            ],
            ab_test_ideas: [
              "Test multi-step vs. single-step form",
              "Test different form layouts and field order"
            ]
          }
        ]
      }
    });
  }
});

/**
 * Content effectiveness analysis endpoint
 * Evaluates content performance metrics to suggest improvements
 */
router.post('/content-effectiveness', async (req, res) => {
  const { 
    contentItems, 
    metrics,
    goals = ['engagement', 'conversion'],
    audience
  } = req.body;
  
  if (!contentItems || !Array.isArray(contentItems) || !metrics || typeof metrics !== 'object') {
    return res.status(400).json({ 
      success: false, 
      message: 'Content items array and metrics object are required' 
    });
  }
  
  try {
    const prompt = `Analyze the effectiveness of these content items based on the provided metrics.
      
      Content items: ${JSON.stringify(contentItems)}
      Performance metrics: ${JSON.stringify(metrics)}
      Business goals: ${goals.join(', ')}
      Target audience: ${audience ? JSON.stringify(audience) : 'General'}
      
      For each content item:
      1. Evaluate performance against goals
      2. Identify strengths and weaknesses
      3. Recommend specific improvements
      
      Also provide overall content strategy recommendations.
      
      Format the response as JSON with clear sections for each content item and overall recommendations.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      analysis: content
    });
  } catch (error: any) {
    console.error('Content effectiveness analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Content effectiveness analysis failed', 
      error: error.message,
      fallback: {
        content_items_analysis: [
          {
            content_id: contentItems[0]?.id || "item1",
            title: contentItems[0]?.title || "First content item",
            performance: "Below average",
            strengths: [
              "Good initial engagement",
              "Strong visual elements"
            ],
            weaknesses: [
              "High bounce rate",
              "Low conversion rate",
              "Limited social sharing"
            ],
            recommendations: [
              "Add stronger calls-to-action",
              "Include relevant internal links",
              "Optimize headline for clarity and intent"
            ]
          }
        ],
        overall_recommendations: {
          content_strategy: [
            "Focus more on problem-solution content format",
            "Include more industry-specific case studies",
            "Create content series to encourage return visits"
          ],
          content_distribution: [
            "Increase promotion on LinkedIn",
            "Leverage email newsletter for content distribution"
          ],
          content_formats: [
            "Add more video content",
            "Create interactive elements like calculators or assessments"
          ]
        }
      }
    });
  }
});

/**
 * Competitor analysis endpoint
 * Analyzes competitor websites and identifies opportunities
 */
router.post('/competitor-analysis', async (req, res) => {
  const { 
    competitors, 
    areas = ['content', 'design', 'features', 'seo'],
    industry,
    business_goals = []
  } = req.body;
  
  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Competitors array is required' 
    });
  }
  
  try {
    const prompt = `Analyze these competitors in the ${industry || 'web development'} industry and identify
      strategic opportunities for differentiation and improvement.
      
      Competitors: ${JSON.stringify(competitors)}
      Analysis areas: ${areas.join(', ')}
      Business goals: ${business_goals.length > 0 ? business_goals.join(', ') : 'Increase market share, generate leads'}
      
      For each competitor:
      1. Analyze their strengths and weaknesses
      2. Identify their unique selling propositions
      3. Evaluate their online presence
      
      Then provide:
      1. Gap analysis and opportunities
      2. Recommended differentiation strategy
      3. Priority action items
      
      Format the response as JSON with clear sections for each competitor and overall recommendations.`;
    
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    
    res.json({ 
      success: true, 
      analysis: content
    });
  } catch (error: any) {
    console.error('Competitor analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Competitor analysis failed', 
      error: error.message,
      fallback: {
        competitor_analysis: [
          {
            name: competitors[0]?.name || "Competitor 1",
            strengths: [
              "Strong brand recognition",
              "Comprehensive service offerings",
              "Excellent client portfolio"
            ],
            weaknesses: [
              "Outdated website design",
              "Limited educational content",
              "Generic messaging"
            ],
            unique_selling_proposition: "Enterprise-grade solutions with proven ROI",
            online_presence: {
              website_quality: "Average",
              social_media: "Strong",
              content_strategy: "Product-focused"
            }
          }
        ],
        opportunities: [
          "Focus on user experience design as a key differentiator",
          "Develop more industry-specific case studies",
          "Offer transparent pricing where competitors don't",
          "Create educational content addressing specific pain points"
        ],
        differentiation_strategy: {
          positioning: "The most user-focused web development partner with predictable processes and pricing",
          key_messages: [
            "Transparent pricing and timelines",
            "User-centered design approach",
            "Small business specialists"
          ],
          content_strategy: "Focus on educational content that addresses specific pain points of small business owners"
        },
        priority_actions: [
          "Redesign website homepage to emphasize user experience expertise",
          "Create comparison page highlighting your transparent pricing model",
          "Develop case study template that quantifies business results"
        ]
      }
    });
  }
});

export default router;