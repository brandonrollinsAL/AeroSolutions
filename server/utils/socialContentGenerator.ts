import { grokApi } from '../grok';
import { db } from '../db';
import { socialPlatforms, posts, socialPosts } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SocialContentOptions {
  toneOfVoice?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  includeCta?: boolean;
  ctaType?: 'visit' | 'signup' | 'buy' | 'learn' | 'contact';
  maximumLength?: number;
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  suggestedImage?: string;
}

/**
 * Generate social media post content based on an article or blog post
 * @param sourceId ID of the article or blog post
 * @param platformId ID of the social platform
 * @param options Content generation options
 */
export async function generateSocialPostFromArticle(
  sourceId: number, 
  platformId: number, 
  options: SocialContentOptions = {}
): Promise<GeneratedContent> {
  try {
    // Fetch the article content
    const [article] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, sourceId));

    if (!article) {
      throw new Error(`Article with ID ${sourceId} not found`);
    }

    // Fetch the platform details to determine content constraints
    const [platform] = await db
      .select()
      .from(socialPlatforms)
      .where(eq(socialPlatforms.id, platformId));

    if (!platform) {
      throw new Error(`Platform with ID ${platformId} not found`);
    }

    // Use character limit from options, platform config, or default
    const characterLimit = options.maximumLength || 
                           platform.apiConfig?.characterLimit || 
                           (platform.name === 'twitter' ? 280 : 1000);

    // Build prompt for XAI
    const prompt = buildSocialContentPrompt(article, platform.name, {
      ...options,
      maximumLength: characterLimit
    });

    // Get structured response from XAI
    const response = await grokApi.generateJson<{
      content: string;
      hashtags: string[];
      suggestedImage?: string;
    }>(prompt, 'You are a social media marketing expert who helps create optimized posts for various platforms.');

    return {
      content: response.content,
      hashtags: response.hashtags || [],
      suggestedImage: response.suggestedImage
    };
  } catch (error) {
    console.error('Error generating social post content:', error);
    throw new Error(`Failed to generate social post content: ${error.message}`);
  }
}

/**
 * Generate multiple social media posts for different platforms from the same source
 * @param sourceId ID of the content source
 * @param platformIds Array of platform IDs to generate for
 * @param options Content generation options
 */
export async function generateMultiPlatformContent(
  sourceId: number,
  platformIds: number[],
  options: SocialContentOptions = {}
): Promise<Record<number, GeneratedContent>> {
  const results: Record<number, GeneratedContent> = {};

  // Generate content for each platform in parallel
  await Promise.all(
    platformIds.map(async (platformId) => {
      try {
        const content = await generateSocialPostFromArticle(sourceId, platformId, options);
        results[platformId] = content;
      } catch (error) {
        console.error(`Error generating content for platform ${platformId}:`, error);
        // Continue with other platforms even if one fails
      }
    })
  );

  return results;
}

/**
 * Analyze a social post's engagement and provide recommendations
 * @param postId ID of the social post to analyze
 */
export async function analyzeSocialPostEngagement(postId: number): Promise<{
  insights: string[];
  improvements: string[];
  score: number;
}> {
  try {
    // Fetch the post with its metrics
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId));

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    // If post has no metrics, we can't analyze it
    if (!post.metrics || Object.keys(post.metrics).length === 0) {
      return {
        insights: ['No engagement metrics available for this post yet.'],
        improvements: ['Wait for the post to receive engagement before analysis.'],
        score: 0
      };
    }

    // Prepare a prompt for XAI
    const prompt = `
      Analyze this social media post and its engagement metrics:
      
      Platform: ${post.contentSourceType || 'unknown'}
      Content: "${post.content}"
      
      Metrics:
      - Impressions: ${post.metrics.impressions || 'N/A'}
      - Likes: ${post.metrics.likes || 'N/A'}
      - Shares: ${post.metrics.shares || 'N/A'}
      - Comments: ${post.metrics.comments || 'N/A'}
      - Clicks: ${post.metrics.clicks || 'N/A'}
      - Engagement rate: ${post.metrics.engagement || 'N/A'}
      
      Please analyze this post's performance and provide:
      1. Key insights about what worked or didn't work
      2. Specific improvements for future posts
      3. An overall engagement score from 1-10

      Return the results as a JSON object with these fields:
      - insights: An array of insight strings
      - improvements: An array of improvement suggestion strings
      - score: A number from 1-10 representing overall performance
    `;

    // Get analysis from XAI
    const analysis = await grokApi.generateJson<{
      insights: string[];
      improvements: string[];
      score: number;
    }>(prompt);

    return {
      insights: analysis.insights || [],
      improvements: analysis.improvements || [],
      score: analysis.score || 0
    };
  } catch (error) {
    console.error('Error analyzing social post engagement:', error);
    throw new Error(`Failed to analyze social post engagement: ${error.message}`);
  }
}

