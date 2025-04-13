import OpenAI from 'openai';

// Initialize the OpenAI client with the XAI API base URL
const openai = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY,
});

// Function to call XAI endpoints directly
export async function callXAI(endpoint: string, data: any) {
  try {
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY environment variable is not set');
    }

    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Make API call directly using the OpenAI instance
    const response = await openai.request({
      method: 'POST',
      path,
      body: data,
    });

    return response;
  } catch (error) {
    console.error('XAI API call error:', error);
    throw error;
  }
}

// Helper function to generate text using XAI models
export async function generateText(prompt: string, options: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
} = {}) {
  try {
    const {
      model = 'grok-3-mini',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt,
    } = options;

    const messages = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('XAI text generation error:', error);
    throw error;
  }
}

// Helper function to generate structured JSON using XAI models
export async function generateJson<T>(prompt: string, options: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
} = {}): Promise<T> {
  try {
    const {
      model = 'grok-3-mini',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant that responds with JSON only. Format your response as a valid JSON object.',
    } = options;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: 'json_object' },
    });

    const jsonString = response.choices[0].message.content;
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (error) {
    console.error('XAI JSON generation error:', error);
    throw error;
  }
}

// Function to analyze image with XAI vision models
export async function analyzeImage(imageBase64: string, prompt: string, options: {
  model?: string;
  maxTokens?: number;
} = {}) {
  try {
    const {
      model = 'grok-2-vision-1212',
      maxTokens = 1000,
    } = options;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('XAI image analysis error:', error);
    throw error;
  }
}

// Function to validate user profile changes
export async function validateUserProfileChanges(changes: any, userData: any) {
  try {
    // Generate system prompt for validation
    const systemPrompt = `You are a security expert specializing in detecting suspicious or inappropriate content 
    in user profile changes. Your task is to analyze the requested changes to a user's profile and determine if they 
    are appropriate and safe. Return a JSON object with the following structure:
    {
      "isValid": boolean,
      "issues": string[],
      "suggestions": string[]
    }`;

    // Build the prompt for analysis
    const prompt = `
    Current user data:
    ${JSON.stringify(userData, null, 2)}
    
    Requested changes:
    ${JSON.stringify(changes, null, 2)}
    
    Analyze these changes and determine if they are appropriate. Look for:
    1. Inappropriate content or offensive language
    2. Attempts to impersonate others (especially in name changes)
    3. Security risks in the information being added
    4. Privacy concerns in the information being shared
    `;

    // Call XAI for validation
    const validationResult = await generateJson<{
      isValid: boolean;
      issues: string[];
      suggestions: string[];
    }>(prompt, {
      model: 'grok-3-mini',
      systemPrompt,
      temperature: 0.3,
    });

    return validationResult;
  } catch (error) {
    console.error('Error validating user profile changes:', error);
    // Default to allowing changes if validation fails
    return { isValid: true, issues: [], suggestions: [] };
  }
}

// Function to analyze user data changes for insights and recommendations
export async function analyzeUserDataChanges(oldData: any, newData: any) {
  try {
    // Generate system prompt for analysis
    const systemPrompt = `You are an AI analyst specializing in user behavior and preferences. 
    Your task is to analyze changes in user data to identify meaningful shifts in preferences, 
    interests, or behavior that could inform personalization and recommendations. Return a JSON object with:
    {
      "significantChanges": string[],
      "suggestedActions": string[],
      "recommendedFeatures": string[],
      "personalizationInsights": string[]
    }`;

    // Build the prompt for analysis
    const prompt = `
    Previous user data:
    ${JSON.stringify(oldData, null, 2)}
    
    New user data:
    ${JSON.stringify(newData, null, 2)}
    
    Analyze these changes to identify:
    1. Significant shifts in user preferences or interests
    2. New areas of interest based on profile updates
    3. Changes that suggest different feature needs
    4. Personalization opportunities based on the updated profile
    `;

    // Call XAI for analysis
    const analysisResult = await generateJson<{
      significantChanges: string[];
      suggestedActions: string[];
      recommendedFeatures: string[];
      personalizationInsights: string[];
    }>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.4,
    });

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing user data changes:', error);
    // Return empty analysis if it fails
    return {
      significantChanges: [],
      suggestedActions: [],
      recommendedFeatures: [],
      personalizationInsights: []
    };
  }
}

export default {
  callXAI,
  generateText,
  generateJson,
  analyzeImage,
  validateUserProfileChanges,
  analyzeUserDataChanges
};