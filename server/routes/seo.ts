import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../db';
import { grokApi } from '../grok';
import { sql, desc, eq, like } from 'drizzle-orm';
import { posts, marketplaceItems } from '@shared/schema';
import NodeCache from 'node-cache';

const router = Router();

// Create caches for SEO-related API calls to avoid unnecessary AI calls
const blogSeoAnalysisCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL
const marketplaceSeoCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL
const schemaMarkupCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // 24 hours TTL

/**
 * Generate SEO analysis for a blog post
 */
router.get('/blog-analysis/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    // Check cache first
    const cacheKey = `blog-seo-${postId}`;
    const cachedAnalysis = blogSeoAnalysisCache.get(cacheKey);
    
    if (cachedAnalysis) {
      return res.status(200).json(cachedAnalysis);
    }
    
    // Fetch the blog post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)));
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Prepare the prompt for SEO analysis
    const prompt = `
      Analyze this blog post for SEO optimization and provide detailed suggestions. 
      
      Title: ${post.title}
      Content: ${post.content.substring(0, 5000)} 
      
      Provide an SEO analysis with the following format:
      {
        "seo_score": number from 0 to 100,
        "keyword_analysis": {
          "primary_keyword": "extracted primary keyword",
          "keyword_density": "percentage as string, e.g., '2.3%'",
          "missing_keywords": ["array of related keywords that should be included"]
        },
        "content_analysis": {
          "length_assessment": "assessment of content length as a string",
          "readability_score": number from 0 to 100,
          "heading_structure": "assessment of heading structure as a string"
        },
        "improvement_suggestions": ["array of specific suggestions to improve SEO"],
        "meta_description_suggestion": "suggested meta description under 160 characters"
      }
    `;

    try {
      // Call Grok API for SEO analysis
      const analysisData = await grokApi.generateJson(prompt, "You are an SEO expert analyzing blog content for optimization.", {
        temperature: 0.3 // Lower temperature for more consistent results
      });
      
      // Create result object
      const result = {
        success: true,
        ...analysisData
      };
      
      // Store in cache
      blogSeoAnalysisCache.set(cacheKey, result);
      
      return res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Blog SEO analysis API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error generating SEO analysis with AI',
        error: errorMessage
      });
    }
  } catch (error: any) {
    console.error('Blog SEO analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Generate SEO optimized meta tags and content for marketplace items
 */
router.post('/optimize-marketplace-item', [
  body('itemId')
    .isInt()
    .withMessage('Item ID must be an integer'),
  body('optimizeWhat')
    .isIn(['title', 'description', 'all', 'schema'])
    .withMessage('Invalid optimization target')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { itemId, optimizeWhat } = req.body;
    
    // Check cache first
    const cacheKey = `marketplace-seo-${itemId}-${optimizeWhat}`;
    const cachedOptimization = marketplaceSeoCache.get(cacheKey);
    
    if (cachedOptimization) {
      return res.status(200).json(cachedOptimization);
    }
    
    // Fetch the marketplace item
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.id, itemId));
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Marketplace item not found'
      });
    }

    let prompt = "";
    let systemPrompt = "You are an SEO expert specializing in optimizing content for small business websites.";
    
    // Build different prompts based on what needs to be optimized
    if (optimizeWhat === 'title' || optimizeWhat === 'all') {
      prompt = `
        Optimize the SEO title for this marketplace item:
        
        Name: ${item.name}
        Description: ${item.description}
        Category: ${item.category}
        Tags: ${JSON.stringify(item.tags)}
        
        Create an SEO-optimized title for this item that is 60 characters or less.
        
        Respond with a JSON object in this format:
        {
          "seoTitle": "The optimized title with the primary keyword"
        }
      `;
    } else if (optimizeWhat === 'description' || optimizeWhat === 'all') {
      prompt = `
        Optimize the SEO description for this marketplace item:
        
        Name: ${item.name}
        Description: ${item.description}
        Category: ${item.category}
        Tags: ${JSON.stringify(item.tags)}
        
        Create an SEO-optimized meta description that is between 150-160 characters and includes the primary keyword.
        
        Respond with a JSON object in this format:
        {
          "seoDescription": "The optimized meta description"
        }
      `;
    } else if (optimizeWhat === 'schema') {
      prompt = `
        Generate JSON-LD schema markup for this marketplace item:
        
        Name: ${item.name}
        Description: ${item.description}
        Category: ${item.category}
        Price: ${item.price}
        
        Create the appropriate schema.org JSON-LD markup for this product/service. 
        Use schema.org Product or Service schema depending on the item category.
        
        Respond with a JSON object in this format:
        {
          "schemaMarkup": "The complete schema markup as a string with proper escaping"
        }
      `;
    } else if (optimizeWhat === 'all') {
      prompt = `
        Optimize the SEO for this marketplace item:
        
        Name: ${item.name}
        Description: ${item.description}
        Category: ${item.category}
        Tags: ${JSON.stringify(item.tags)}
        Price: ${item.price}
        
        Create comprehensive SEO optimization including:
        1. An SEO-optimized title (60 characters or less)
        2. An SEO-optimized meta description (150-160 characters)
        3. A list of primary and secondary keywords
        4. JSON-LD schema markup for this product/service
        
        Respond with a JSON object in this format:
        {
          "seoTitle": "The optimized title",
          "seoDescription": "The optimized meta description",
          "seoKeywords": "comma,separated,keywords",
          "schemaMarkup": "The complete schema markup as a string with proper escaping",
          "focusKeyword": "primary keyword"
        }
      `;
    }

    try {
      // Call Grok API for SEO optimization
      const optimizationData = await grokApi.generateJson(prompt, systemPrompt, {
        temperature: 0.3
      });
      
      // Create result object
      const result = {
        success: true,
        itemId,
        ...optimizationData
      };
      
      // Store in cache
      marketplaceSeoCache.set(cacheKey, result);
      
      return res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Marketplace SEO optimization API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error generating SEO optimization with AI',
        error: errorMessage
      });
    }
  } catch (error: any) {
    console.error('Marketplace SEO optimization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Update a blog post with optimized SEO data
 */
router.post('/update-blog-seo/:postId', [
  param('postId')
    .isInt()
    .withMessage('Post ID must be an integer'),
  body('seoTitle')
    .optional()
    .isString()
    .withMessage('SEO title must be a string'),
  body('seoDescription')
    .optional()
    .isString()
    .withMessage('SEO description must be a string'),
  body('seoKeywords')
    .optional()
    .isString()
    .withMessage('SEO keywords must be a string'),
  body('schemaMarkup')
    .optional()
    .isString()
    .withMessage('Schema markup must be a string'),
  body('focusKeyword')
    .optional()
    .isString()
    .withMessage('Focus keyword must be a string'),
  body('canonicalUrl')
    .optional()
    .isString()
    .withMessage('Canonical URL must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { postId } = req.params;
    const { seoTitle, seoDescription, seoKeywords, schemaMarkup, focusKeyword, canonicalUrl } = req.body;
    
    // Update the post with SEO data
    const [updatedPost] = await db
      .update(posts)
      .set({
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        seoKeywords: seoKeywords || undefined,
        schemaMarkup: schemaMarkup || undefined,
        focusKeyword: focusKeyword || undefined,
        canonicalUrl: canonicalUrl || undefined,
        updatedAt: new Date()
      })
      .where(eq(posts.id, parseInt(postId)))
      .returning();
    
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Clear the cache for this post
    blogSeoAnalysisCache.del(`blog-seo-${postId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Blog post SEO data updated successfully',
      post: updatedPost
    });
  } catch (error: any) {
    console.error('Blog SEO update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blog post SEO data',
      error: error.message
    });
  }
});

/**
 * Update a marketplace item with optimized SEO data
 */
router.post('/update-marketplace-seo/:itemId', [
  param('itemId')
    .isInt()
    .withMessage('Item ID must be an integer'),
  body('seoTitle')
    .optional()
    .isString()
    .withMessage('SEO title must be a string'),
  body('seoDescription')
    .optional()
    .isString()
    .withMessage('SEO description must be a string'),
  body('seoKeywords')
    .optional()
    .isString()
    .withMessage('SEO keywords must be a string'),
  body('schemaMarkup')
    .optional()
    .isString()
    .withMessage('Schema markup must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { itemId } = req.params;
    const { seoTitle, seoDescription, seoKeywords, schemaMarkup } = req.body;
    
    // Update the marketplace item with SEO data
    const [updatedItem] = await db
      .update(marketplaceItems)
      .set({
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        seoKeywords: seoKeywords || undefined,
        schemaMarkup: schemaMarkup || undefined,
        updatedAt: new Date()
      })
      .where(eq(marketplaceItems.id, parseInt(itemId)))
      .returning();
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Marketplace item not found'
      });
    }
    
    // Clear the cache for this item
    marketplaceSeoCache.del(`marketplace-seo-${itemId}-title`);
    marketplaceSeoCache.del(`marketplace-seo-${itemId}-description`);
    marketplaceSeoCache.del(`marketplace-seo-${itemId}-schema`);
    marketplaceSeoCache.del(`marketplace-seo-${itemId}-all`);
    
    return res.status(200).json({
      success: true,
      message: 'Marketplace item SEO data updated successfully',
      item: updatedItem
    });
  } catch (error: any) {
    console.error('Marketplace SEO update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating marketplace item SEO data',
      error: error.message
    });
  }
});

/**
 * Generate schema markup for a specific content type
 */
router.post('/generate-schema', [
  body('contentType')
    .isIn(['blog', 'product', 'service', 'organization', 'local_business', 'faq'])
    .withMessage('Invalid content type'),
  body('contentData')
    .isObject()
    .withMessage('Content data must be an object')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { contentType, contentData } = req.body;
    
    // Generate a cache key based on the content type and data
    const cacheKey = `schema-${contentType}-${JSON.stringify(contentData).hashCode()}`;
    const cachedSchema = schemaMarkupCache.get(cacheKey);
    
    if (cachedSchema) {
      return res.status(200).json(cachedSchema);
    }
    
    let prompt = "";
    let systemPrompt = "You are an SEO expert specializing in structured data and schema markup.";
    
    // Build prompt based on content type
    switch (contentType) {
      case 'blog':
        prompt = `
          Generate a JSON-LD schema markup for a blog article with the following details:
          
          Title: ${contentData.title}
          Author: ${contentData.author}
          Date Published: ${contentData.datePublished}
          Image URL: ${contentData.imageUrl || 'No image available'}
          Description: ${contentData.description || contentData.excerpt || 'No description available'}
          
          Create the proper schema.org Article or BlogPosting JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      case 'product':
        prompt = `
          Generate a JSON-LD schema markup for a product with the following details:
          
          Name: ${contentData.name}
          Description: ${contentData.description}
          Price: ${contentData.price}
          Currency: USD
          Image: ${contentData.imageUrl || contentData.images?.[0] || 'No image available'}
          
          Create the proper schema.org Product JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      case 'service':
        prompt = `
          Generate a JSON-LD schema markup for a service with the following details:
          
          Name: ${contentData.name}
          Description: ${contentData.description}
          Provider: ${contentData.provider || 'Elevion'}
          Price: ${contentData.price}
          
          Create the proper schema.org Service JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      case 'organization':
        prompt = `
          Generate a JSON-LD schema markup for an organization with the following details:
          
          Name: ${contentData.name || 'Elevion'}
          Description: ${contentData.description || 'A premier web development company for small businesses'}
          Logo: ${contentData.logo || '/images/elevion-logo.png'}
          URL: ${contentData.url || 'https://elevion.com'}
          
          Create the proper schema.org Organization JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      case 'local_business':
        prompt = `
          Generate a JSON-LD schema markup for a local business with the following details:
          
          Name: ${contentData.name}
          Description: ${contentData.description}
          Address: ${contentData.address}
          Telephone: ${contentData.telephone}
          Business Type: ${contentData.businessType || 'LocalBusiness'}
          
          Create the proper schema.org LocalBusiness JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      case 'faq':
        prompt = `
          Generate a JSON-LD schema markup for an FAQ page with the following questions and answers:
          
          ${contentData.faqs.map((faq: any, index: number) => 
            `Question ${index + 1}: ${faq.question}\nAnswer ${index + 1}: ${faq.answer}`
          ).join('\n\n')}
          
          Create the proper schema.org FAQPage JSON-LD markup.
          
          Respond with a JSON object in this format:
          {
            "schemaMarkup": "The complete schema markup as a string with proper escaping"
          }
        `;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    try {
      // Call Grok API for schema generation
      const schemaData = await grokApi.generateJson(prompt, systemPrompt, {
        temperature: 0.2 // Very low temperature for consistent schema output
      });
      
      // Create result object
      const result = {
        success: true,
        contentType,
        ...schemaData
      };
      
      // Store in cache
      schemaMarkupCache.set(cacheKey, result);
      
      return res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Schema generation API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Error generating schema markup with AI',
        error: errorMessage
      });
    }
  } catch (error: any) {
    console.error('Schema generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Add hashCode method to String prototype for cache key generation
 */
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    hash = ((hash << 5) - hash) + this.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export default router;