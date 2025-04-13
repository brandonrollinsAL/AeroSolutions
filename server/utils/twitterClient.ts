import axios from 'axios';
import { createHmac } from 'crypto';

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

  constructor(config: {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
    bearerToken: string;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiKeySecret = config.apiKeySecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.bearerToken = config.bearerToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.callbackUrl = config.callbackUrl;
  }

  /**
   * Creates an OAuth 1.0a signature for Twitter API requests
   */
  private createOAuthSignature(method: string, url: string, params: Record<string, string>): string {
    // Create parameter string
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(this.apiKeySecret)}&${encodeURIComponent(this.accessTokenSecret)}`;

    // Create HMAC-SHA1 hash
    const hmac = createHmac('sha1', signingKey);
    hmac.update(signatureBaseString);
    return hmac.digest('base64');
  }

  /**
   * Creates the Authorization header for OAuth 1.0a
   */
  private createOAuthHeader(method: string, url: string, extraParams: Record<string, string> = {}): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Buffer.from(Math.random().toString(36)).toString('base64');

    // Create OAuth parameters
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: this.accessToken,
      oauth_version: '1.0',
      ...extraParams
    };

    // Create OAuth signature
    const signature = this.createOAuthSignature(method, url, oauthParams);
    oauthParams.oauth_signature = signature;

    // Create Authorization header
    return 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');
  }

  /**
   * Creates a tweet using the Twitter API v2
   * @param text The text content of the tweet
   * @param mediaIds Optional array of media IDs to attach to the tweet
   */
  async createTweet(text: string, mediaIds?: string[]): Promise<any> {
    try {
      const url = `${this.baseUrl}/tweets`;
      const data: any = {
        text
      };

      if (mediaIds && mediaIds.length > 0) {
        data.media = { media_ids: mediaIds };
      }

      const authHeader = this.createOAuthHeader('POST', url);

      const response = await axios.post(url, data, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating tweet:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Uses the Bearer token for API requests that don't require user authentication
   */
  async get(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in GET request:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Gets information about the authenticated user
   */
  async getUserInfo(): Promise<any> {
    try {
      return await this.get('/users/me', {
        'user.fields': 'created_at,description,entities,id,location,name,profile_image_url,protected,public_metrics,url,username,verified,withheld'
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  /**
   * Gets a user's recent tweets
   */
  async getUserTweets(userId: string, maxResults: number = 10): Promise<any> {
    try {
      return await this.get(`/users/${userId}/tweets`, {
        max_results: maxResults,
        'tweet.fields': 'created_at,public_metrics'
      });
    } catch (error) {
      console.error('Error getting user tweets:', error);
      throw error;
    }
  }
}