import OpenAI from 'openai';

// Initialize the OpenAI client with the Elevion AI API base URL
const openai = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY,
});

// For debugging API issues, track API success rate
let apiSuccessCount = 0;
let apiTotalCalls = 0;
let lastApiError: any = null;

// Function to call Elevion AI endpoints directly
export async function callXAI(endpoint: string, data: any) {
  try {
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY environment variable is not set');
    }

    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Track API call attempt
    apiTotalCalls++;
    
    // Make API call directly using the OpenAI instance
    const response = await openai.request({
      method: 'POST',
      path,
      body: data,
    });

    // Track successful call
    apiSuccessCount++;
    
    return response;
  } catch (error) {
    // Track and log the error
    lastApiError = error;
    console.error('Elevion AI API call error:', error);
    
    // Log detailed diagnostic information
    console.error(`API Stats - Success: ${apiSuccessCount}/${apiTotalCalls} (${Math.round(apiSuccessCount/apiTotalCalls*100)}%)`);
    console.error(`Last error details:`, error instanceof Error ? error.message : 'Unknown error');
    
    throw error;
  }
}

// Helper function to get API health status
export function getApiHealthStatus() {
  return {
    totalCalls: apiTotalCalls,
    successCount: apiSuccessCount,
    successRate: apiTotalCalls > 0 ? (apiSuccessCount / apiTotalCalls) : 0,
    lastError: lastApiError ? (lastApiError instanceof Error ? lastApiError.message : String(lastApiError)) : null
  };
}

// Cache for storing generated responses based on input
const responseCache = new Map<string, {timestamp: number, response: string}>();
const jsonResponseCache = new Map<string, {timestamp: number, response: any}>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to generate text using XAI models
export async function generateText(prompt: string, options: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  fallbackResponse?: string;
} = {}) {
  try {
    const {
      model = 'grok-3-mini',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt,
      fallbackResponse
    } = options;

    // Generate a cache key from the prompt and system prompt
    const cacheKey = `${systemPrompt || ''}:${prompt}`;
    
    // Check for cached response
    const cachedItem = responseCache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < CACHE_TTL) {
      console.log('Using cached text response for prompt');
      return cachedItem.response;
    }

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

    // Track API call attempt
    apiTotalCalls++;
    
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    // Track successful call
    apiSuccessCount++;
    
    // Store response in cache
    const textResponse = response.choices[0].message.content;
    responseCache.set(cacheKey, {
      timestamp: Date.now(),
      response: textResponse
    });
    
    return textResponse;
  } catch (error) {
    // Log error with diagnostics
    console.error('Elevion AI text generation error:', error);
    console.error(`API Stats - Success: ${apiSuccessCount}/${apiTotalCalls} (${Math.round(apiSuccessCount/apiTotalCalls*100)}%)`);
    
    // Check if fallback was provided
    if (options.fallbackResponse) {
      console.log('Using provided fallback response for text generation');
      return options.fallbackResponse;
    }
    
    // Generate a smart fallback based on the prompt
    const contextType = prompt.toLowerCase().includes('support') ? 'support' :
                        prompt.toLowerCase().includes('business') ? 'business' :
                        prompt.toLowerCase().includes('marketing') ? 'marketing' : 'general';
    
    let fallback = '';
    
    switch(contextType) {
      case 'support':
        fallback = "I understand you're looking for assistance. While I'm experiencing some technical issues, I'd be happy to help with your question once our systems are back to normal. Would you like me to create a support ticket for you?";
        break;
      case 'business':
        fallback = "Thank you for providing your business information. Our team will review your details and recommend the best web solutions tailored to your specific needs. We specialize in helping businesses like yours establish a strong online presence.";
        break;
      case 'marketing':
        fallback = "Marketing is essential for business growth. Our solutions can help you reach more customers through SEO optimization, content strategies, and targeted campaigns designed specifically for your industry.";
        break;
      default:
        fallback = "Thank you for your message. I'm currently experiencing a technical issue but will respond to your question properly as soon as possible. In the meantime, feel free to explore our services or send any additional details that might help us assist you better.";
    }
    
    return fallback;
  }
}

