import { grokApi } from '../grok';

/**
 * Use XAI to subtly watermark text content with Elevion branding
 * The watermark is designed to be non-intrusive but detectable
 * 
 * @param content The original content text to watermark
 * @param brandName The brand name to use in watermarking (defaults to Elevion)
 * @returns Watermarked text content
 */
export async function watermarkText(content: string, brandName: string = 'Elevion'): Promise<string> {
  try {
    const prompt = `
      You are a content watermarking expert. Add subtle, hidden watermarks to this content 
      that invisibly tie it to ${brandName}. The watermarks should:
      
      1. Not alter the meaning or main appearance of the content
      2. Be detectable by AI analysis when specifically looking for them
      3. Use techniques like:
         - Strategic word choice patterns
         - Very subtle linguistic steganography
         - Imperceptible paragraph or sentence structures that encode ownership
         - Creative use of spacing, punctuation or capitalization patterns
      
      DO NOT add visible copyright notices, disclaimers, or brand mentions.
      DO NOT mention watermarking or that you've added watermarks.
      Simply return the watermarked version of the entire content:
      
      ${content}
    `;
    
    const watermarkedContent = await grokApi.analyzeText(prompt);
    return watermarkedContent;
  } catch (error) {
    console.error('Error watermarking content:', error);
    // Return original content if watermarking fails
    return content;
  }
}

/**
 * Detect if content has been watermarked with Elevion branding
 * 
 * @param content Text content to analyze
 * @param brandName The brand name to check for (defaults to Elevion)
 * @returns Analysis of whether the content contains watermarking
 */
export async function detectWatermark(content: string, brandName: string = 'Elevion'): Promise<{
  isWatermarked: boolean;
  confidence: number;
  detectionDetails?: string;
}> {
  try {
    const prompt = `
      You are a forensic content analyst specialized in detecting subtle watermarks.
      Analyze this content and determine if it contains hidden watermarks or 
      steganographic features that indicate it belongs to ${brandName}.
      
      Look for:
      - Strategic word choice patterns
      - Subtle linguistic steganography
      - Unusual paragraph or sentence structures that encode ownership
      - Patterns in spacing, punctuation or capitalization
      
      Content to analyze:
      ${content}
      
      Respond in JSON format with:
      1. isWatermarked: boolean
      2. confidence: number between 0 and 1
      3. detectionDetails: a brief explanation of what was detected, if anything
    `;
    
    const result = await grokApi.generateJson(prompt);
    return {
      isWatermarked: result.isWatermarked || false,
      confidence: result.confidence || 0,
      detectionDetails: result.detectionDetails
    };
  } catch (error) {
    console.error('Error detecting watermark:', error);
    // Return default fallback response if detection fails
    return {
      isWatermarked: false,
      confidence: 0,
      detectionDetails: 'Error analyzing content for watermarks'
    };
  }
}