import axios from 'axios';
import { db } from '../db';
import { socialPosts, socialPlatforms } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Buffer API configuration
const BUFFER_API_URL = 'https://api.bufferapp.com/1';
const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

interface BufferProfile {
  id: string;
  service: string; // twitter, linkedin, etc.
  serviceName: string;
  serviceUsername: string;
  isActive: boolean;
}

interface BufferCreateUpdateResponse {
  success: boolean;
  buffer_count: number;
  buffer_percentage: number;
  updates_sent: number;
  update_id?: string;
  message?: string;
}

/**
 * Get Buffer profiles
 * @returns List of Buffer profiles
 */
export async function getBufferProfiles(): Promise<BufferProfile[]> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    const response = await axios.get(`${BUFFER_API_URL}/profiles.json`, {
      params: { access_token: BUFFER_API_KEY }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Buffer profiles:', error);
    throw new Error(`Failed to fetch Buffer profiles: ${error.message}`);
  }
}

/**
 * Create a post on Buffer
 * @param postId The ID of the social post in our database
 */
export async function createBufferPost(postId: number): Promise<{ success: boolean; message: string }> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    // Fetch post data
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId));

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    // Fetch platform data to get Buffer profile ID mapping
    const [platform] = await db
      .select()
      .from(socialPlatforms)
      .where(eq(socialPlatforms.id, post.platformId));

    if (!platform) {
      throw new Error(`Platform with ID ${post.platformId} not found`);
    }

    // Get Buffer profile ID from platform's apiConfig
    const bufferProfileId = platform.apiConfig?.bufferProfileId;
    if (!bufferProfileId) {
      throw new Error(`No Buffer profile ID configured for platform ${platform.name}`);
    }

    // Prepare post data
    const postData = {
      text: post.content,
      profile_ids: [bufferProfileId],
      media: post.mediaUrls?.length ? {
        link: post.mediaUrls[0],
        description: post.content
      } : undefined,
      scheduled_at: post.scheduledTime ? new Date(post.scheduledTime).toISOString() : undefined
    };

    // Send to Buffer
    const response = await axios.post(`${BUFFER_API_URL}/updates/create.json`, null, {
      params: {
        access_token: BUFFER_API_KEY,
        ...postData
      }
    });

    const data: BufferCreateUpdateResponse = response.data;
    
    if (data.success) {
      // Update our database with Buffer post ID
      await db
        .update(socialPosts)
        .set({ 
          bufferPostId: data.update_id,
          status: post.scheduledTime ? 'scheduled' : 'processing',
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, postId));

      return { 
        success: true, 
        message: post.scheduledTime 
          ? `Post scheduled successfully with Buffer` 
          : `Post queued for posting with Buffer` 
      };
    } else {
      throw new Error(data.message || 'Unknown error from Buffer API');
    }
  } catch (error) {
    console.error('Error creating Buffer post:', error);
    
    // Update post status to failed
    await db
      .update(socialPosts)
      .set({ 
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        updatedAt: new Date()
      })
      .where(eq(socialPosts.id, postId));
      
    throw new Error(`Failed to create Buffer post: ${error.message}`);
  }
}

/**
 * Get the status of a post from Buffer
 * @param bufferPostId Buffer post ID
 */