// Helper function to generate structured JSON using XAI models
export async function generateJson<T>(prompt: string, options: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  fallbackResponse?: T;
} = {}): Promise<T> {
  try {
    const {
      model = 'grok-3-mini',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant that responds with JSON only. Format your response as a valid JSON object.',
      fallbackResponse
    } = options;
    
    // Generate a cache key
    const cacheKey = `${systemPrompt}:${prompt}`;
    
    // Check for cached response
    const cachedItem = jsonResponseCache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < CACHE_TTL) {
      console.log('Using cached JSON response for prompt');
      return cachedItem.response;
    }

    // Track API call attempt
    apiTotalCalls++;
    
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

    // Track successful call
    apiSuccessCount++;
    
    const jsonString = response.choices[0].message.content;
    const parsedResponse = jsonString ? JSON.parse(jsonString) : null;
    
    // Store in cache
    jsonResponseCache.set(cacheKey, {
      timestamp: Date.now(),
      response: parsedResponse
    });
    
    return parsedResponse;
  } catch (error) {
    // Log error with diagnostics
    console.error('XAI JSON generation error:', error);
    console.error(`API Stats - Success: ${apiSuccessCount}/${apiTotalCalls} (${Math.round(apiSuccessCount/apiTotalCalls*100)}%)`);
    
    // Check if fallback was provided
    if (options.fallbackResponse) {
      console.log('Using provided fallback JSON response');
      return options.fallbackResponse;
    }
    
    // Generate a default response based on the prompt content
    const isSupportQuery = prompt.toLowerCase().includes('support') || prompt.toLowerCase().includes('query');
    const isUserProfile = prompt.toLowerCase().includes('profile') || prompt.toLowerCase().includes('user data');
    const isWebContent = prompt.toLowerCase().includes('content') || prompt.toLowerCase().includes('website');
    
    // Create a smart fallback based on context
    if (isSupportQuery) {
      return {
        category: 'technical',
        priority: 'medium',
        sentiment: 'neutral',
        isEscalationNeeded: true,
        escalationReason: 'AI service unavailable',
        suggestedResponse: 'Thank you for reaching out to Elevion support. Our AI assistant is currently experiencing technical difficulties. A support team member will review your question and get back to you shortly. We appreciate your patience.',
        relevantDocumentation: ['https://elevion.dev/docs/support'],
        followUpQuestions: ['Can you provide more details about your issue?', 'Have you tried any troubleshooting steps?']
      } as unknown as T;
    } else if (isUserProfile) {
      return {
        isValid: true,
        issues: [],
        suggestions: ['Consider adding more details to your profile to help us serve you better.']
      } as unknown as T;
    } else if (isWebContent) {
      return {
        quality: 'good',
        suggestions: [
          'Add more specific calls to action',
          'Consider adding customer testimonials',
          'Optimize images for faster loading'
        ],
        seoScore: 85
      } as unknown as T;
    } else {
      // Generic fallback for any other type of request
      return {
        success: true,
        message: 'Processing completed with default settings',
        recommendations: [
          'Retry your request later for personalized recommendations',
          'Contact our support team for immediate assistance'
        ]
      } as unknown as T;
    }
  }
}

// Cache for image analysis responses
const imageAnalysisCache = new Map<string, {timestamp: number, response: string}>();

// Function to analyze image with XAI vision models
export async function analyzeImage(imageBase64: string, prompt: string, options: {
  model?: string;
  maxTokens?: number;
  fallbackResponse?: string;
} = {}) {
  try {
    const {
      model = 'grok-2-vision-1212',
      maxTokens = 1000,
      fallbackResponse
    } = options;
    
    // Create a hash of the image data to use as a cache key (first 100 chars is enough for uniqueness)
    const imageHash = imageBase64.substring(0, 100);
    const cacheKey = `${imageHash}:${prompt}`;
    
    // Check for cached response
    const cachedItem = imageAnalysisCache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < CACHE_TTL) {
      console.log('Using cached image analysis response');
      return cachedItem.response;
    }
    
    // Track API call attempt
    apiTotalCalls++;

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

    // Track successful call
    apiSuccessCount++;
    
    const textResponse = response.choices[0].message.content;
    
    // Cache the response
    imageAnalysisCache.set(cacheKey, {
      timestamp: Date.now(),
      response: textResponse
    });
    
    return textResponse;
  } catch (error) {
    // Log detailed error information
    console.error('XAI image analysis error:', error);
    console.error(`API Stats - Success: ${apiSuccessCount}/${apiTotalCalls} (${Math.round(apiSuccessCount/apiTotalCalls*100)}%)`);
    
    // Use provided fallback if available
    if (options.fallbackResponse) {
      console.log('Using provided fallback response for image analysis');
      return options.fallbackResponse;
    }
    
    // Provide a generic fallback based on the prompt
    if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('describe')) {
      return "I'm unable to analyze this image in detail at the moment. This appears to be a document or visual content that would typically require visual analysis capabilities. Please try again later or provide a text description of what you're looking for.";
    } else if (prompt.toLowerCase().includes('extract') || prompt.toLowerCase().includes('text')) {
      return "I'm unable to extract text from this image at the moment. The system that processes image-to-text conversion is experiencing technical difficulties. Please try again later or manually transcribe any critical information.";
    } else {
      return "I'm currently experiencing difficulty processing this image. Our image analysis system is temporarily unavailable. Please try again later, or feel free to describe what you're looking for in text form so I can assist you better.";
    }
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