/**
 * Generate a batch of recommended posts based on engagement analysis
 * @param userId User ID to generate recommendations for
 * @param count Number of recommendations to generate
 */
export async function generateRecommendedPosts(
  userId: number, 
  count: number = 3
): Promise<{ title: string; content: string; platform: string }[]> {
  try {
    // Get user's previous posts and sort by engagement
    const userPosts = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.contentSourceType, 'user'))
      .limit(10);
    
    // If no previous posts, generate some generic recommendations
    if (userPosts.length === 0) {
      const prompt = `
        Generate ${count} social media post recommendations for a small business 
        digital marketing strategy. For each post, include a title, the post content,
        and which platform it would be best for (Twitter, LinkedIn, Instagram, or Facebook).
        
        Return the results as a JSON array with these fields for each item:
        - title: A descriptive title for the post idea
        - content: The actual post content
        - platform: The recommended platform (twitter, linkedin, instagram, or facebook)
      `;

      return await grokApi.generateJson<{ 
        title: string; 
        content: string; 
        platform: string 
      }[]>(prompt);
    }

    // Analyze successful posts to generate better recommendations
    const topPosts = userPosts
      .filter(post => post.metrics && typeof post.metrics === 'object')
      .sort((a, b) => {
        const engagementA = a.metrics?.engagement || 0;
        const engagementB = b.metrics?.engagement || 0;
        return engagementB - engagementA;
      })
      .slice(0, 3);

    // Create prompt with past successful posts
    const prompt = `
      Based on these previous successful social media posts:
      ${topPosts.map(post => `- ${post.content}`).join('\n')}
      
      Generate ${count} new social media post recommendations that follow similar style and themes.
      For each post, include a title, the post content, and which platform it would be best for
      (Twitter, LinkedIn, Instagram, or Facebook).
      
      Return the results as a JSON array with these fields for each item:
      - title: A descriptive title for the post idea
      - content: The actual post content
      - platform: The recommended platform (twitter, linkedin, instagram, or facebook)
    `;

    return await grokApi.generateJson<{ 
      title: string; 
      content: string; 
      platform: string 
    }[]>(prompt);
  } catch (error) {
    console.error('Error generating recommended posts:', error);
    throw new Error(`Failed to generate recommended posts: ${error.message}`);
  }
}

/**
 * Build prompt for social content generation
 */
function buildSocialContentPrompt(
  article: any, 
  platformName: string, 
  options: SocialContentOptions
): string {
  const {
    toneOfVoice = 'professional',
    includeHashtags = true,
    includeEmojis = true,
    includeCta = true,
    ctaType = 'visit',
    maximumLength
  } = options;

  return `
    Create an engaging social media post for ${platformName} based on this article:
    
    Title: ${article.title}
    
    Content:
    ${article.content.substring(0, 500)}${article.content.length > 500 ? '...' : ''}
    
    Requirements:
    - Platform: ${platformName}
    - Maximum length: ${maximumLength} characters
    - Tone of voice: ${toneOfVoice}
    - Include hashtags: ${includeHashtags ? 'Yes' : 'No'}
    - Include emojis: ${includeEmojis ? 'Yes' : 'No'}
    - Include call-to-action: ${includeCta ? `Yes, focus on ${ctaType}` : 'No'}
    
    Return the results as a JSON object with these fields:
    - content: The post content
    - hashtags: An array of relevant hashtags (without the # symbol)
    - suggestedImage: (optional) A brief description of an image that would work well with this post
  `;
}