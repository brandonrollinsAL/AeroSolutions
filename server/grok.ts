import { callXAI } from './utils/xaiClient';

class GrokApi {
  /**
   * Generate text using Grok AI
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt to set context
   * @param options Additional options (model, temperature, etc.)
   */
  async generateText(
    prompt: string,
    systemPrompt: string = '',
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      const { model = 'grok-3-mini', temperature = 0.7, maxTokens = 500 } = options;
      
      const messages = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add user prompt
      messages.push({ role: 'user', content: prompt });
      
      const response = await callXAI('/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating text with Grok:', error);
      throw new Error(`Grok text generation failed: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON using Grok AI
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt to set context
   * @param options Additional options (model, temperature, etc.)
   */
  async generateJson<T = any>(
    prompt: string,
    systemPrompt: string = '',
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<T> {
    try {
      const { model = 'grok-3-mini', temperature = 0.7, maxTokens = 1000 } = options;
      
      const messages = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add user prompt
      messages.push({ role: 'user', content: prompt });
      
      const response = await callXAI('/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response as JSON
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating JSON with Grok:', error);
      throw new Error(`Grok JSON generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze an image using Grok Vision
   * @param imageBase64 Base64-encoded image
   * @param prompt The prompt to send to the model
   * @param options Additional options (model, temperature, etc.)
   */
  async analyzeImage(
    imageBase64: string,
    prompt: string = 'Describe this image in detail.',
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      // Default to grok-vision-mini if available
      const { model = 'grok-2-vision-1212', temperature = 0.7, maxTokens = 500 } = options;
      
      const response = await callXAI('/chat/completions', {
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature,
        max_tokens: maxTokens
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image with Grok:', error);
      throw new Error(`Grok image analysis failed: ${error.message}`);
    }
  }
  
  /**
   * Create a chat completion using conversation messages
   * @param messages Array of conversation messages with roles (system, user, assistant)
   * @param options Additional options (model, temperature, etc.)
   */
  async createChatCompletion(
    messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}>,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      response_format?: {type: string};
    } = {}
  ): Promise<any> {
    try {
      const { model = 'grok-3-mini', temperature = 0.7, max_tokens = 500, response_format = undefined } = options;
      
      const apiOptions: any = {
        model,
        messages,
        temperature,
        max_tokens
      };
      
      if (response_format) {
        apiOptions.response_format = response_format;
      }
      
      const response = await callXAI('/chat/completions', apiOptions);
      return response;
    } catch (error) {
      console.error('Error creating chat completion with Grok:', error);
      throw new Error(`Grok chat completion failed: ${error.message}`);
    }
  }
}

// Create a singleton instance
export const grokApi = new GrokApi();