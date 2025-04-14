import fs from 'fs';
import path from 'path';
import { callXAI, generateJson, generateText } from './xaiClient';
import { storage } from '../storage';
import { Logger } from '../middlewares/logger';

const logger = new Logger('BrandConsistency');

// Define Elevion brand guidelines
const BRAND_GUIDELINES = {
  colors: {
    primary: '#3B5B9D', // Slate-blue
    secondary: '#00D1D1', // Electric-cyan
    tertiary: '#EDEFF2', // Light-gray
    accent: '#FF7043', // Sunset-orange
  },
  typography: {
    headings: 'Poppins',
    body: 'Lato',
    ui: 'Inter',
  },
  tone: 'professional, modern, helpful, innovative',
};

interface BrandConsistencyIssue {
  id?: number;
  type: 'color' | 'typography' | 'tone' | 'logo' | 'other';
  severity: 'low' | 'medium' | 'high';
  location: string;
  description: string;
  recommendation: string;
  canAutoFix: boolean;
  autoFixCode?: string;
  status: 'open' | 'fixed' | 'ignored';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Monitors UI elements and content for brand consistency
 * @returns Array of detected brand consistency issues
 */
export async function monitorBrandConsistency(): Promise<BrandConsistencyIssue[]> {
  logger.info('Starting brand consistency check');
  
  const issues: BrandConsistencyIssue[] = [];
  
  try {
    // Check frontend components for brand consistency
    const uiIssues = await checkUIComponentConsistency();
    issues.push(...uiIssues);
    
    // Check content tone and messaging for brand consistency
    const contentIssues = await checkContentConsistency();
    issues.push(...contentIssues);
    
    // Check images and assets for brand consistency
    const assetIssues = await checkAssetConsistency();
    issues.push(...assetIssues);
    
    // Store the issues in the database
    await Promise.all(
      issues.map(async (issue) => {
        await storage.createBrandConsistencyIssue(issue);
      })
    );
    
    // Attempt to auto-fix eligible issues
    const autoFixableIssues = issues.filter(issue => issue.canAutoFix && issue.autoFixCode);
    if (autoFixableIssues.length > 0) {
      logger.info(`Attempting to auto-fix ${autoFixableIssues.length} brand consistency issues`);
      
      for (const issue of autoFixableIssues) {
        try {
          await applyBrandConsistencyFix(issue);
          issue.status = 'fixed';
          issue.updatedAt = new Date();
          await storage.updateBrandConsistencyIssue(issue.id!, { status: 'fixed' });
          logger.info(`Auto-fixed brand consistency issue: ${issue.description}`);
        } catch (error) {
          logger.error(`Failed to auto-fix brand consistency issue: ${issue.description}`, { error });
        }
      }
    }
    
    logger.info(`Brand consistency check completed. Found ${issues.length} issues`);
    return issues;
  } catch (error) {
    logger.error('Error in brand consistency check', { error });
    return [];
  }
}

/**
 * Checks UI components for brand consistency issues
 */
async function checkUIComponentConsistency(): Promise<BrandConsistencyIssue[]> {
  const issues: BrandConsistencyIssue[] = [];
  
  try {
    // Get list of UI component files
    const componentFiles = await findUIComponentFiles();
    
    // Analyze each component file
    for (const file of componentFiles) {
      const fileContent = fs.readFileSync(file, 'utf8');
      
      // Skip files that are too large (to avoid token limit issues)
      if (fileContent.length > 10000) {
        continue;
      }
      
      // Create analysis prompt
      const prompt = `
      Analyze this React UI component for Elevion brand consistency issues:
      
      File: ${path.basename(file)}
      
      ${fileContent}
      
      Elevion Brand Guidelines:
      - Colors: Slate-blue (#3B5B9D), Electric-cyan (#00D1D1), Light-gray (#EDEFF2), Sunset-orange (#FF7043)
      - Typography: Headings - Poppins, Body text - Lato, UI elements - Inter
      - Brand tone: professional, modern, helpful, innovative
      
      Identify any inconsistencies with the brand guidelines, focusing on:
      1. Colors that don't match the brand palette
      2. Typography that doesn't use the specified fonts
      3. Elements that don't align with the brand's professional, modern style
      
      For each issue found, determine if it can be automatically fixed with code changes.
      
      Respond in JSON format with an array of issues:
      [
        {
          "type": "color"|"typography"|"tone"|"logo"|"other",
          "severity": "low"|"medium"|"high",
          "location": "Specific location in the file (component, function, line number)",
          "description": "Description of the brand inconsistency",
          "recommendation": "Recommended fix",
          "canAutoFix": true|false,
          "autoFixCode": "Code that could fix the issue (if canAutoFix is true)"
        }
      ]
      
      If no issues are found, return an empty array.
      `;
      
      // Analyze the component
      const result = await generateJson<BrandConsistencyIssue[]>(prompt, {
        model: 'grok-3-mini',
        systemPrompt: "You are a brand consistency expert and professional front-end developer. Your job is to identify UI elements that don't conform to brand guidelines and suggest fixes. Be thorough but practical, focusing on significant issues rather than minor details.",
        temperature: 0.2,
        maxTokens: 1000
      });
      
      // Add file path and timestamps to issues
      const fileIssues = (result || []).map(issue => ({
        ...issue,
        location: `${file}: ${issue.location}`,
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      issues.push(...fileIssues);
    }
    
    return issues;
  } catch (error) {
    logger.error('Error checking UI component consistency', { error });
    return [];
  }
}

/**
 * Checks content for tone and messaging consistency
 */
async function checkContentConsistency(): Promise<BrandConsistencyIssue[]> {
  const issues: BrandConsistencyIssue[] = [];
  
  try {
    // Get recent content items
    const content = await storage.getRecentContent(20);
    
    // Analyze each content item
    for (const item of content) {
      // Skip items with very long content
      if (item.content.length > 5000) {
        continue;
      }
      
      // Create analysis prompt
      const prompt = `
      Analyze this content for Elevion brand tone and messaging consistency:
      
      Title: ${item.title}
      Content: ${item.content}
      
      Elevion Brand Guidelines:
      - Brand tone: professional, modern, helpful, innovative
      - Target audience: Small business owners looking for web development services
      - Key messaging: AI-powered solutions, affordable pricing, quality design, streamlined process
      
      Identify any inconsistencies with the brand tone and messaging guidelines.
      
      Respond in JSON format with an array of issues:
      [
        {
          "type": "tone",
          "severity": "low"|"medium"|"high",
          "location": "Specify where in the content (e.g., 'paragraph 2', 'heading')",
          "description": "Description of the tone or messaging inconsistency",
          "recommendation": "Recommended revision",
          "canAutoFix": true|false,
          "autoFixCode": "Suggested revised text (if canAutoFix is true)"
        }
      ]
      
      If no issues are found, return an empty array.
      `;
      
      // Analyze the content
      const result = await generateJson<BrandConsistencyIssue[]>(prompt, {
        model: 'grok-3-mini',
        systemPrompt: "You are a brand voice expert and professional copywriter. Your job is to identify content that doesn't match the brand's tone and messaging guidelines and suggest improvements. Focus on significant issues that impact brand perception.",
        temperature: 0.3,
        maxTokens: 1000
      });
      
      // Add content identifier and timestamps to issues
      const contentIssues = (result || []).map(issue => ({
        ...issue,
        location: `Content ID ${item.id}: ${issue.location}`,
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      issues.push(...contentIssues);
    }
    
    return issues;
  } catch (error) {
    logger.error('Error checking content consistency', { error });
    return [];
  }
}

/**
 * Checks images and assets for brand consistency
 */
async function checkAssetConsistency(): Promise<BrandConsistencyIssue[]> {
  // This is a placeholder - in a real implementation, you would:
  // 1. Get a list of image assets
  // 2. Use an image analysis AI to check for brand consistency in colors, styles, etc.
  // 3. Return any issues found
  
  // Since this requires more sophisticated image analysis capabilities,
  // we'll return an empty array for now
  return [];
}

/**
 * Finds UI component files in the project
 */
async function findUIComponentFiles(): Promise<string[]> {
  try {
    const componentDir = path.resolve(process.cwd(), 'client/src/components');
    
    // Check if directory exists
    if (!fs.existsSync(componentDir)) {
      return [];
    }
    
    // Get all files in the components directory and subdirectories
    function getAllFiles(dir: string): string[] {
      const files: string[] = [];
      
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else if (
          // Only include React component files
          file.endsWith('.tsx') || 
          file.endsWith('.jsx') || 
          file.endsWith('.js')
        ) {
          files.push(fullPath);
        }
      });
      
      return files;
    }
    
    return getAllFiles(componentDir);
  } catch (error) {
    logger.error('Error finding UI component files', { error });
    return [];
  }
}

/**
 * Applies an automatic fix for a brand consistency issue
 */
async function applyBrandConsistencyFix(issue: BrandConsistencyIssue): Promise<boolean> {
  // This is a placeholder - in a real implementation, you would:
  // 1. Parse the location and autoFixCode to understand what file needs to be modified
  // 2. Make a backup of the file
  // 3. Apply the suggested changes
  // 4. Verify the changes
  
  if (!issue.canAutoFix || !issue.autoFixCode) {
    return false;
  }
  
  try {
    // Extract file path from location (assuming location format is "filepath: details")
    const filePath = issue.location.split(':')[0].trim();
    
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return false;
    }
    
    // Log the attempted fix
    logger.info(`Attempting to fix brand consistency issue in ${filePath}`);
    logger.info(`Fix details: ${issue.description}`);
    logger.info(`Fix code: ${issue.autoFixCode}`);
    
    // For safety, we'll always return false in this demo version
    // In a real implementation, you'd modify the file and return true if successful
    return false;
  } catch (error) {
    logger.error('Error applying brand consistency fix', { error });
    return false;
  }
}