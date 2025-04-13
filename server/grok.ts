import axios from 'axios';

const API_KEY = process.env.XAI_API_KEY;
const BASE_URL = 'https://api.x.ai/v1';

// Ensure API key is available
if (!API_KEY) {
  throw new Error('Missing required API key: XAI_API_KEY');
}

// Define response types
interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: GrokChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GrokVisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

// Main API wrapper
export const grokApi = {
  /**
   * Generate a chat completion using Grok API
   */
  async createChatCompletion(
    messages: GrokChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      response_format?: { type: string };
    } = {}
  ): Promise<GrokChatCompletionResponse> {
    const model = options.model || 'grok-3-latest';
    
    try {
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          messages,
          model,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          response_format: options.response_format,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Grok API error:', error.response?.data || error.message);
      throw new Error(`Grok API error: ${error.response?.data?.error?.message || error.message}`);
    }
  },

  /**
   * Generate a chat completion with vision capabilities
   */
  async createVisionCompletion(
    content: GrokVisionContent[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<GrokChatCompletionResponse> {
    // Use a vision-compatible model by default
    const model = options.model || 'grok-3-vision-latest';
    
    const messages: GrokChatMessage[] = [
      {
        role: 'user',
        content: Array.isArray(content) ? content : [{ type: 'text', text: content as unknown as string }],
      } as any, // Type assertion needed due to complex content structure
    ];
    
    try {
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          messages,
          model,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Grok Vision API error:', error.response?.data || error.message);
      throw new Error(`Grok Vision API error: ${error.response?.data?.error?.message || error.message}`);
    }
  },

  /**
   * Analyze text with Grok
   */
  async analyzeText(text: string, instructions?: string): Promise<string> {
    const systemPrompt = instructions || 
      'Analyze the following text and provide insights. Be concise and focus on the most important points.';
      
    const completion = await this.createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ]);
    
    return completion.choices[0].message.content;
  },

  /**
   * Generate a JSON response with Grok
   */
  async generateJson<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.createChatCompletion(
      [
        { 
          role: 'system', 
          content: systemPrompt || 'You are a helpful assistant that responds in JSON format.'
        },
        { role: 'user', content: prompt }
      ],
      {
        response_format: { type: 'json_object' }
      }
    );
    
    try {
      return JSON.parse(response.choices[0].message.content) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', response.choices[0].message.content);
      throw new Error('Failed to generate valid JSON from Grok API');
    }
  },

  /**
   * Analyze image
   */
  async analyzeImage(imageBase64: string, prompt?: string): Promise<string> {
    const content: GrokVisionContent[] = [
      {
        type: 'text',
        text: prompt || 'Describe what you see in this image in detail.'
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];
    
    const response = await this.createVisionCompletion(content);
    return response.choices[0].message.content;
  }
};