import OpenAI from 'openai';

// Initialize the OpenAI client with xAI API configuration
const openai = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});

/**
 * Call xAI's Grok API with endpoint and options
 * Direct API call that returns the full API response
 * @param endpoint The API endpoint to call
 * @param options The options to pass to the API
 * @returns The full API response
 */
export async function callXAI(endpoint: string, options: any = {}) {
  try {
    // Set default model if not provided
    if (!options.model) {
      options.model = 'grok-2-1212';
    }
    
    // Make the API call
    const response = await openai.chat.completions.create(options);
    return response;
  } catch (error) {
    console.error("Error calling xAI API:", error);
    throw new Error("Failed to call xAI API: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

/**
 * Generate text using the xAI API
 * @param prompt The prompt to send to the API
 * @param systemPrompt Optional system prompt to guide the model's behavior
 * @param options Additional options (temperature, max_tokens, etc.)
 * @returns The generated text
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  try {
    // Default to grok-3-mini for faster responses unless specified
    const model = options.model || 'grok-2-1212';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const max_tokens = options.max_tokens || 500;
    const system_content = systemPrompt || "You are an AI assistant for Elevion, a web development company specializing in small business websites.";
    
    const messages = [
      {
        role: "system",
        content: system_content
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // Call the API
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating text with xAI API:", error);
    // Return a fallback message when the API fails
    return "Sorry, I'm having trouble accessing the AI service at the moment. Please try again in a moment.";
  }
}

/**
 * Generate a JSON response with xAI API
 * @param prompt The prompt to send to the model
 * @param systemPrompt Optional system prompt to guide the model's behavior
 * @param model Optional model name (defaults to grok-3-mini for faster responses)
 * @returns Parsed JSON response
 */
export async function generateJson<T = any>(
  prompt: string,
  systemPrompt?: string,
  model = 'grok-2-1212'
): Promise<T> {
  try {
    const system_content = systemPrompt || "You are an AI assistant for Elevion, a web development company. Provide concise JSON responses.";
    
    const messages = [
      {
        role: "system",
        content: system_content
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // Call the API with JSON response format
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.3, // Lower temperature for more deterministic JSON outputs
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("Error generating JSON with xAI API:", error);
    throw new Error("Failed to generate JSON: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

/**
 * Generate personalized onboarding tips for users
 * @param businessType Type of business the user runs
 * @param businessGoals The user's business goals 
 * @returns Personalized onboarding tips
 */
export async function generateOnboardingTips(businessType: string, businessGoals: string = ''): Promise<string> {
  const prompt = `
    Generate personalized onboarding tips for a new user with the following business profile:
    - Business Type: ${businessType}
    ${businessGoals ? `- Business Goals: ${businessGoals}` : ''}
    
    Provide 3-5 concise, practical tips that will help this business owner get the most out of Elevion's web development services. Focus on:
    1. First actions they should take
    2. Features most relevant to their business type
    3. How our services can help them achieve their specific goals
    
    Format the response as a bulleted list with a brief intro paragraph.
  `;

  const system_prompt = `
    You are Elevion's intelligent onboarding assistant. Your role is to provide personalized, 
    practical guidance to new users based on their business type and goals. 
    Be concise, specific, and action-oriented. Focus on helping them get value quickly.
  `;

  return generateText(prompt, system_prompt, {
    temperature: 0.7,
    max_tokens: 500
  });
}

/**
 * Analyze user feedback and generate a response
 * @param feedback The user's feedback text
 * @returns Analysis and response to the feedback
 */
export async function analyzeFeedback(feedback: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  response: string;
  priorityLevel: 'low' | 'medium' | 'high';
}> {
  const prompt = `
    Analyze the following customer feedback and provide:
    1. The sentiment (positive, neutral, or negative)
    2. A sentiment score from 1-10 (10 being most positive)
    3. A prioritization level (low, medium, high) based on urgency and importance
    4. A thoughtful response addressing their feedback
    
    Feedback: "${feedback}"
    
    Respond in JSON format with the following structure:
    {
      "sentiment": "positive|neutral|negative",
      "score": 1-10,
      "priorityLevel": "low|medium|high",
      "response": "The response text..."
    }
  `;

  try {
    return await generateJson<{
      sentiment: 'positive' | 'neutral' | 'negative';
      score: number;
      priorityLevel: 'low' | 'medium' | 'high';
      response: string;
    }>(prompt, "You are an expert customer service representative for Elevion, a web development company.");
  } catch (error) {
    console.error("Error generating feedback analysis:", error);
    // Return a fallback response
    return {
      sentiment: 'neutral',
      score: 5,
      priorityLevel: 'medium',
      response: "Thank you for your feedback. We'll review it and get back to you soon."
    };
  }
}

/**
 * Generate marketing content suggestions for businesses
 * @param businessType The type of business
 * @param targetAudience Information about the target audience
 * @param contentType The type of content to generate (email, social, blog)
 * @returns Generated marketing content suggestions
 */
export async function generateMarketingContent(
  businessType: string,
  targetAudience: string,
  contentType: 'email' | 'social' | 'blog' | 'ad'
): Promise<string> {
  const contentPrompts = {
    email: 'Write a compelling email subject line and brief body for a marketing email.',
    social: 'Write an engaging social media post (280 characters or less) with appropriate hashtags.',
    blog: 'Suggest 3 blog post titles and brief outlines that would interest this audience.',
    ad: 'Write a concise, compelling ad copy (headline and body) for an online advertisement.'
  };

  const prompt = `
    Generate ${contentType} content for a ${businessType} business targeting the following audience:
    ${targetAudience}
    
    ${contentPrompts[contentType]}
    
    Make the content specific to this business type and audience. Focus on compelling, conversion-oriented language.
  `;

  const systemPrompt = "You are a marketing expert with experience in content creation for small businesses.";

  return generateText(prompt, systemPrompt, {
    temperature: 0.8,
    max_tokens: 600
  });
}

/**
 * Analyze user or industry data and provide insights
 * @param data The data to analyze (could be usage metrics, industry trends, etc.)
 * @param analysisType The type of analysis to perform
 * @returns Insights from the data
 */
export async function analyzeData(
  data: string,
  analysisType: 'usage' | 'trends' | 'competition' | 'performance'
): Promise<string> {
  const analysisPrompts = {
    usage: 'Analyze this user behavior data and provide insights on usage patterns and improvement opportunities.',
    trends: 'Identify key trends in this industry data and suggest how a business could capitalize on them.',
    competition: 'Analyze this competitive landscape data and suggest positioning strategies.',
    performance: 'Analyze this performance data and suggest optimization strategies.'
  };

  const prompt = `
    ${analysisPrompts[analysisType]}
    
    Data:
    ${data}
    
    Provide clear, actionable insights in a bulleted format.
  `;

  const systemPrompt = "You are a data analyst specializing in business analytics for small businesses.";

  return generateText(prompt, systemPrompt, {
    temperature: 0.4,
    max_tokens: 800
  });
}

/**
 * Generate a business description based on user inputs
 * @param businessType Type of business
 * @param keyFeatures Key features or offerings of the business
 * @param tone The desired tone for the description
 * @returns A business description
 */
export async function generateBusinessDescription(
  businessType: string,
  keyFeatures: string[],
  tone: 'professional' | 'friendly' | 'authoritative' | 'innovative'
): Promise<string> {
  const tonePrompts = {
    professional: 'Use professional, straightforward language that conveys expertise.',
    friendly: 'Use warm, approachable language that builds connection with customers.',
    authoritative: 'Use confident, authoritative language that establishes leadership in the industry.',
    innovative: 'Use forward-thinking language that emphasizes cutting-edge solutions and innovation.'
  };

  const prompt = `
    Write a compelling business description for a ${businessType} business with the following key features:
    - ${keyFeatures.join('\n- ')}
    
    Tone guidance: ${tonePrompts[tone]}
    
    Write 2-3 paragraphs that could be used on a website 'About Us' page.
  `;

  const systemPrompt = `You are a copywriting expert specialized in creating compelling business descriptions 
  that highlight a company's unique value proposition. You excel at crafting text in different tones while 
  maintaining clarity and persuasiveness.`;

  return generateText(prompt, systemPrompt, {
    temperature: 0.7,
    max_tokens: 500
  });
}

// Export specific functions for use in the application
export default {
  callXAI,
  generateOnboardingTips,
  analyzeFeedback,
  generateMarketingContent,
  analyzeData,
  generateBusinessDescription
};