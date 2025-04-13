import axios from 'axios';

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Create axios instance for xAI API
const xaiClient = axios.create({
  baseURL: 'https://api.x.ai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: DEFAULT_TIMEOUT, // Set default timeout for all requests
});

/**
 * Makes a request to the xAI API
 * @param endpoint - API endpoint path (e.g., '/chat/completions')
 * @param data - Request data to send
 * @param customTimeout - Optional custom timeout in milliseconds
 * @returns Promise with the API response data
 */
export async function callXAI(endpoint: string, data: any, customTimeout?: number) {
  try {
    // Create custom config with timeout if specified
    const config = customTimeout ? { timeout: customTimeout } : {};
    
    // Start timer for request
    const startTime = Date.now();
    
    // Make the request
    const response = await xaiClient.post(endpoint, data, config);
    
    // Log successful API calls with timing
    const duration = Date.now() - startTime;
    console.log(`xAI API call to ${endpoint} completed in ${duration}ms`);
    
    return response.data;
  } catch (error: any) {
    // Special handling for timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error(`xAI API timeout at ${endpoint} (${customTimeout || DEFAULT_TIMEOUT}ms exceeded)`);
      throw new Error('xAI API request timed out. Please try again later.');
    }
    
    // Handle API errors (status codes, etc.)
    if (error.response) {
      console.error(`xAI API error at ${endpoint} (status ${error.response.status}):`, 
        error.response.data || 'No response data');
      throw new Error('xAI API request failed: ' + 
        (error.response.data?.error?.message || 
         error.response.data?.message || 
         `Error ${error.response.status}`));
    }
    
    // Handle network errors
    console.error(`xAI API network error at ${endpoint}:`, error.message);
    throw new Error('xAI API network error: ' + error.message);
  }
}

/**
 * Interface for options passed to getGrokCompletion
 */
interface GrokCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  responseFormat?: 'text' | 'json_object';
}

/**
 * Simplified helper to get a chat completion from xAI Grok
 * @param prompt - User prompt text
 * @param options - Optional configuration for the request
 * @returns The AI response text
 */
export async function getGrokCompletion(
  prompt: string, 
  options: GrokCompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = 'grok-3-mini',
      maxTokens = 500,
      temperature = 0.7,
      timeout,
      responseFormat
    } = options;
    
    // Build request payload
    const payload: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    };
    
    // Add response format if specified
    if (responseFormat) {
      payload.response_format = { type: responseFormat };
    }
    
    // Make the API call
    const response = await callXAI('/chat/completions', payload, timeout);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }
    
    return response.choices[0].message.content;
  } catch (error: any) {
    console.error('Error getting Grok completion:', error);
    
    // Rethrow with a user-friendly message
    if (error.message.includes('timed out')) {
      throw new Error('AI response timed out. Please try again with a simpler request.');
    }
    
    throw error;
  }
}