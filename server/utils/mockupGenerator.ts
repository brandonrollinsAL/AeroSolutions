import { generateJson } from './xaiClient';
import type { ClientInput } from '@shared/schema';

// Interface for the mockup generation result
interface MockupGenerationResult {
  html: string;
  css: string;
  description: string;
  name: string;
}

/**
 * Generate a website mockup based on client input specifications
 * This function uses the Grok AI model to create HTML and CSS for a website mockup
 * 
 * @param clientInput The client input data containing business information and preferences
 * @returns An object containing the generated HTML, CSS, and metadata
 */
export async function generateWebsiteMockup(clientInput: ClientInput): Promise<MockupGenerationResult> {
  try {
    console.log('Generating website mockup for:', clientInput.businessName);
    
    // Construct a detailed prompt based on the client's input data
    const prompt = `
Generate a modern, responsive website mockup for a business with the following details:

BUSINESS INFORMATION:
- Name: ${clientInput.businessName}
- Industry: ${clientInput.industry}
- Project Description: ${clientInput.projectDescription}

DESIGN PREFERENCES:
- Color Scheme: ${clientInput.designPreferences.colorScheme}
- Style: ${clientInput.designPreferences.style}
${clientInput.budget ? `- Budget Range: ${clientInput.budget}` : ''}
${clientInput.timeline ? `- Timeline: ${clientInput.timeline}` : ''}

REQUIREMENTS:
1. Create a complete, responsive website mockup appropriate for the type of business
2. Focus on a clean, professional design that highlights the business's services/products
3. Include appropriate sections based on the industry (landing, about, services, contact, etc.)
4. Use Shadcn UI and Tailwind CSS classes for styling, with focus on responsive design
5. Implement modern design principles with appropriate typography and spacing
6. Ensure the mockup is simple enough to be loaded directly in a preview window
7. Use only HTML elements that work well with React, avoiding deprecated features

The design should be production-ready quality and follow the customer's specifications exactly.
`;

    // System prompt to guide the AI to output structured data
    const systemPrompt = `You are an expert web designer and developer who specializes in creating 
    beautiful, responsive website mockups using modern HTML and CSS (Tailwind CSS). 
    Your task is to generate a complete, production-ready website mockup based on the client's requirements.
    Always follow the provided design preferences and ensure your output is well-organized.
    
    Return your response in the following JSON format:
    {
      "name": "Descriptive name for the project",
      "description": "Brief description of the mockup design concept",
      "html": "Complete HTML code for the mockup",
      "css": "Any additional CSS styles needed beyond Tailwind"
    }
    
    Make sure the HTML includes all necessary Tailwind CSS classes and is properly structured.
    The CSS should only include styles that can't be achieved with Tailwind.`;

    // Use the Grok-3 model for better quality
    const mockupData = await generateJson<MockupGenerationResult>(prompt, {
      model: 'grok-3',
      systemPrompt,
      temperature: 0.6,
      maxTokens: 4000,
      fallbackResponse: {
        name: `${clientInput.businessName} Website`,
        description: `A professional website mockup for ${clientInput.businessName} in the ${clientInput.industry} industry.`,
        html: `<div class="min-h-screen bg-gray-50">
          <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 class="text-3xl font-bold text-gray-900">${clientInput.businessName}</h1>
            </div>
          </header>
          <main>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div class="text-center">
                <h2 class="text-base font-semibold text-indigo-600 tracking-wide uppercase">Welcome</h2>
                <p class="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                  Website mockup being generated
                </p>
                <p class="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                  We're creating a custom website design based on your preferences. This placeholder will be replaced with your actual mockup.
                </p>
              </div>
            </div>
          </main>
          <footer class="bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p class="text-center text-gray-500">© ${new Date().getFullYear()} ${clientInput.businessName}. All rights reserved.</p>
            </div>
          </footer>
        </div>`,
        css: `/* Additional styles will be generated */`
      }
    });

    console.log('Successfully generated mockup for:', clientInput.businessName);
    
    return mockupData;
  } catch (error) {
    console.error('Error generating website mockup:', error);
    
    // Provide a basic fallback in case of errors
    return {
      name: `${clientInput.businessName} Website`,
      description: `A professional website for ${clientInput.businessName} in the ${clientInput.industry} industry.`,
      html: `<div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 class="text-3xl font-bold text-gray-900">${clientInput.businessName}</h1>
          </div>
        </header>
        <main>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="text-center">
              <h2 class="text-base font-semibold text-indigo-600 tracking-wide uppercase">Error</h2>
              <p class="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Unable to generate mockup
              </p>
              <p class="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                We encountered an error while generating your website mockup. Please try again later or contact our support team.
              </p>
            </div>
          </div>
        </main>
        <footer class="bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p class="text-center text-gray-500">© ${new Date().getFullYear()} ${clientInput.businessName}. All rights reserved.</p>
          </div>
        </footer>
      </div>`,
      css: `/* No additional styles */`
    };
  }
}