import { callXAI } from './utils/xaiClient';

// Interface for Grok API options
interface GrokApiOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Class for interacting with Grok API
class GrokApi {
  private defaultModel: string = 'grok-3-mini';
  
  /**
   * Generate a text response from Grok
   * 
   * @param prompt The prompt to send to Grok
   * @param systemPrompt Optional system prompt to set the context
   * @param options Additional options for the API call
   * @returns The generated text response
   */
  async generateText(
    prompt: string, 
    systemPrompt: string = '', 
    options: GrokApiOptions = {}
  ): Promise<string> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });
      
      const response: any = await callXAI('/chat/completions', {
        model: options.max_tokens && options.max_tokens > 4000 ? 'grok-3' : this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        top_p: options.top_p ?? 1,
        frequency_penalty: options.frequency_penalty ?? 0,
        presence_penalty: options.presence_penalty ?? 0
      });
      
      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('Error generating text with Grok:', error.message);
      throw new Error(`Grok text generation failed: ${error.message}`);
    }
  }
  
  /**
   * Generate a JSON response from Grok
   * 
   * @param prompt The prompt to send to Grok
   * @param systemPrompt Optional system prompt to set the context
   * @param options Additional options for the API call
   * @returns The parsed JSON response
   */
  async generateJson<T = any>(
    prompt: string, 
    systemPrompt: string = '', 
    options: GrokApiOptions = {}
  ): Promise<T> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });
      
      const response: any = await callXAI('/chat/completions', {
        model: options.max_tokens && options.max_tokens > 4000 ? 'grok-3' : this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.5, // Lower temperature for more consistent JSON
        max_tokens: options.max_tokens,
        top_p: options.top_p ?? 1,
        frequency_penalty: options.frequency_penalty ?? 0,
        presence_penalty: options.presence_penalty ?? 0,
        response_format: { type: 'json_object' }
      });
      
      const jsonText = response.choices[0].message.content;
      return JSON.parse(jsonText);
    } catch (error: any) {
      console.error('Error generating JSON with Grok:', error.message);
      throw new Error(`Grok JSON generation failed: ${error.message}`);
    }
  }
  
  /**
   * Analyze an image with Grok vision
   * 
   * @param base64Image The base64-encoded image data
   * @param prompt The prompt describing what to analyze in the image
   * @param options Additional options for the API call
   * @returns The text analysis of the image
   */
  async analyzeImage(
    base64Image: string,
    prompt: string = 'Describe this image in detail',
    options: GrokApiOptions = {}
  ): Promise<string> {
    try {
      const response: any = await callXAI('/chat/completions', {
        model: 'grok-vision-latest',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 500
      });
      
      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('Error analyzing image with Grok:', error.message);
      throw new Error(`Grok image analysis failed: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
export const grokApi = new GrokApi();