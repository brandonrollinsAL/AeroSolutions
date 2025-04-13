import crypto from 'crypto';
import axios from 'axios';

/**
 * Twitter API v2 client for Elevion
 * This client handles authentication and requests to the Twitter API
 */
export class TwitterClient {
  private apiKey: string;
  private apiKeySecret: string;
  private accessToken: string;
  private accessTokenSecret: string;
  private bearerToken: string;
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;
  private baseUrl: string = 'https://api.twitter.com/2';

  /**
   * Creates a new TwitterClient instance
   * 
   * @param config Twitter API credentials
   */
  constructor(config: {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
    bearerToken: string;
    clientId: string;
    clientSecret: string;
    callbackUrl?: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiKeySecret = config.apiKeySecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.bearerToken = config.bearerToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.callbackUrl = config.callbackUrl || 'https://elevion.dev/api/twitter/callback';
  }

  /**
   * Creates an OAuth 1.0a signature for Twitter API requests
   */
  private createOAuthSignature(method: string, url: string, params: Record<string, string>): string {
    // Create the parameter string
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create the signature base string
    const signatureBaseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(paramString)
    ].join('&');

    // Create the signing key
    const signingKey = `${encodeURIComponent(this.apiKeySecret)}&${encodeURIComponent(this.accessTokenSecret)}`;

    // Create the signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    return signature;
  }

  /**
   * Creates the Authorization header for OAuth 1.0a
   */
  private createOAuthHeader(method: string, url: string, extraParams: Record<string, string> = {}): string {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.accessToken,
      oauth_version: '1.0'
    };

    // Combine OAuth params with extra params for signature
    const allParams = {...oauthParams, ...extraParams};
    
    // Create the signature
    const signature = this.createOAuthSignature(method, url, allParams);
    oauthParams.oauth_signature = signature;

    // Create the Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return authHeader;
  }

  /**
   * Creates a tweet using the Twitter API v2
   * @param text The text content of the tweet
   * @param mediaIds Optional array of media IDs to attach to the tweet
   */
  async createTweet(text: string, mediaIds?: string[]): Promise<any> {
    const url = `${this.baseUrl}/tweets`;
    const method = 'POST';
    const data: any = { text };
    
    if (mediaIds && mediaIds.length > 0) {
      data.media = { media_ids: mediaIds };
    }
    
    const authHeader = this.createOAuthHeader(method, url, {});
    
    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Twitter API error:', error.response.data);
        throw new Error(`Twitter API error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Uses the Bearer token for API requests that don't require user authentication
   */
  async get(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Convert params to query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    const fullUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Twitter API error:', error.response.data);
        throw new Error(`Twitter API error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Gets information about the authenticated user
   */
  async getUserInfo(): Promise<any> {
    return this.get('/users/me', {
      'user.fields': 'id,name,username,profile_image_url,description,created_at,public_metrics'
    });
  }

  /**
   * Gets a user's recent tweets
   */
  async getUserTweets(userId: string, maxResults: number = 10): Promise<any> {
    return this.get(`/users/${userId}/tweets`, {
      max_results: maxResults,
      'tweet.fields': 'created_at,public_metrics,text'
    });
  }
}

// Export a singleton instance if credentials are available
let twitterClientInstance: TwitterClient | null = null;

export function getTwitterClient(): TwitterClient | null {
  if (twitterClientInstance) {
    return twitterClientInstance;
  }
  
  const apiKey = process.env.TWITTER_API_KEY;
  const apiKeySecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_SECRET;
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  
  // Check if all required credentials are available
  if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret || 
      !bearerToken || !clientId || !clientSecret) {
    console.warn('Twitter API credentials are missing. Twitter functionality will be disabled.');
    return null;
  }
  
  try {
    twitterClientInstance = new TwitterClient({
      apiKey,
      apiKeySecret,
      accessToken,
      accessTokenSecret,
      bearerToken,
      clientId,
      clientSecret
    });
    return twitterClientInstance;
  } catch (error) {
    console.error('Failed to initialize Twitter client:', error);
    return null;
  }
}