import { callXAI } from './xaiClient';

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
      I need to subtly watermark this text content with "${brandName}" branding in a way that's 
      non-intrusive but would make the content attributable to our brand if copied.

      Original content:
      """
      ${content}
      """

      Please apply ONE of these techniques (choose the most appropriate):
      1. Modify the wording slightly to include subtle references to ${brandName} where natural
      2. Add a subtle signature phrase at the end that flows with the content
      3. Structure paragraphs so their first letters subtly spell out ${brandName} (acrostic)
      4. Insert small contextual examples that reference ${brandName} services
      5. Subtly adjust text to include ${brandName}'s core values (innovation, excellence, etc.)

      DO NOT:
      - Add obvious copyright notices
      - Change the meaning of the text
      - Add obvious watermark text
      - Make the watermarking obvious or distracting
      - Change more than 10% of the original text

      The watermarking should be subtle enough that readers don't notice it's there 
      but distinctive enough that it can be identified as ${brandName} content if analyzed.
    `;

    const systemPrompt = `
      You are a content protection specialist who creates subtle text watermarks 
      to protect brand content while maintaining readability and natural flow.
      Your watermarks should be nearly invisible to casual readers but detectable 
      with analysis. Always maintain the original meaning and tone.
    `;

    const response = await callXAI('/chat/completions', {
      model: 'grok-2-1212',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Keep temperature low for more consistent results
    });

    // Extract the watermarked content from the response
    const watermarkedContent = response.choices[0].message.content.trim();
    
    // Return the watermarked content
    return watermarkedContent;
  } catch (error) {
    console.error('Error watermarking text:', error);
    // If watermarking fails, return the original content
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
  confidenceScore: number;
  detectionMethod: string;
}> {
  try {
    const prompt = `
      Analyze this text content to determine if it has been subtly watermarked with "${brandName}" branding.
      
      Content to analyze:
      """
      ${content}
      """

      Look for these potential watermarking techniques:
      1. Subtle references to ${brandName} or its services
      2. Signature phrases that indicate ${brandName} content
      3. First letters of paragraphs or sentences spelling patterns related to ${brandName} (acrostic)
      4. Examples or contexts that reference ${brandName}
      5. Word choices that align with ${brandName}'s core values

      Provide a JSON response with:
      - isWatermarked: true/false
      - confidenceScore: number between 0-1
      - detectionMethod: brief description of how you detected the watermark (or why you believe it's not watermarked)
    `;

    const systemPrompt = `
      You are a forensic content analyst specializing in detecting subtle text watermarks.
      Be objective and provide clear evidence for your determination.
      Always respond with valid JSON in the exact format requested.
    `;

    const response = await callXAI('/chat/completions', {
      model: 'grok-2-1212',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    return {
      isWatermarked: !!analysisResult.isWatermarked,
      confidenceScore: Number(analysisResult.confidenceScore) || 0,
      detectionMethod: analysisResult.detectionMethod || 'Analysis inconclusive'
    };
  } catch (error) {
    console.error('Error detecting watermark:', error);
    // Return a default response if analysis fails
    return {
      isWatermarked: false,
      confidenceScore: 0,
      detectionMethod: 'Analysis failed due to technical error'
    };
  }
}