import { callXAI, generateText } from './xaiClient';
import NodeCache from 'node-cache';

// Cache error messages for 1 hour
const errorMessageCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  useClones: false
});

/**
 * Interface for error details 
 */
export interface ErrorDetails {
  errorCode: string;
  errorMessage: string;
  userFriendlyMessage: string;
  troubleshootingSteps: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  potentialCauses: string[];
}

/**
 * Generates a user-friendly error message and troubleshooting steps using XAI
 * 
 * @param error The original error object or message
 * @param context Additional context about what the user was doing
 * @returns User-friendly error details
 */
export async function generateFriendlyErrorMessage(
  error: Error | string,
  context?: string
): Promise<ErrorDetails> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : '';
  
  // Create a cache key from the error message and stack trace
  const cacheKey = `error_${Buffer.from(errorMessage + errorStack).toString('base64')}`;
  
  // Check if we have a cached response
  const cachedResponse = errorMessageCache.get<ErrorDetails>(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Generate error details using XAI
    const response = await generateText({
      model: 'grok-3-mini',
      systemPrompt: `
        You are an expert technical support specialist who helps users understand and solve technical errors.
        Your job is to translate technical errors into user-friendly messages and provide helpful troubleshooting steps.
        Always be empathetic, clear, and provide actionable suggestions.
      `,
      prompt: `
        Analyze this technical error and provide a user-friendly explanation and troubleshooting steps:
        
        Error Message: ${errorMessage}
        
        Error Stack: ${errorStack || 'Not available'}
        
        User Context: ${context || 'User was using the application'}
        
        Respond with valid JSON in this exact format:
        {
          "errorCode": "A short code representing this error type",
          "errorMessage": "The original error message",
          "userFriendlyMessage": "A clear, non-technical explanation of what went wrong",
          "troubleshootingSteps": ["Step 1", "Step 2", "Step 3"],
          "severity": "low|medium|high|critical",
          "potentialCauses": ["Potential cause 1", "Potential cause 2"]
        }
      `
    });
    
    // Parse the JSON response
    const errorDetails = JSON.parse(response) as ErrorDetails;
    
    // Cache the response
    errorMessageCache.set(cacheKey, errorDetails);
    
    return errorDetails;
  } catch (err) {
    // Fallback if XAI fails
    console.error('Failed to generate friendly error message:', err);
    
    return {
      errorCode: 'ERR_UNKNOWN',
      errorMessage: errorMessage,
      userFriendlyMessage: 'Something went wrong. Our team has been notified.',
      troubleshootingSteps: [
        'Try refreshing the page',
        'Check your internet connection',
        'Try again later'
      ],
      severity: 'medium',
      potentialCauses: ['Temporary system issue']
    };
  }
}

/**
 * Logs the error and generates a user-friendly response
 * 
 * @param error The error object or message
 * @param context Additional context about what the user was doing
 * @param userId Optional user ID for tracking
 * @returns User-friendly error details
 */
export async function handleError(
  error: Error | string,
  context?: string,
  userId?: number
): Promise<ErrorDetails> {
  // Log the error for tracking
  console.error(`Error occurred${userId ? ` for user ${userId}` : ''}:`, error);
  
  // Get user-friendly error details
  const errorDetails = await generateFriendlyErrorMessage(error, context);
  
  // TODO: Add error to database or monitoring system
  
  return errorDetails;
}

/**
 * Clear the error message cache
 */
export function clearErrorCache(): void {
  errorMessageCache.flushAll();
}