import OpenAI from 'openai';

// Define the API options for text generation
interface TextGenerationOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// Define the API options for JSON generation
interface JsonGenerationOptions<T> {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// Make sure we have the API key
if (!process.env.XAI_API_KEY) {
  console.warn('No XAI_API_KEY found in environment. AI-powered features will not work.');
}

// Initialize the OpenAI client with Elevion AI configuration
const openai = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY,
});

// GrokAPI class for interaction with Elevion AI
class GrokApi {
  // Generate text based on a prompt
  async generateText({
    prompt,
    model = 'grok-2-mini',
    maxTokens = 1500,
    temperature = 0.7,
    systemPrompt = 'You are a helpful, precise, and advanced AI assistant.',
  }: TextGenerationOptions): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating text with Grok API:', error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  // Generate structured JSON data
  async generateJson<T>({
    prompt,
    model = 'grok-2-mini',
    maxTokens = 1500,
    temperature = 0.3,
    systemPrompt = 'You are a helpful, precise AI assistant. Respond to the prompt with properly structured JSON.',
  }: JsonGenerationOptions<T>): Promise<T> {
    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      console.error('Error generating JSON with Grok API:', error);
      
      // Return empty object structure for graceful fallback
      if (error.message.includes('parse')) {
        console.error('Parsing error. Raw content:', error.message);
        return {} as T;
      }
      
      throw new Error(`Failed to generate JSON: ${error.message}`);
    }
  }

  // Analyze image (if using vision model)
  async analyzeImage(
    base64Image: string,
    prompt: string,
    model = 'grok-2-vision-1212'
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error analyzing image with Grok API:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
}

// Export singleton instance
export const grokApi = new GrokApi();