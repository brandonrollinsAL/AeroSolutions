import { generateJson, generateText } from './xaiClient';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { 
  mockupRequests, 
  generatedMockups, 
  InsertGeneratedMockup 
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// Define the available templates
export const MOCKUP_TEMPLATES = {
  BUSINESS_LANDING: 'business-landing',
  ECOMMERCE: 'ecommerce-store',
  PORTFOLIO: 'portfolio',
  BLOG: 'blog-standard',
  BLOG_STANDARD: 'blog-standard', // Alias for BLOG for consistency
  SERVICE_SHOWCASE: 'service-showcase',
  RESTAURANT: 'restaurant-menu',
  PROFESSIONAL: 'professional-services',
  EVENT: 'event-landing',
  APP_PROMO: 'app-promo',
  STARTUP: 'startup-homepage'
};

// Template to industry mapping for better recommendations
const INDUSTRY_TEMPLATE_MAPPING = {
  'technology': [MOCKUP_TEMPLATES.BUSINESS_LANDING, MOCKUP_TEMPLATES.APP_PROMO, MOCKUP_TEMPLATES.STARTUP],
  'retail': [MOCKUP_TEMPLATES.ECOMMERCE, MOCKUP_TEMPLATES.BUSINESS_LANDING],
  'food': [MOCKUP_TEMPLATES.RESTAURANT, MOCKUP_TEMPLATES.BUSINESS_LANDING],
  'creative': [MOCKUP_TEMPLATES.PORTFOLIO, MOCKUP_TEMPLATES.BLOG_STANDARD],
  'professional': [MOCKUP_TEMPLATES.PROFESSIONAL, MOCKUP_TEMPLATES.SERVICE_SHOWCASE],
  'events': [MOCKUP_TEMPLATES.EVENT, MOCKUP_TEMPLATES.BUSINESS_LANDING],
  'healthcare': [MOCKUP_TEMPLATES.PROFESSIONAL, MOCKUP_TEMPLATES.SERVICE_SHOWCASE],
  'education': [MOCKUP_TEMPLATES.SERVICE_SHOWCASE, MOCKUP_TEMPLATES.BLOG_STANDARD],
  'hospitality': [MOCKUP_TEMPLATES.RESTAURANT, MOCKUP_TEMPLATES.EVENT],
  'construction': [MOCKUP_TEMPLATES.PROFESSIONAL, MOCKUP_TEMPLATES.SERVICE_SHOWCASE],
  'finance': [MOCKUP_TEMPLATES.PROFESSIONAL, MOCKUP_TEMPLATES.BUSINESS_LANDING],
  'beauty': [MOCKUP_TEMPLATES.SERVICE_SHOWCASE, MOCKUP_TEMPLATES.PORTFOLIO],
  'fitness': [MOCKUP_TEMPLATES.SERVICE_SHOWCASE, MOCKUP_TEMPLATES.EVENT],
  'real-estate': [MOCKUP_TEMPLATES.PROFESSIONAL, MOCKUP_TEMPLATES.PORTFOLIO],
  // Add more as needed
};

// Component mappings for different sections of a page
const TEMPLATE_COMPONENTS = {
  'hero': ['HeroBasic', 'HeroCentered', 'HeroWithImage', 'HeroWithVideo', 'HeroWithForm'],
  'features': ['FeaturesGrid', 'FeaturesCards', 'FeaturesWithIcons', 'FeaturesWithImages'],
  'testimonials': ['TestimonialsCards', 'TestimonialsCarousel', 'TestimonialsQuotes'],
  'pricing': ['PricingCards', 'PricingSimple', 'PricingTiers'],
  'cta': ['CtaBasic', 'CtaWithImage', 'CtaWithForm'],
  'contact': ['ContactForm', 'ContactInfo', 'ContactMap'],
  'navigation': ['NavbarSimple', 'NavbarWithDropdown', 'NavbarCentered'],
  'footer': ['FooterBasic', 'FooterMultiColumn', 'FooterWithNewsletter'],
};

/**
 * Analyzes a mockup request and generates a suitable mockup suggestion
 */
export async function analyzeMockupRequest(requestId: number) {
  try {
    // Retrieve the mockup request from the database
    const [request] = await db
      .select()
      .from(mockupRequests)
      .where(eq(mockupRequests.id, requestId));

    if (!request) {
      throw new Error('Mockup request not found');
    }

    // Analyze the request using XAI to determine the most suitable template
    const analysisPrompt = `
      Analyze the following business website mockup request and recommend the best template and components:
      
      Business Type: ${request.businessType}
      Business Goals: ${request.businessGoals || 'Not specified'}
      Industry Category: ${request.industryCategory || 'Not specified'}
      Target Audience: ${request.targetAudience || 'Not specified'}
      Design Preferences: ${request.designPreferences || 'Not specified'}
      
      Based on this information, analyze what kind of website would best serve this business
      and recommend:
      1. The most suitable template from this list: ${Object.values(MOCKUP_TEMPLATES).join(', ')}
      2. A color scheme (provide hex colors for primary, secondary, accent, background, and text)
      3. Font recommendations (heading and body)
      4. Key components to include on the homepage
      5. Structure and layout recommendations
      6. Content suggestions for main sections
      
      Return your analysis as JSON with the following structure:
      {
        "recommendedTemplate": string, // one of the template names from the list
        "industryRelevanceScore": number, // 1-10 score of how well this matches the industry
        "conversionOptimizationScore": number, // 1-10 score of potential conversion effectiveness
        "colorScheme": {
          "primary": string, // hex color
          "secondary": string, // hex color
          "accent": string, // hex color
          "background": string, // hex color
          "text": string // hex color
        },
        "typography": {
          "headingFont": string,
          "bodyFont": string
        },
        "components": {
          "hero": string, // specific component recommendation
          "features": string,
          "testimonials": string,
          "pricing": string,
          "cta": string,
          "contact": string,
          "navigation": string,
          "footer": string
        },
        "contentSuggestions": {
          "heroHeadline": string,
          "heroSubheadline": string,
          "featuresSection": string[],
          "testimonialsSection": string[],
          "ctaText": string
        },
        "layoutStructure": string[],
        "analysisNotes": string
      }
    `;

    const systemPrompt = `
      You are an expert web designer and business consultant specializing in creating effective,
      conversion-optimized websites that match business goals and industry standards.
      Your recommendations should be data-driven, focused on user experience, and aligned with
      modern web design principles.
    `;

    // Call the XAI API to analyze the request
    const analysis = await generateJson(analysisPrompt, systemPrompt);

    // Generate a mockup based on the analysis
    return await generateMockup(requestId, analysis);
  } catch (error) {
    console.error('Error analyzing mockup request:', error);
    throw error;
  }
}

/**
 * Generates a mockup based on the XAI analysis
 */
async function generateMockup(requestId: number, analysis: any): Promise<number> {
  try {
    // Generate a unique access token for secure sharing
    const accessToken = uuidv4();

    // Prepare mockup data
    const mockupData = {
      template: analysis.recommendedTemplate,
      colorScheme: analysis.colorScheme,
      typography: analysis.typography,
      components: analysis.components,
      contentSuggestions: analysis.contentSuggestions,
      layoutStructure: analysis.layoutStructure
    };

    // Generate a thumbnail representation (simplified mock for now)
    const thumbnailUrl = await generateThumbnail(mockupData);

    // Generate a full preview URL 
    const fullPreviewUrl = await generateFullPreview(mockupData);

    // Generate HTML content based on the template
    const htmlContent = await generateHtmlContent(mockupData);

    // Create CSS content based on the color scheme and typography
    const cssContent = generateCssContent(mockupData);

    // Insert the generated mockup into the database
    const mockupInsert: InsertGeneratedMockup = {
      requestId,
      templateName: analysis.recommendedTemplate,
      mockupData,
      thumbnailUrl,
      fullPreviewUrl,
      htmlContent,
      cssContent,
      aiAnalysisNotes: analysis.analysisNotes,
      industryRelevanceScore: analysis.industryRelevanceScore,
      conversionOptimizationScore: analysis.conversionOptimizationScore,
      accessToken,
      status: 'active'
    };

    const [generatedMockup] = await db
      .insert(generatedMockups)
      .values(mockupInsert)
      .returning({ id: generatedMockups.id });

    // Update the mockup request status to completed
    await db
      .update(mockupRequests)
      .set({ 
        status: 'completed',
        completionTime: Date.now() - new Date(mockupRequests.createdAt.name).getTime()
      })
      .where(eq(mockupRequests.id, requestId));

    return generatedMockup.id;
  } catch (error) {
    console.error('Error generating mockup:', error);
    throw error;
  }
}

/**
 * Generates a thumbnail image representation of the mockup
 */
async function generateThumbnail(mockupData: any): Promise<string> {
  // In a real implementation, this would generate an actual image
  // For now, we'll return a placeholder URL
  // TODO: Implement actual thumbnail generation using SVG or canvas
  return `/mockups/thumbnails/placeholder-${mockupData.template}.png`;
}

/**
 * Generates a full preview image of the mockup
 */
async function generateFullPreview(mockupData: any): Promise<string> {
  // In a real implementation, this would generate an actual image
  // For now, we'll return a placeholder URL
  // TODO: Implement actual preview generation
  return `/mockups/previews/placeholder-${mockupData.template}.png`;
}

/**
 * Generates HTML content based on the template and components
 */
async function generateHtmlContent(mockupData: any): Promise<string> {
  // Construct a prompt to generate the HTML structure
  const htmlPrompt = `
    Generate a clean, responsive HTML structure for a website with the following components:
    
    Template: ${mockupData.template}
    Layout Structure: ${JSON.stringify(mockupData.layoutStructure)}
    Components:
    ${Object.entries(mockupData.components).map(([section, component]) => 
      `- ${section}: ${component}`
    ).join('\n')}
    
    Content Suggestions:
    - Hero Headline: ${mockupData.contentSuggestions.heroHeadline}
    - Hero Subheadline: ${mockupData.contentSuggestions.heroSubheadline}
    - CTA Text: ${mockupData.contentSuggestions.ctaText}
    
    Please create the HTML structure using semantic HTML5 tags, proper accessibility attributes,
    and organized in a way that would work with modern CSS frameworks. Include appropriate
    container divs, sections, and component placeholders.
    
    Return only the HTML code without explanations.
  `;

  // Call XAI to generate HTML
  return await generateText(htmlPrompt, {
    model: 'grok-3-mini',
    maxTokens: 4000,
    temperature: 0.7
  });
}

/**
 * Generates CSS content based on the color scheme and typography
 */
function generateCssContent(mockupData: any): string {
  // Generate CSS variables and basic styling
  return `
:root {
  --primary: ${mockupData.colorScheme.primary};
  --secondary: ${mockupData.colorScheme.secondary};
  --accent: ${mockupData.colorScheme.accent};
  --background: ${mockupData.colorScheme.background};
  --text: ${mockupData.colorScheme.text};
  
  --heading-font: ${mockupData.typography.headingFont}, system-ui, sans-serif;
  --body-font: ${mockupData.typography.bodyFont}, system-ui, sans-serif;
}

body {
  font-family: var(--body-font);
  color: var(--text);
  background-color: var(--background);
  line-height: 1.6;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  font-weight: 700;
  line-height: 1.2;
  margin-top: 0;
  color: var(--primary);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: var(--secondary);
}

/* Additional styles would be generated based on the template */
  `;
}

/**
 * Gets all mockups for a specific request
 */
export async function getMockupsForRequest(requestId: number) {
  try {
    return await db
      .select()
      .from(generatedMockups)
      .where(eq(generatedMockups.requestId, requestId));
  } catch (error) {
    console.error('Error getting mockups for request:', error);
    throw error;
  }
}

/**
 * Gets a specific mockup by ID
 */
export async function getMockupById(mockupId: number) {
  try {
    const [mockup] = await db
      .select()
      .from(generatedMockups)
      .where(eq(generatedMockups.id, mockupId));
    return mockup;
  } catch (error) {
    console.error('Error getting mockup by ID:', error);
    throw error;
  }
}

/**
 * Gets a mockup by access token (for sharing)
 */
export async function getMockupByAccessToken(accessToken: string) {
  try {
    const [mockup] = await db
      .select()
      .from(generatedMockups)
      .where(eq(generatedMockups.accessToken, accessToken));
    return mockup;
  } catch (error) {
    console.error('Error getting mockup by access token:', error);
    throw error;
  }
}