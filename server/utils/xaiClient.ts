import axios from 'axios';

// Check if the XAI_API_KEY environment variable is set
if (!process.env.XAI_API_KEY) {
  console.warn('Warning: XAI_API_KEY environment variable is not set. xAI API calls will fail.');
}

const XAI_API_BASE_URL = 'https://api.x.ai/v1';

/**
 * Makes a call to the xAI API
 * @param endpoint The endpoint to call (e.g., '/chat/completions')
 * @param data The request payload
 * @returns The API response
 */
export async function callXAI(endpoint: string, data: any): Promise<any> {
  try {
    const response = await axios.post(`${XAI_API_BASE_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    // Enhanced error handling for better debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('xAI API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      
      throw {
        message: error.response.data?.error?.message || 'Error from xAI API',
        status: error.response.status,
        response: error.response
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('xAI API no response:', error.request);
      throw new Error('No response received from xAI API');
    } else {
      // Something happened in setting up the request
      console.error('xAI API request setup error:', error.message);
      throw new Error(`Error setting up xAI API request: ${error.message}`);
    }
  }
}

/**
 * Analyzes text with the specified model
 * @param text The text to analyze
 * @param model The model to use (defaults to grok-3-mini)
 * @param systemPrompt Optional system prompt for context
 * @returns The generated text
 */
export async function generateText(
  text: string,
  model: string = 'grok-3-mini',
  systemPrompt?: string
): Promise<string> {
  try {
    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      : [
          { role: 'user', content: text }
        ];
    
    const response = await callXAI('/chat/completions', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response format from xAI API');
    }
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text with xAI:', error);
    throw error;
  }
}

/**
 * Analyzes an image with Grok Vision
 * @param base64Image The base64-encoded image
 * @param prompt The prompt describing what to analyze in the image
 * @returns The generated text
 */
export async function analyzeImage(
  base64Image: string,
  prompt: string = 'Describe this image in detail.'
): Promise<string> {
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-2-vision-1212',
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
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response format from xAI API');
    }
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image with xAI:', error);
    throw error;
  }
}

/**
 * Generates JSON with a specified schema using Grok
 * @param prompt The user prompt
 * @param systemPrompt Optional system prompt for context
 * @returns The generated JSON object
 */
export async function generateJson<T = any>(
  prompt: string,
  systemPrompt: string = 'You must respond with valid JSON only. No explanations or text outside of the JSON structure.'
): Promise<T> {
  try {
    const response = await callXAI('/chat/completions', {
      model: 'grok-3-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2000
    });
    
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response format from xAI API');
    }
    
    const content = response.choices[0].message.content;
    
    // Parse JSON content
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from xAI API');
    }
  } catch (error) {
    console.error('Error generating JSON with xAI:', error);
    throw error;
  }
}