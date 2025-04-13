import axios from 'axios';

// Default Grok API endpoint
const GROK_API_URL = 'https://api.x.ai/v1';

/**
 * Interface for Grok chat message
 */
interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for Grok API options
 */
interface GrokApiOptions {
  model: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: { type: 'text' | 'json_object' };
}

/**
 * Interface for Grok API response
 */
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

/**
 * Interface for content items in vision requests
 */
interface GrokVisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * Implementation of the Grok API client
 */
export const grokApi = {
  /**
   * Generate a chat completion using Grok API
   */
  async createChatCompletion(
    messages: GrokChatMessage[],
    options: GrokApiOptions = { model: 'grok-3-latest' }
  ): Promise<GrokChatCompletionResponse> {
    try {
      // Ensure API key is available
      if (!process.env.XAI_API_KEY) {
        throw new Error('XAI_API_KEY is not defined in environment');
      }

      const response = await axios.post<GrokChatCompletionResponse>(
        `${GROK_API_URL}/chat/completions`,
        {
          messages,
          ...options
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      // Enhanced error handling with more context
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const errorData = error.response.data || {};
        const errorMsg = errorData.error?.message || JSON.stringify(errorData);
        
        throw new Error(`Grok API Error (${status}): ${errorMsg}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`Grok API network error: ${error.message}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Grok API configuration error: ${error.message}`);
      }
    }
  },

  /**
   * Generate a chat completion with vision capabilities
   */
  async createVisionCompletion(
    contents: GrokVisionContent[],
    options: GrokApiOptions = { model: 'grok-3-vision-latest' }
  ): Promise<GrokChatCompletionResponse> {
    try {
      // Ensure API key is available
      if (!process.env.XAI_API_KEY) {
        throw new Error('XAI_API_KEY is not defined in environment');
      }

      // Format the message for the vision model
      const messages = [
        {
          role: 'user' as const,
          content: contents
        }
      ];

      const response = await axios.post<GrokChatCompletionResponse>(
        `${GROK_API_URL}/chat/completions`,
        {
          messages,
          ...options
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      // Enhanced error handling
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data || {};
        const errorMsg = errorData.error?.message || JSON.stringify(errorData);
        
        throw new Error(`Grok Vision API Error (${status}): ${errorMsg}`);
      } else if (error.request) {
        throw new Error(`Grok Vision API network error: ${error.message}`);
      } else {
        throw new Error(`Grok Vision API configuration error: ${error.message}`);
      }
    }
  },

  /**
   * Analyze text with Grok
   */
  async analyzeText(text: string, instructions?: string): Promise<string> {
    const messages: GrokChatMessage[] = [
      {
        role: 'user',
        content: instructions ? `${instructions}\n\nText to analyze: ${text}` : text
      }
    ];

    const response = await this.createChatCompletion(messages, {
      model: 'grok-3-latest',
      temperature: 0.3 // Lower temperature for more focused analysis
    });

    return response.choices[0].message.content;
  },

  /**
   * Generate a JSON response with Grok
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt to guide the model's behavior
   * @param model Optional model name (defaults to grok-3-latest, can use grok-3-mini for faster responses)
   */
  async generateJson<T = any>(prompt: string, systemPrompt?: string, model = 'grok-3-latest'): Promise<T> {
    const messages: GrokChatMessage[] = systemPrompt 
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      : [
          { role: 'user', content: prompt }
        ];
    
    console.log(`Using Grok model: ${model} for JSON generation`);

    const response = await this.createChatCompletion(messages, {
      model: model,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content) as T;
  },

  /**
   * Analyze image
   */
  async analyzeImage(imageBase64: string, prompt?: string): Promise<string> {
    const contents: GrokVisionContent[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];

    // Add text prompt if provided
    if (prompt) {
      contents.unshift({
        type: 'text',
        text: prompt
      });
    }

    const response = await this.createVisionCompletion(contents, {
      model: 'grok-3-vision-latest',
      max_tokens: 500
    });

    return response.choices[0].message.content;
  }
};