export async function getBufferPostStatus(bufferPostId: string): Promise<any> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    const response = await axios.get(`${BUFFER_API_URL}/updates/${bufferPostId}.json`, {
      params: { access_token: BUFFER_API_KEY }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching Buffer post status for ID ${bufferPostId}:`, error);
    throw new Error(`Failed to fetch Buffer post status: ${error.message}`);
  }
}

/**
 * Update post in Buffer
 * @param postId The ID of the social post in our database
 */
export async function updateBufferPost(postId: number): Promise<{ success: boolean; message: string }> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    // Fetch post data
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId));

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    if (!post.bufferPostId) {
      throw new Error(`Post with ID ${postId} has no Buffer post ID`);
    }

    // Prepare update data
    const updateData = {
      text: post.content,
      media: post.mediaUrls?.length ? {
        link: post.mediaUrls[0],
        description: post.content
      } : undefined,
      scheduled_at: post.scheduledTime ? new Date(post.scheduledTime).toISOString() : undefined
    };

    // Send to Buffer
    const response = await axios.post(`${BUFFER_API_URL}/updates/${post.bufferPostId}/update.json`, null, {
      params: {
        access_token: BUFFER_API_KEY,
        ...updateData
      }
    });

    const data = response.data;
    
    if (data.success) {
      // Update our database
      await db
        .update(socialPosts)
        .set({ 
          status: post.scheduledTime ? 'scheduled' : 'processing',
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, postId));

      return { 
        success: true, 
        message: `Post updated successfully with Buffer` 
      };
    } else {
      throw new Error(data.message || 'Unknown error from Buffer API');
    }
  } catch (error) {
    console.error('Error updating Buffer post:', error);
    throw new Error(`Failed to update Buffer post: ${error.message}`);
  }
}

/**
 * Delete post from Buffer
 * @param postId The ID of the social post in our database
 */
export async function deleteBufferPost(postId: number): Promise<{ success: boolean; message: string }> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    // Fetch post data
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId));

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    if (!post.bufferPostId) {
      // If no Buffer post ID, just update our status
      await db
        .update(socialPosts)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, postId));
      
      return { success: true, message: 'Post cancelled successfully' };
    }

    // Send delete request to Buffer
    const response = await axios.post(`${BUFFER_API_URL}/updates/${post.bufferPostId}/destroy.json`, null, {
      params: { access_token: BUFFER_API_KEY }
    });

    const data = response.data;
    
    if (data.success) {
      // Update our database
      await db
        .update(socialPosts)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(socialPosts.id, postId));

      return { 
        success: true, 
        message: `Post deleted successfully from Buffer` 
      };
    } else {
      throw new Error(data.message || 'Unknown error from Buffer API');
    }
  } catch (error) {
    console.error('Error deleting Buffer post:', error);
    throw new Error(`Failed to delete Buffer post: ${error.message}`);
  }
}

/**
 * Sync post analytics from Buffer
 * @param postId The ID of the social post in our database
 */
export async function syncBufferAnalytics(postId: number): Promise<{ success: boolean; message: string }> {
  if (!BUFFER_API_KEY) {
    throw new Error('Buffer API key is not configured');
  }

  try {
    // Fetch post data
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, postId));

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    if (!post.bufferPostId) {
      throw new Error(`Post with ID ${postId} has no Buffer post ID`);
    }

    // Get post interactions from Buffer
    const response = await axios.get(`${BUFFER_API_URL}/updates/${post.bufferPostId}/interactions.json`, {
      params: { access_token: BUFFER_API_KEY }
    });

    const data = response.data;
    
    // Map Buffer analytics to our schema
    const platformType = post.platform?.name || 'unknown';
    const metrics: any = { ...post.metrics };

    // Process the analytics data based on platform
    if (platformType === 'twitter') {
      metrics.likes = data.interactions?.favorites || 0;
      metrics.shares = data.interactions?.retweets || 0;
      metrics.comments = data.interactions?.replies || 0;
      metrics.clicks = data.interactions?.clicks || 0;
      metrics.twitter = {
        retweets: data.interactions?.retweets || 0,
        quotes: data.interactions?.quotes || 0
      };
    } else if (platformType === 'linkedin') {
      metrics.likes = data.interactions?.likes || 0;
      metrics.shares = data.interactions?.shares || 0;
      metrics.comments = data.interactions?.comments || 0;
      metrics.clicks = data.interactions?.clicks || 0;
      metrics.linkedin = {
        reactions: data.interactions?.likes || 0
      };
    } else if (platformType === 'facebook') {
      metrics.likes = data.interactions?.likes || 0;
      metrics.shares = data.interactions?.shares || 0;
      metrics.comments = data.interactions?.comments || 0;
      metrics.clicks = data.interactions?.clicks || 0;
    }

    // Calculate engagement rate if we have impressions
    if (metrics.impressions && metrics.impressions > 0) {
      const interactions = (metrics.likes || 0) + 
                          (metrics.shares || 0) + 
                          (metrics.comments || 0) + 
                          (metrics.clicks || 0);
      metrics.engagement = interactions / metrics.impressions;
    }

    // Update our database with analytics
    await db
      .update(socialPosts)
      .set({ 
        metrics,
        updatedAt: new Date()
      })
      .where(eq(socialPosts.id, postId));

    return { 
      success: true, 
      message: `Analytics synced successfully from Buffer` 
    };
  } catch (error) {
    console.error('Error syncing Buffer analytics:', error);
    throw new Error(`Failed to sync Buffer analytics: ${error.message}`);
  }
}