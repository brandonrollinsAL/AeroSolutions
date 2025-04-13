import express, { type Request, type Response } from "express";
import { body, validationResult } from 'express-validator';
import { grokApi } from "../grok";

const router = express.Router();

// Define validation rules for quote generation requests
const quoteValidationRules = [
  body('businessType').notEmpty().withMessage('Business type is required'),
  body('selectedFeatures').isArray({ min: 1 }).withMessage('At least one feature must be selected'),
];

// Generate a quote based on business type and selected features
router.post("/generate-quote", quoteValidationRules, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote request data",
        errors: errors.array()
      });
    }

    const { 
      businessType, 
      businessName, 
      businessDescription, 
      currentWebsite, 
      selectedFeatures 
    } = req.body;

    console.log("Quote request:", { businessType, businessName, selectedFeatures });

    // Use Grok AI to analyze the business and generate insights
    const systemPrompt = `You are a web development pricing expert at Elevion, a premier web development company. 
    Your goal is to generate accurate price quotes for potential clients based on their business type and selected features.
    Always provide competitive pricing (60% of market average) while ensuring we make a reasonable profit.`;

    // Format the request for the AI model to analyze
    const prompt = `
    Generate a detailed quote for a ${businessType} business${businessName ? ` called "${businessName}"` : ''}.
    ${businessDescription ? `Business description: ${businessDescription}` : ''}
    ${currentWebsite ? `Current website: ${currentWebsite}` : ''}
    
    Selected features:
    ${selectedFeatures.map((feature: { name: string, basePrice: number }) => 
      `- ${feature.name} (base cost: $${feature.basePrice})`
    ).join('\n')}
    
    Please include:
    1. Base price for all selected features
    2. The estimated market price (what competitors would charge)
    3. Our discounted price (60% of market price)
    4. A breakdown of each feature with market price and our price
    5. Business-specific insights based on the business type and selected features
    6. An estimated timeline for completion

    Return the results as a JSON object with the following structure:
    {
      "basePrice": number,
      "marketPrice": number,
      "discountedPrice": number,
      "breakdown": [{ "feature": string, "marketPrice": number, "ourPrice": number }],
      "businessInsights": string,
      "timeEstimate": string
    }
    `;

    try {
      // Use Grok to generate a JSON response
      const quoteData = await grokApi.generateJson(prompt, systemPrompt);
      
      res.status(200).json(quoteData);
    } catch (aiError) {
      console.error("Error generating AI quote:", aiError);
      
      // Fallback to basic calculation if AI fails
      const basePrice = selectedFeatures.reduce((total: number, feature: { name: string, basePrice: number }) => total + feature.basePrice, 1000);
      const marketPrice = Math.round(basePrice * 1.3);
      const discountedPrice = Math.round(basePrice * 0.6);
      
      const fallbackQuote = {
        basePrice,
        marketPrice,
        discountedPrice,
        breakdown: selectedFeatures.map((feature: { name: string, basePrice: number }) => ({
          feature: feature.name,
          marketPrice: Math.round(feature.basePrice * 1.3),
          ourPrice: Math.round(feature.basePrice * 0.6)
        })),
        businessInsights: `Based on standard industry pricing for ${businessType} websites with your selected features.`,
        timeEstimate: `${Math.ceil(selectedFeatures.length * 1.5)} weeks`
      };
      
      res.status(200).json(fallbackQuote);
    }
  } catch (error) {
    console.error("Quote generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    res.status(500).json({
      success: false,
      message: "Failed to generate quote",
      error: errorMessage
    });
  }
});

export default router;