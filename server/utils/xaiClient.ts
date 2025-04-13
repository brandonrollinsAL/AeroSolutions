import axios from 'axios';

// Create axios instance for xAI API
const xaiClient = axios.create({
  baseURL: 'https://api.x.ai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Makes a request to the xAI API
 * @param endpoint - API endpoint path (e.g., '/chat/completions')
 * @param data - Request data to send
 * @returns Promise with the API response data
 */
export async function callXAI(endpoint: string, data: any) {
  try {
    const response = await xaiClient.post(endpoint, data);
    return response.data;
  } catch (error: any) {
    console.error(`xAI API error at ${endpoint}:`, error.response?.data || error.message);
    throw new Error('xAI API request failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

/**
 * Simplified helper to get a chat completion from xAI Grok
 * @param prompt - User prompt text
 * @param model - Grok model to use, defaults to 'grok-3-mini'
 * @returns The AI response text
 */
export async function getGrokCompletion(prompt: string, model = 'grok-3-mini'): Promise<string> {
  try {
    const response = await callXAI('/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Grok API');
    }
    
    return response.choices[0].message.content;
  } catch (error: any) {
    console.error('Error getting Grok completion:', error);
    throw error;
  }
}